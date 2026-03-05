"""
Create a simple price predictor ONNX model for OpenGradient Hub
"""
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType
import warnings
warnings.filterwarnings('ignore')

# Generate synthetic training data for price prediction
# Features: [volume, prev_price, market_cap_ratio, sentiment_score]
np.random.seed(42)
n_samples = 1000

# Generate features
volume = np.random.uniform(100, 10000, n_samples)
prev_price = np.random.uniform(10, 1000, n_samples)  
market_cap_ratio = np.random.uniform(0.01, 0.5, n_samples)
sentiment_score = np.random.uniform(-1, 1, n_samples)

X = np.column_stack([volume, prev_price, market_cap_ratio, sentiment_score])

# Generate target (next price) with some realistic relationship
noise = np.random.normal(0, 5, n_samples)
y = (prev_price * 1.02 +  # trend
     volume * 0.001 +      # volume effect
     sentiment_score * 10 + # sentiment effect
     noise)

# Scale features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Train model
model = LinearRegression()
model.fit(X_scaled, y)

print(f"Model trained. R² score: {model.score(X_scaled, y):.4f}")

# Convert to ONNX
initial_type = [('input', FloatTensorType([None, 4]))]
onnx_model = convert_sklearn(model, initial_types=initial_type, target_opset=13)

# Save ONNX model
with open('price_predictor.onnx', 'wb') as f:
    f.write(onnx_model.SerializeToString())

print("Model saved as price_predictor.onnx")

# Verify the model
try:
    import onnx
    loaded_model = onnx.load('price_predictor.onnx')
    onnx.checker.check_model(loaded_model)
    print("✅ ONNX model validated successfully!")
    print(f"   Input: {[i.name for i in loaded_model.graph.input]}")
    print(f"   Output: {[o.name for o in loaded_model.graph.output]}")
except Exception as e:
    print(f"Validation note: {e}")

print("\nModel is ready for upload to OpenGradient Hub!")
