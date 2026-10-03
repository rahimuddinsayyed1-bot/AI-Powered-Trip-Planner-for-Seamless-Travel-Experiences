# pyrefly: ignore [missing-import]
import torch
# pyrefly: ignore [missing-import]
from torch import nn
# pyrefly: ignore [missing-import]
import torch.nn.functional as F
# pyrefly: ignore [missing-import]
from torch_geometric.nn import HeteroConv, GATConv, Linear

class HGATRecommender(nn.Module):
    def __init__(self, hidden_channels: int, out_channels: int, num_heads: int = 2):
        """
        Heterogeneous Graph Attention Network for Recommender Systems.
        Projects all node types to a common embedding space, then applies GAT.
        """
        super().__init__()
        
        self.hidden_channels = hidden_channels
        self.out_channels = out_channels
        
        # 1. Feature Projection Layers
        # We use lazy initialization (-1) since input feature dims vary by node type
        self.lin_dict = nn.ModuleDict({
            'user': Linear(-1, hidden_channels),
            'group': Linear(-1, hidden_channels),
            'destination': Linear(-1, hidden_channels),
            'hotel': Linear(-1, hidden_channels),
            'activity': Linear(-1, hidden_channels),
        })
        
        # 2. First Layer: Heterogeneous Graph Attention
        # GATConv computes attention weights between connected nodes
        self.conv1 = HeteroConv({
            ('user', 'rated', 'destination'): GATConv((-1, -1), hidden_channels, heads=num_heads, add_self_loops=False),
            ('destination', 'rev_rated', 'user'): GATConv((-1, -1), hidden_channels, heads=num_heads, add_self_loops=False),
            
            ('destination', 'has', 'hotel'): GATConv((-1, -1), hidden_channels, heads=num_heads, add_self_loops=False),
            ('hotel', 'rev_has', 'destination'): GATConv((-1, -1), hidden_channels, heads=num_heads, add_self_loops=False),
            
            ('destination', 'has', 'activity'): GATConv((-1, -1), hidden_channels, heads=num_heads, add_self_loops=False),
            ('activity', 'rev_has', 'destination'): GATConv((-1, -1), hidden_channels, heads=num_heads, add_self_loops=False),
            
            ('user', 'member_of', 'group'): GATConv((-1, -1), hidden_channels, heads=num_heads, add_self_loops=False),
            ('group', 'rev_member_of', 'user'): GATConv((-1, -1), hidden_channels, heads=num_heads, add_self_loops=False),
        }, aggr='sum')
        
        # 3. Second Layer: Graph Attention
        self.conv2 = HeteroConv({
            ('user', 'rated', 'destination'): GATConv((-1, -1), out_channels, heads=1, add_self_loops=False),
            ('destination', 'rev_rated', 'user'): GATConv((-1, -1), out_channels, heads=1, add_self_loops=False),
            
            ('destination', 'has', 'hotel'): GATConv((-1, -1), out_channels, heads=1, add_self_loops=False),
            ('hotel', 'rev_has', 'destination'): GATConv((-1, -1), out_channels, heads=1, add_self_loops=False),
            
            ('destination', 'has', 'activity'): GATConv((-1, -1), out_channels, heads=1, add_self_loops=False),
            ('activity', 'rev_has', 'destination'): GATConv((-1, -1), out_channels, heads=1, add_self_loops=False),
            
            ('user', 'member_of', 'group'): GATConv((-1, -1), out_channels, heads=1, add_self_loops=False),
            ('group', 'rev_member_of', 'user'): GATConv((-1, -1), out_channels, heads=1, add_self_loops=False),
        }, aggr='sum')

    def forward(self, x_dict, edge_index_dict):
        # Apply linear projections
        h_dict = {node_type: F.leaky_relu(self.lin_dict[node_type](x)) 
                  for node_type, x in x_dict.items()}
        
        # First HeteroConv Layer
        h_dict = self.conv1(h_dict, edge_index_dict)
        h_dict = {node_type: F.leaky_relu(x) for node_type, x in h_dict.items()}
        
        # Second HeteroConv Layer
        h_dict = self.conv2(h_dict, edge_index_dict)
        
        return h_dict

class RatingPredictor(nn.Module):
    def __init__(self, embedding_dim: int):
        """
        Takes user and destination embeddings and predicts a rating.
        Uses a neural network head rather than just dot product to capture complex relationships.
        """
        super().__init__()
        self.lin1 = nn.Linear(embedding_dim * 2, 32)
        self.lin2 = nn.Linear(32, 1)
        
    def forward(self, user_emb, dest_emb, edge_index):
        # Extract source and target node embeddings for the specific edges
        row, col = edge_index
        u_emb = user_emb[row]
        d_emb = dest_emb[col]
        
        # Concatenate and pass through MLP
        cat_emb = torch.cat([u_emb, d_emb], dim=-1)
        x = F.relu(self.lin1(cat_emb))
        x = self.lin2(x)
        
        # Ratings are 1-5, so we can use a scaled sigmoid or leave as raw regression
        # For stability, we output raw logits/regression values and use MSELoss
        return x.view(-1)
