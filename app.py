import streamlit as st
import pandas as pd
import numpy as np
import pickle
import matplotlib.pyplot as plt
import seaborn as sns

# Load the model and scaler
with open('regressor.pkl', 'rb') as f:
    knn = pickle.load(f)

with open('scaler.pkl', 'rb') as f:
    scaler = pickle.load(f)


# Load the data
@st.cache_data
def load_data():
    df = pd.read_csv('solar_flare.csv')
    df['start.time'] = pd.to_datetime(df['start.date'] + ' ' + df['start.time'])
    df['peak'] = pd.to_datetime(df['start.date'] + ' ' + df['peak'])
    df['end'] = pd.to_datetime(df['start.date'] + ' ' + df['end'])
    df = df[df['start.time'] > '2010-12-31 23:59:59']
    df[['energy_low_ev', 'energy_high_ev']] = df['energy.kev'].str.split('-', expand=True).astype(float) * 1000
    df['energy_low_ev'] = df['energy_low_ev'].astype(int)
    df['energy_high_ev'] = df['energy_high_ev'].astype(int)
    return df

df = load_data()

# Streamlit app
st.title('Solar Flare Analysis and Prediction')

# Sidebar for navigation
page = st.sidebar.selectbox("Choose a page", ["Data Overview", "Data Visualization", "Prediction"])

if page == "Data Overview":
    st.header("Data Overview")
    st.write(df[['peak.c/s', 'total.counts', 'x.pos.asec', 'y.pos.asec', 'radial', 'active.region.ar', 'energy_low_ev',
                 'energy_high_ev', 'duration.s']].head())
    st.write(df[['peak.c/s', 'total.counts', 'x.pos.asec', 'y.pos.asec', 'radial', 'active.region.ar', 'energy_low_ev',
                 'energy_high_ev', 'duration.s']].describe())

elif page == "Data Visualization":
    st.header("Data Visualization")

    # Correlation heatmap
    st.subheader("Correlation Heatmap")
    corr = df[['peak.c/s', 'total.counts', 'x.pos.asec', 'y.pos.asec', 'radial', 'active.region.ar', 'energy_low_ev',
               'energy_high_ev', 'duration.s']].corr()
    fig, ax = plt.subplots(figsize=(12, 10))
    sns.heatmap(corr, annot=True, cmap='coolwarm', ax=ax)
    st.pyplot(fig)

    # Scatter plot
    st.subheader("Scatter Plot: Duration vs Peak Count Rate")
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.scatter(df['peak.c/s'], df['duration.s'])
    ax.set_xlabel('Peak Count Rate (c/s)')
    ax.set_ylabel('Duration (s)')
    ax.set_title('Duration vs Peak Count Rate')
    st.pyplot(fig)

    # Histogram
    st.subheader("Histogram of Flare Durations")
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.hist(df['duration.s'], bins=30, edgecolor='black')
    ax.set_xlabel('Duration (s)')
    ax.set_ylabel('Frequency')
    ax.set_title('Distribution of Flare Durations')
    st.pyplot(fig)

elif page == "Prediction":
    st.header("Solar Flare Duration Prediction")

    # Input fields for prediction
    st.subheader("Enter Solar Flare Parameters:")
    peak_cs = st.number_input("Peak Count Rate (c/s)", min_value=0, value=1000)
    total_counts = st.number_input("Total Counts", min_value=0, value=1000)
    x_pos = st.number_input("X Position (arcsec)", value=0)
    y_pos = st.number_input("Y Position (arcsec)", value=0)
    radial = st.number_input("Radial Position", min_value=0, value=100)
    active_region = st.number_input("Active Region Number", min_value=0, value=11000)
    energy_low = st.number_input("Energy Low (eV)", min_value=0, value=1000)
    energy_high = st.number_input("Energy High (eV)", min_value=0, value=10000)

    # Make prediction
    if st.button("Predict Duration"):
        input_data = np.array([[peak_cs, total_counts, x_pos, y_pos, radial, active_region, energy_low, energy_high]])
        input_scaled = scaler.transform(input_data)
        prediction = knn.predict(input_scaled)

        st.success(f"Predicted Solar Flare Duration: {prediction[0][0]:.2f} seconds")

        # Visualize the prediction
        st.subheader("Prediction Visualization")
        fig, ax = plt.subplots(figsize=(10, 6))
        ax.scatter(df['peak.c/s'], df['duration.s'], alpha=0.5, label='Actual Data')
        ax.scatter(peak_cs, prediction, color='red', s=100, label='Prediction')
        ax.set_xlabel('Peak Count Rate (c/s)')
        ax.set_ylabel('Duration (s)')
        ax.set_title('Solar Flare Duration Prediction')
        ax.legend()
        st.pyplot(fig)

st.sidebar.info("This application utilizes solar flare datasets to predict the duration (in seconds) of the solar flare given other characteristics.")