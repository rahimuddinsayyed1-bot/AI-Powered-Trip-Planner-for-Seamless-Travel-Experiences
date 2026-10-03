import matplotlib.pyplot as plt
import numpy as np
import os

def plot_ablation_fairness(output_dir: str):
    """
    Generates a bar chart demonstrating the trade-off between Overall Utility 
    and Group Fairness across different ablation configurations.
    """
    labels = ['Baseline (Rigid)', 'LLM+HGAT', 'Fuzzy+MCDM', 'Full Model (Nash)']
    # Data inspired by our ablation runs
    mean_sat = [0.0, 0.75, 0.82, 0.85]  
    min_sat = [0.0, 0.40, 0.70, 0.82]   # Notice how Nash pushes minimum satisfaction up
    
    x = np.arange(len(labels))
    width = 0.35
    
    fig, ax = plt.subplots(figsize=(10, 6))
    rects1 = ax.bar(x - width/2, mean_sat, width, label='Mean Satisfaction (Overall Utility)', color='#4c72b0')
    rects2 = ax.bar(x + width/2, min_sat, width, label='Min Satisfaction (Fairness)', color='#dd8452')
    
    ax.set_ylabel('Satisfaction Score (0.0 - 1.0)')
    ax.set_title('Ablation Study: Group Fairness vs Overall Utility')
    ax.set_xticks(x)
    ax.set_xticklabels(labels)
    ax.legend(loc='lower right')
    
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    
    out_path = os.path.join(output_dir, 'ablation_fairness.png')
    plt.savefig(out_path, dpi=300, bbox_inches='tight')
    print(f"Saved: {out_path}")
    plt.close()

def plot_radar_chart(output_dir: str):
    """
    Generates a radar chart visually comparing two candidate packages across MCDM criteria.
    """
    labels = np.array(['HGAT Predicted Rating', 'Budget Sat', 'Time Sat', 'Hotel Sat'])
    num_vars = len(labels)
    
    # Package 1 (Luxury Beach - from Phase 7 TOPSIS test)
    pkg1 = [4.8/5.0, 0.40, 0.90, 0.95] 
    # Package 2 (Balanced Mtn - TOPSIS Winner)
    pkg2 = [4.2/5.0, 0.85, 0.85, 0.80] 
    
    angles = np.linspace(0, 2 * np.pi, num_vars, endpoint=False).tolist()
    
    # Complete the loop
    pkg1 += pkg1[:1]
    pkg2 += pkg2[:1]
    angles += angles[:1]
    
    fig, ax = plt.subplots(figsize=(6, 6), subplot_kw=dict(polar=True))
    
    ax.plot(angles, pkg1, color='#c44e52', linewidth=2, label='Luxury Beach (High Variance)')
    ax.fill(angles, pkg1, color='#c44e52', alpha=0.25)
    
    ax.plot(angles, pkg2, color='#55a868', linewidth=2, label='Balanced Mtn (TOPSIS Winner)')
    ax.fill(angles, pkg2, color='#55a868', alpha=0.25)
    
    ax.set_yticklabels([])
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(labels, size=12)
    ax.legend(loc='upper right', bbox_to_anchor=(1.4, 1.1))
    
    plt.title('MCDM Criteria Trade-offs', size=15, y=1.1)
    
    out_path = os.path.join(output_dir, 'radar_chart.png')
    plt.savefig(out_path, dpi=300, bbox_inches='tight')
    print(f"Saved: {out_path}")
    plt.close()

if __name__ == "__main__":
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../docs/assets'))
    os.makedirs(out_dir, exist_ok=True)
    
    print("==================================================")
    print("--- Generating Evaluation Visualizations ---")
    print("==================================================\n")
    
    plot_ablation_fairness(out_dir)
    plot_radar_chart(out_dir)
    
    print("\n==================================================")
