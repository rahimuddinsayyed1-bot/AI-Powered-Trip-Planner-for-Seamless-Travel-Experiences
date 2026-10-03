import streamlit as st
import os
import sys
import yaml
import pandas as pd
import numpy as np

# Ensure modules can be resolved
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.nlp.preference_parser import PreferenceParser
from src.recommendation.integrated_package import IntegratedPackageRecommender
from src.recommendation.baseline import BaselineRecommender
from dotenv import load_dotenv

load_dotenv()

# --- Config & Initialization ---
st.set_page_config(page_title="GRec_Tr-LLM", layout="wide", page_icon="✈️")

@st.cache_resource
def load_recommender():
    data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../data/synthetic'))
    config_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../config.yaml'))
    with open(config_path, 'r') as file:
        config = yaml.safe_load(file)
    weights = config.get('ranking_weights', {'alpha_hgat': 0.25, 'beta_fuzzy': 0.25, 'gamma_mcdm': 0.25, 'delta_nash': 0.25})
    return IntegratedPackageRecommender(data_dir=data_dir, weights=weights)

@st.cache_resource
def load_baseline():
    data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../data/synthetic'))
    return BaselineRecommender(data_dir)

recommender = load_recommender()
baseline_recommender = load_baseline()

# --- Sidebar ---
st.sidebar.title("⚙️ GRec_Tr-LLM Config")
st.sidebar.markdown("Research Prototype for LLM-Enhanced Group Travel Recommendation.")

parser_mode = st.sidebar.radio(
    "NLP Parsing Engine",
    ["Gemini (Free/Generative)", "Mock LLM (Regex Fallback)"]
)

api_key = ""
if parser_mode == "Gemini (Free/Generative)":
    api_key = st.sidebar.text_input("Gemini API Key", type="password", value=os.getenv("GEMINI_API_KEY", ""))

if 'members' not in st.session_state:
    st.session_state.members = [
        {"id": "U1", "text": "I want a relaxing beach holiday. My budget is $1500 max."},
        {"id": "U2", "text": "I love city tours and sightseeing. Budget is around $2500, but I don't want flights longer than 6 hours."},
        {"id": "U3", "text": "I'm a broke college student looking for an adventure. I can only spend $700!"}
    ]

# --- Main UI ---
st.title("🌍 GRec_Tr-LLM: Group Travel Recommender")
st.markdown("**(LLM + HGAT + Fuzzy Logic + TOPSIS + Nash Bargaining)**")

st.header("1. Group Members & Conversational Preferences")

# Member Input UI
for i, member in enumerate(st.session_state.members):
    cols = st.columns([1, 4, 1])
    with cols[0]:
        st.text_input("User ID", value=member['id'], key=f"uid_{i}", disabled=True)
    with cols[1]:
        st.session_state.members[i]['text'] = st.text_input("Conversational Preferences", value=member['text'], key=f"text_{i}")
    with cols[2]:
        if st.button("❌ Remove", key=f"rem_{i}"):
            st.session_state.members.pop(i)
            st.rerun()

if st.button("➕ Add Group Member"):
    new_id = f"U{len(st.session_state.members) + 1}"
    st.session_state.members.append({"id": new_id, "text": ""})
    st.rerun()

st.divider()

if st.button("🚀 Generate Group Travel Recommendations", type="primary"):
    if parser_mode == "Gemini (Free/Generative)" and not api_key:
        st.error("Please provide an API Key for Gemini or select Mock Mode.")
    else:
        with st.spinner("Executing Pipeline..."):
            
            # Phase 2: NLP Parsing
            st.subheader("2. Extracted Structured Preferences (LLM)")
            
            use_mock = parser_mode == "Mock LLM (Regex Fallback)"
            
            try:
                parser = PreferenceParser(api_key=api_key, use_mock=use_mock)
            except Exception as e:
                st.error(f"Failed to initialize parser: {e}")
                st.stop()
            
            parsed_prefs = []
            cols = st.columns(len(st.session_state.members))
            for i, member in enumerate(st.session_state.members):
                try:
                    pref = parser.parse_preferences(member['text'], member['id'])
                    parsed_prefs.append(pref)
                    with cols[i]:
                        st.info(f"**{member['id']} Extracted Constraints**")
                        with st.expander("View JSON", expanded=True):
                            st.json(pref.model_dump())
                except Exception as e:
                    st.error(f"Failed to parse for {member['id']}: {e}")
            
            if len(parsed_prefs) == len(st.session_state.members):
                # Phase 3: Ablation Models UI
                st.divider()
                st.header("3. Ablation Analysis: How the Models Refine Recommendations")
                
                # --- Run Baseline ---
                base_recs = baseline_recommender.recommend_for_group("G1", parsed_prefs, strategy="average", top_k=1)
                best_base = base_recs[0] if base_recs else None
                
                # --- Run Proposed Model Pipeline ---
                # Get all candidate packages scored by the pipeline
                all_packages = recommender.recommend(parsed_prefs, top_k=1000)
                
                if not all_packages:
                    st.error("No packages could be generated.")
                    st.stop()
                    
                pkg_full = all_packages[0]
                
                # Sort for ablations using the pre-computed metrics inside the packages
                pkg_hgat = sorted(all_packages, key=lambda x: x['avg_hgat'], reverse=True)[0]
                pkg_fuzzy = sorted(all_packages, key=lambda x: (x['avg_hgat']/5.0) + x['avg_fuzzy'], reverse=True)[0]
                pkg_mcdm = sorted(all_packages, key=lambda x: x.get('topsis_score', 0.0), reverse=True)[0]
                
                # Render Tabs for each model
                tabs = st.tabs(["1. Baseline (Standard CF)", "2. LLM + HGAT", "3. LLM + HGAT + Fuzzy", "4. Full Model (Nash)"])
                
                def render_pkg(pkg, title, is_base=False):
                    st.markdown(f"### {title}")
                    if not pkg:
                        st.error("No package found! Constraints were too strict.")
                        return
                    
                    st.markdown(f"**Destination:** {pkg['name']} ({pkg['type']})")
                    if is_base:
                        st.markdown("**Note:** The baseline ignores fuzzy logic and HGAT exploration, picking purely average historical destinations.")
                    else:
                        st.markdown(f"**Hotel:** {pkg['hotel']} ({pkg['hotel_rating']}⭐) | **Flight:** ₹{pkg['flight_cost']} ({pkg['flight_time']}h)")
                        st.markdown(f"**Activities:** {', '.join(pkg['activities'])}")
                        
                        st.caption("ℹ️ *Note: Flight, Hotel, and Activity candidates are from deterministic Synthetic Candidate Catalogs generated during preprocessing.*")
                        
                        m1, m2, m3 = st.columns(3)
                        m1.metric("Est. Cost", f"₹{pkg['total_cost']:.2f}")
                        m2.metric("HGAT Prediction", f"{pkg['avg_hgat']:.2f} / 5.0")
                        if 'norm_nash' in pkg:
                            m3.metric("Nash Fairness", f"{pkg['norm_nash']:.4f}")
                        
                        st.markdown("#### Individual Member Satisfaction (Utility)")
                        util_df = pd.DataFrame(list(pkg['member_utilities'].items()), columns=['User', 'Utility'])
                        st.bar_chart(util_df.set_index('User'), height=150)
                
                with tabs[0]:
                    render_pkg(best_base, "Baseline Recommendation", is_base=True)
                with tabs[1]:
                    render_pkg(pkg_hgat, "Exploration without constraints (HGAT Only)")
                with tabs[2]:
                    render_pkg(pkg_fuzzy, "Constraint-Enforced Recommendation (HGAT + Fuzzy)")
                with tabs[3]:
                    render_pkg(pkg_full, "Optimal Fair Package (GRec_Tr-LLM)")
                    st.success("🏆 This is the final recommended package that maximizes overall group fairness!")
