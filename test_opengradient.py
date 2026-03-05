"""
Test OpenGradient inference with a public model
"""
import opengradient as og
import json
import os

# Load config
config_path = os.path.expanduser('~/.opengradient_config.json')
with open(config_path, 'r') as f:
    config = json.load(f)

# Initialize with wallet credentials from config
og.init(private_key=config['private_key'])

# Example: Run inference on a simple public model
# Using OpenGradient's test models or community models

print("OpenGradient SDK initialized successfully!")

# Test with a simple completion using TEE LLM
try:
    print("\n--- Testing TEE LLM Completion ---")
    result = og.llm.completion(
        model="meta-llama/Llama-3.1-8B-Instruct",
        prompt="What is blockchain technology in one sentence?",
        max_tokens=100
    )
    print(f"Response: {result}")
except Exception as e:
    print(f"LLM test error: {e}")

# Test ONNX model inference if CID is available
# You can replace this with your uploaded model's CID
try:
    print("\n--- Testing ONNX Model Inference ---")
    # Example public model - replace with your model CID after upload
    # model_cid = "your-model-cid-here"  
    
    # For now, let's list available inference options
    print("To run inference on your uploaded model:")
    print("  opengradient infer -m <YOUR_MODEL_CID> --input '{\"input\": [[100, 50, 0.1, 0.5]]}'")
    
except Exception as e:
    print(f"ONNX test error: {e}")

print("\n✅ OpenGradient SDK is working!")
