from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import pandas as pd
import requests
from io import StringIO
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

CORS(app)


def get_csv_from_drive(file_id):
    url = f"https://drive.google.com/uc?export=download&id={file_id}"
    response = requests.get(url)

    if response.status_code != 200:
        return None, f"Erro ao baixar arquivo: {response.status_code}"

    csv_data = StringIO(response.text)
    df = pd.read_csv(csv_data)

    df['date'] = pd.to_datetime(df['date'], format='%Y-%m-%d')
    df['year'] = df['date'].dt.year
    df['month'] = df['date'].dt.month
    df['day'] = df['date'].dt.day

    return df, None


@app.route('/load', methods=['GET'])
def get_csv_data():
    file_id = request.args.get('file_id') or os.getenv("FILE_ID")

    if not file_id:
        return jsonify({"error": "Forneça o parâmetro 'file_id' na URL"}), 400

    df, error = get_csv_from_drive(file_id)

    if error:
        return jsonify({"error": error}), 500

    return jsonify(df.to_dict(orient="records"))


if __name__ == '__main__':
    app.run(debug=True)
