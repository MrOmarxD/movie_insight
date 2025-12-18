Movie Insight - Final Delivery
==============================

Overview
--------
Microservices demo that lets you search movies (OMDb), cache results, authenticate users and manage favorites.
- **Gateway (Node.js, 8080)**: serves the HTML5 UI, proxies to the services and hosts OpenAPI docs.
- **Movie service (Python/Flask, 5001)**: fetches movies from OMDb and caches them in MongoDB with a 7-day TTL.
- **User service (Node.js, 5002)**: auth (JWT) + favorites stored in MongoDB.
- **Frontend**: Tailwind UI (login/register modal, search and favorites pages).

Requirements
------------
- Docker and Docker Compose **or** Node 18+ and Python 3.11+
- OMDb API key (set `OMDB_API_KEY` in `.env`)

Quick start (Docker)
--------------------
1. Copy env file: `cp .env.example .env` and set your `OMDB_API_KEY`.
2. Build and run: `docker compose up --build`
3. Open: http://localhost:8080  
   Docs: http://localhost:8080/api-docs

Local run (no Docker)
---------------------
In separate terminals:
1) MongoDB running locally (default URI `mongodb://localhost:27017/movieinsight`).

2) Movie service (Python)
```
cd movie-service
pip install -r requirements.txt
export OMDB_API_KEY=your_key
export MONGO_URI=mongodb://localhost:27017/movieinsight
python app.py
```

3) User service (Node)
```
cd user-service
npm install
export JWT_SECRET=mi_clave_super_secreta_!2025
export MONGO_URI=mongodb://localhost:27017/movieinsight
node index.js
```

4) Gateway (Node)
```
cd gateway
npm install
export PY_SERVICE=http://localhost:5001
export USER_SERVICE=http://localhost:5002
export JWT_SECRET=mi_clave_super_secreta_!2025
node index.js
```

API flow to test
----------------
1. Register: `POST http://localhost:8080/api/auth/register {username,email,password}`
2. Login: `POST http://localhost:8080/api/auth/login {identifier,password}` -> token
3. Buscar: `GET http://localhost:8080/api/movies?title=Inception`
4. Guardar favorito: `POST http://localhost:8080/api/users/<USERID>/favorites` with `Authorization: Bearer <token>` and body `{ "imdbid": "tt1375666" }`
5. Ver favoritos: `GET http://localhost:8080/api/users/<USERID>/favorites` with token

Notes
-----
- Keep the same `JWT_SECRET` in gateway and user-service.
- Mongo uses a named volume when running with Docker (`mongo_data`).
- OpenAPI spec lives in `gateway/openapi.yaml` and is served at `/api-docs`.
