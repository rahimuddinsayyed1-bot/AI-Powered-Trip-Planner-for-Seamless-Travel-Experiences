import os
import sys

# Reconfigure stdout to utf-8 for Windows consoles printing '₹'
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Add project root to sys.path so modules can be resolved
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.nlp.preference_parser import PreferenceParser

def run_tests():
    print("=========================================")
    print("--- Testing NLP Preference Parser ---")
    print("=========================================\n")
    
    # Initialize with mock mode to avoid requiring API keys for this demo
    parser = PreferenceParser(use_mock=True)
    
    # Test Case 1: The standard example provided in the requirements
    sample_input_1 = "I want a beach destination, preferably somewhere peaceful. My budget is around ₹30,000 and I don't want long flights."
    user_id_1 = "U1001"
    
    print(f"--> [Input Text] ({user_id_1}):\n'{sample_input_1}'\n")
    
    try:
        # The parser returns a strongly typed Pydantic object
        prefs = parser.parse_preferences(text=sample_input_1, user_id=user_id_1)
        
        print("--> [Parsed Output] (JSON):")
        # model_dump_json() ensures we see the validated structure
        print(prefs.model_dump_json(indent=2))
        print("\n[Test Result]: SUCCESS")
    except Exception as e:
        print(f"\n[Test Result]: FAILED - {e}")
        
    print("\n=========================================")

if __name__ == "__main__":
    run_tests()
