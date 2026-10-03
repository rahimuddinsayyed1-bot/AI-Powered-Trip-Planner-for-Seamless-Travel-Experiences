import os
import sys

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.graph.build_graph import GraphBuilder

def run_graph_tests():
    print("==================================================")
    print("--- Testing Heterogeneous Graph Construction ---")
    print("==================================================\n")
    
    data_dir = os.path.join(os.path.dirname(__file__), '../data/synthetic')
    
    try:
        builder = GraphBuilder(data_dir=data_dir)
        hetero_data = builder.build()
        
        print("[SUCCESS] HeteroData object successfully constructed!\n")
        
        print("=== Node Types & Feature Shapes ===")
        for node_type in hetero_data.node_types:
            shape = hetero_data[node_type].x.shape
            print(f" - {node_type.capitalize()}: {shape[0]} nodes, {shape[1]} features")
            
        print("\n=== Edge Types & Connection Counts ===")
        for edge_type in hetero_data.edge_types:
            num_edges = hetero_data[edge_type].edge_index.shape[1]
            # Format edge tuple for readability
            edge_name = f"({edge_type[0]} -> {edge_type[1]} -> {edge_type[2]})"
            print(f" - {edge_name}: {num_edges} edges")
            
        print("\n=== Verification ===")
        if hetero_data.has_isolated_nodes():
            print(" [!] Warning: Graph contains isolated nodes.")
        else:
            print(" [INFO] Graph topology looks healthy (no entirely isolated node types).")
            
        print(f" [INFO] Is directed: {hetero_data.is_directed()}")
        
    except ImportError as e:
        print(f"\n[ERROR] PyTorch / PyG is not installed or configured correctly: {e}")
        print("Run: pip install torch torchvision torchaudio")
        print("Then: pip install torch_geometric")
    except Exception as e:
        print(f"\n[ERROR] Failed to build graph: {e}")

    print("\n==================================================")

if __name__ == "__main__":
    run_graph_tests()
