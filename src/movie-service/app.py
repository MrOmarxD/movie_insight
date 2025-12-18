import os
from datetime import datetime
from typing import List, Optional

import requests
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient

app = Flask(__name__)
CORS(app)

MONGO_URI = os.getenv("MONGO_URI", "mongodb://mongo:27017/movieinsight")
OMDB_API_KEY = os.getenv("OMDB_API_KEY")

if not OMDB_API_KEY:
  raise RuntimeError("OMDB_API_KEY env var is required")

client = MongoClient(MONGO_URI)
db = client["movieinsight"]
movies = db["movies"]
movies.create_index("imdbID", unique=True)
movies.create_index("normalizedTitle")
movies.create_index("cachedAt", expireAfterSeconds=60 * 60 * 24 * 7)  # 7 days

TRENDING_KEYWORDS = ["marvel", "batman", "star wars"]


def normalize_title(title: str) -> str:
  return title.strip().lower()


def cache_movie(doc: dict, normalized_title: Optional[str]):
  to_store = dict(doc)
  to_store["cachedAt"] = datetime.utcnow()
  if normalized_title:
    to_store["normalizedTitle"] = normalized_title

  key = {"imdbID": doc.get("imdbID")} if doc.get("imdbID") else {"normalizedTitle": normalized_title}
  movies.update_one(key, {"$set": to_store}, upsert=True)


def fetch_detail(imdbid: Optional[str] = None, title: Optional[str] = None, year: Optional[str] = None):
  if not imdbid and not title:
    return None, {"error": "title or imdbid required"}, 400

  params = {"apikey": OMDB_API_KEY}
  if imdbid:
    params["i"] = imdbid
  if title:
    params["t"] = title
  if year:
    params["y"] = year

  try:
    r = requests.get("http://www.omdbapi.com/", params=params, timeout=8)
    r.raise_for_status()
  except requests.RequestException as exc:
    return None, {"error": "omdb request failed", "detail": str(exc)}, 502

  data = r.json()
  if data.get("Response") == "False" or "Error" in data:
    return None, {"error": data.get("Error", "movie not found")}, 404
  return data, None, 200


def fetch_search(query: str, page: int = 1, year: Optional[str] = None) -> dict:
  params = {"apikey": OMDB_API_KEY, "s": query, "page": page}
  if year:
    params["y"] = year

  r = requests.get("http://www.omdbapi.com/", params=params, timeout=8)
  r.raise_for_status()
  data = r.json()
  return data


@app.route("/movies", methods=["GET"])
def get_movie():
  title = request.args.get("title")
  imdbid = request.args.get("imdbid")
  search = request.args.get("search")
  page = int(request.args.get("page", 1))
  year = request.args.get("year")
  genre_filter = request.args.get("genre")

  # list search
  if search:
    try:
      raw = fetch_search(search, page=page, year=year)
    except requests.RequestException as exc:
      return jsonify({"error": "omdb request failed", "detail": str(exc)}), 502

    if raw.get("Response") == "False":
      return jsonify({"error": raw.get("Error", "not found")}), 404

    results: List[dict] = raw.get("Search", [])
    detailed: List[dict] = []

    for item in results:
      detail, _, status = fetch_detail(imdbid=item.get("imdbID"))
      if status == 200 and detail:
        cache_movie(detail, normalize_title(detail.get("Title", "")))
        if genre_filter:
          if genre_filter.lower() not in detail.get("Genre", "").lower():
            continue
        detailed.append(detail)

    return jsonify({
      "Search": detailed,
      "totalResults": raw.get("totalResults"),
      "page": page,
      "genreFilter": genre_filter or "",
      "cached": False
    })

  # single detail
  if not title and not imdbid:
    return jsonify({"error": "title or imdbid required"}), 400

  normalized_title = normalize_title(title) if title else None
  cached = None
  if imdbid:
    cached = movies.find_one({"imdbID": imdbid})
  elif normalized_title:
    cached = movies.find_one({"normalizedTitle": normalized_title})

  if cached:
    cached.pop("_id", None)
    cached["cached"] = True
    return jsonify(cached)

  data, err, status = fetch_detail(imdbid=imdbid, title=title, year=year)
  if err:
    return jsonify(err), status

  data.pop("_id", None)
  cache_movie(data, normalized_title)
  data["cached"] = False
  return jsonify(data)


@app.route("/trending")
def trending():
  items: List[dict] = []
  seen = set()

  for keyword in TRENDING_KEYWORDS:
    try:
      raw = fetch_search(keyword, page=1)
    except requests.RequestException:
      continue

    for entry in raw.get("Search", [])[:4]:
      imdbid = entry.get("imdbID")
      if imdbid in seen:
        continue
      seen.add(imdbid)

      detail, _, status = fetch_detail(imdbid=imdbid)
      if status == 200 and detail:
        cache_movie(detail, normalize_title(detail.get("Title", "")))
        detail.pop("_id", None)
        items.append(detail)
      if len(items) >= 9:
        break
    if len(items) >= 9:
      break

  return jsonify({"results": items})


@app.route("/health")
def health():
  return {"status": "ok"}


if __name__ == "__main__":
  app.run(host="0.0.0.0", port=5001)
