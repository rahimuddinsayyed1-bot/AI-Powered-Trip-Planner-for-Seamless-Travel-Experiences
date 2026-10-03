# Cold Start Strategy in GRec_Tr-LLM

Traditional recommender systems, including the original GRec_Tr baseline, fail dramatically when a new user joins a group because there are no historical `interactions` (ratings/clicks) to compute Pearson correlation or Collaborative Filtering embeddings.

In GRec_Tr-LLM, we resolve the cold-start problem structurally by bridging the LLM Preference Parser (Phase 2) with the Heterogeneous Graph (Phase 5).

## How it works

1. **New User Enters System**
   A new user (e.g., $U_{new}$) enters the system and provides natural language preferences ("I want a cheap beach holiday").

2. **LLM Parsing -> Node Features**
   The LLM parses this into our strictly defined `UserPreferences` Pydantic model (e.g., `target_budget` = 500, `preferred_destination_types` = ["beach"]).
   
   Instead of relying on a pre-trained ID embedding lookup table (which wouldn't exist for $U_{new}$), the Graph Neural Network uses **Node Features**. The parsed JSON is mapped directly to the numerical feature vector $X_u$ for the new user node.

3. **Virtual Edges (Preference Links)**
   Before running the HGAT forward pass, we create temporary "virtual edges" in the graph:
   * `(User, prefers, Activity)`
   * `(User, prefers_type, Destination)`
   
   If $U_{new}$ prefers "beach", we draw an edge from $U_{new}$ to all Destination nodes of type "beach".

4. **HGAT Forward Pass**
   The Heterogeneous Graph Attention Network aggregates information from neighbors. Because $U_{new}$ is connected to Beach destinations and has a $500 budget feature, the HGAT naturally aggregates the embeddings of these connected entities. 
   
   Thus, $U_{new}$ immediately receives a rich, contextualized embedding vector in the latent space *before they have ever rated a single travel package*.

This mathematically integrates conversational AI capabilities directly into the deep learning embedding space without requiring retraining.
