from flask import Flask, request, jsonify
from pymongo import MongoClient
import requests
import os

app = Flask(__name__)

MONGO_URI = os.getenv("MONGO_URI", "mongodb://mongo:27017/movieinsight")
OMDB_API_KEY = os.getenv("OMDB_API_KEY")

client = MongoClient(MONGO_URI)
db = client["movieinsight"]
favorites_collection = db["favorites"]

# BUSCAR PELÍCULA POR TÍTULO O ID
@app.route("/movies", methods=["GET"])
def get_movie():
    title = request.args.get("title")
    imdbid = request.args.get("imdbid")

    if not title and not imdbid:
        return jsonify({"error": "title or imdbid required"}), 400

    params = {"apikey": OMDB_API_KEY}
    if title:
        params["t"] = title
    if imdbid:
        params["i"] = imdbid

    r = requests.get("http://www.omdbapi.com/", params=params)
    data = r.json()

    if "Error" in data:
        return jsonify({"error": data["Error"]}), 404

    if "_id" in data:
        data["_id"] = str(data["_id"])

    return jsonify(data)


# HEALTHCHECK
@app.route("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)