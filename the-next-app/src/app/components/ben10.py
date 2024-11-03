from flask import Flask, request, jsonify
import pickle
import numpy as np

app = Flask(__name__)

# Load model and scaler
with open('regressor.pkl', 'rb') as modelfile:
    model = pickle.load(modelfile)
with open('scaler.pkl', 'rb') as scalerfile:
    scaler = pickle.load(scalerfile)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json  # Get JSON data from request

    # Extract and arrange input data
    input_data = [
        data['x_asec'],
        data['y_asec'],
        data['radial'],
        data['peak_cs'],
        data['total_counts'],
        data['active_region_ar'],
        data['energy_low_ev'],
        data['energy_high_ev']
    ]
    input_data = np.array(input_data).reshape(1, -1)

    # Scale and predict
    input_data_scaled = scaler.transform(input_data)
    predicted_duration = model.predict(input_data_scaled)

    return jsonify({'predicted_duration': predicted_duration[0]})

if __name__ == '__main':
    app.run(port=5000)
