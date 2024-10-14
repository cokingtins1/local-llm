import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from flask import Flask, request, jsonify
from flask_cors import CORS
import asyncio

from lib.chat import main as chat

app = Flask(__name__)
CORS(app)


@app.route("/", methods=["POST"])
def return_input():
    data = request.get_json()
    prompt: str = data["prompt"]
    return jsonify({"result": prompt})


@app.route("/load", methods=["GET"])
def main():
    doc = chat()
    return doc


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8080)
