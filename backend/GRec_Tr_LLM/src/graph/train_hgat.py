import os
import sys
import torch
import torch.nn.functional as F
import torch_geometric.transforms as T
import math
import json

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from src.graph.build_graph import GraphBuilder
from src.graph.hgat_model import HGATRecommender, RatingPredictor
from src.schemas.feature_schema import DEST_TYPES, ACT_CATEGORIES, NORM_CONSTANTS

def set_seed(seed=42):
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    import numpy as np
    np.random.seed(seed)

def train_hgat_demo(epochs: int = 50, patience: int = 5):
    set_seed(42)
    print("==================================================")
    print("--- Training HGAT Model (Research Quality) ---")
    print("==================================================\n")
    
    # 1. Load Data and build graph
    data_dir = os.path.join(os.path.dirname(__file__), '../../data/synthetic')
    builder = GraphBuilder(data_dir=data_dir)
    data = builder.build()
    
    # 2. Random Link Split (70/15/15)
    # This prevents edge leakage. The graph is directed right now.
    transform = T.RandomLinkSplit(
        num_val=0.15,
        num_test=0.15,
        is_undirected=False, # We will add reverse edges after split
        edge_types=[('user', 'rated', 'destination')],
        rev_edge_types=[('destination', 'rev_rated', 'user')],
        add_negative_train_samples=False # We are doing regression on existing ratings
    )
    
    train_data, val_data, test_data = transform(data)
    
    # Now make them undirected so HGAT can do message passing both ways
    train_data = T.ToUndirected()(train_data)
    val_data = T.ToUndirected()(val_data)
    test_data = T.ToUndirected()(test_data)
    
    print(f"[INFO] Graph split: Train={train_data['user', 'rated', 'destination'].edge_index.size(1)}, "
          f"Val={val_data['user', 'rated', 'destination'].edge_label_index.size(1)}, "
          f"Test={test_data['user', 'rated', 'destination'].edge_label_index.size(1)}")
    
    # 3. Initialize Models
    hidden_channels = 64
    out_channels = 32
    
    model = HGATRecommender(hidden_channels=hidden_channels, out_channels=out_channels, num_heads=4)
    predictor = RatingPredictor(embedding_dim=out_channels)
    
    # Need to initialize lazy layers with a dummy forward pass
    with torch.no_grad():
        out = model(train_data.x_dict, train_data.edge_index_dict)
        predictor(out['user'], out['destination'], train_data['user', 'rated', 'destination'].edge_index)
        
    optimizer = torch.optim.Adam(
        list(model.parameters()) + list(predictor.parameters()), 
        lr=0.005, 
        weight_decay=1e-4
    )
    
    best_val_loss = float('inf')
    best_model_state = None
    best_pred_state = None
    patience_counter = 0
    
    for epoch in range(1, epochs + 1):
        # -- TRAIN --
        model.train()
        predictor.train()
        optimizer.zero_grad()
        
        node_embeddings = model(train_data.x_dict, train_data.edge_index_dict)
        
        train_edge_index = train_data['user', 'rated', 'destination'].edge_label_index
        train_true = train_data['user', 'rated', 'destination'].edge_label * 5.0 # un-normalize
        
        pred_ratings = predictor(node_embeddings['user'], node_embeddings['destination'], train_edge_index)
        loss = F.mse_loss(pred_ratings, train_true)
        
        loss.backward()
        optimizer.step()
        
        # -- VALIDATE --
        model.eval()
        predictor.eval()
        with torch.no_grad():
            val_embeddings = model(val_data.x_dict, val_data.edge_index_dict)
            val_edge_index = val_data['user', 'rated', 'destination'].edge_label_index
            val_true = val_data['user', 'rated', 'destination'].edge_label * 5.0
            
            val_preds = predictor(val_embeddings['user'], val_embeddings['destination'], val_edge_index)
            val_loss = F.mse_loss(val_preds, val_true).item()
            
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            patience_counter = 0
            best_model_state = model.state_dict()
            best_pred_state = predictor.state_dict()
        else:
            patience_counter += 1
            
        if epoch % 5 == 0 or epoch == 1:
            print(f"Epoch {epoch:02d} | Train MSE: {loss.item():.4f} | Val MSE: {val_loss:.4f}")
            
        if patience_counter >= patience:
            print(f"Early stopping at epoch {epoch}")
            break
            
    # -- TEST --
    model.load_state_dict(best_model_state)
    predictor.load_state_dict(best_pred_state)
    model.eval()
    predictor.eval()
    
    with torch.no_grad():
        test_embeddings = model(test_data.x_dict, test_data.edge_index_dict)
        test_edge_index = test_data['user', 'rated', 'destination'].edge_label_index
        test_true = test_data['user', 'rated', 'destination'].edge_label * 5.0
        
        test_preds = predictor(test_embeddings['user'], test_embeddings['destination'], test_edge_index)
        test_mse = F.mse_loss(test_preds, test_true).item()
        test_mae = F.l1_loss(test_preds, test_true).item()
        test_rmse = math.sqrt(test_mse)
        
        # Calculate R^2
        mean_true = torch.mean(test_true)
        ss_tot = torch.sum((test_true - mean_true) ** 2)
        ss_res = torch.sum((test_true - test_preds) ** 2)
        r2_score = 1 - (ss_res / ss_tot).item()
        
    print(f"\n[SUCCESS] Training Complete. Best Val MSE: {best_val_loss:.4f}")
    print(f"--- Final Test Metrics ---")
    print(f"RMSE: {test_rmse:.4f}")
    print(f"MAE:  {test_mae:.4f}")
    print(f"R²:   {r2_score:.4f}")
    
    print("\n--- Saving Best Models ---")
    models_dir = os.path.join(os.path.dirname(__file__), '../../models')
    os.makedirs(models_dir, exist_ok=True)
    
    torch.save(best_model_state, os.path.join(models_dir, 'hgat_model.pth'))
    torch.save(best_pred_state, os.path.join(models_dir, 'hgat_predictor.pth'))
    
    metadata = {
        'metrics': {
            'rmse': test_rmse,
            'mae': test_mae,
            'r2': r2_score
        },
        'schema': {
            'DEST_TYPES': DEST_TYPES,
            'ACT_CATEGORIES': ACT_CATEGORIES,
            'NORM_CONSTANTS': NORM_CONSTANTS
        },
        'architecture': {
            'hidden_channels': hidden_channels,
            'out_channels': out_channels
        },
        'random_seed': 42
    }
    with open(os.path.join(models_dir, 'preprocessing_metadata.json'), 'w') as f:
        json.dump(metadata, f, indent=4)
        
    print(f"[SUCCESS] Models and metadata saved to {models_dir}")
        
if __name__ == "__main__":
    train_hgat_demo()
