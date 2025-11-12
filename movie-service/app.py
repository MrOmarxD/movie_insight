from flask import Flask, request, jsonify
import os, requests
from pymongo import MongoClient
from flask_cors import CORS
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
CORS(app)

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/movieinsight")
OMDB_API_KEY = os.environ.get("OMDB_API_KEY", "demo")
client = MongoClient(MONGO_URI)
db = client.get_default_database()
movies_col = db.movies

@app.route("/movies", methods=["GET"])
def search_movie():
    title = request.args.get("title")
    if not title:
        return jsonify({"error": "title query param required"}), 400

    cached = movies_col.find_one({"Title_lower": title.lower()})
    if cached:
        cached.pop("_id", None)
        cached["cached"] = True
        return jsonify(cached)

    params = {"t": title, "apikey": OMDB_API_KEY}
    resp = requests.get("http://www.omdbapi.com/", params=params, timeout=10)
    if resp.status_code != 200:
        return jsonify({"error": "OMDb error"}), 502
    data = resp.json()
    if data.get("Response") == "False":
        return jsonify({"error": data.get("Error", "not found")}), 404

    doc = data.copy()
    doc["Title_lower"] = data.get("Title","").lower()
    try:
        movies_col.insert_one(doc)
    except Exception:
        pass
    doc.pop("_id", None)
    doc["cached"] = False
    return jsonify(doc)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
