Movie Insight - Final Starter (Tailwind modal auth)
================================================

Overview
--------
Movie Insight is a small microservices demo:
- Gateway (Node.js) serves frontend and proxies requests
- User service (Node.js) handles auth, users and favorites (MongoDB)
- Python service (Flask) queries OMDb and caches results (MongoDB)
- Frontend: HTML5 + TailwindCSS (modal login/register), served from gateway/public

Requirements
------------
- Docker & Docker Compose OR Node (>=18) and Python (>=3.10) if running locally
- OMDB API key (example included in .env.example)

Quick start (Docker)
--------------------
1. Copy env file:
   cp .env.example .env
   Edit .env and keep the values (or replace OMDB_API_KEY if you have a different one).

2. Build and run:
   docker compose up --build

3. Open in browser:
   http://localhost:8080

Local (no Docker) - minimal steps
---------------------------------
Services need Node and Python environments. Recommended to run each service in its repo folder.

1) Gateway
  - cd gateway
  - npm install
  - export JWT_SECRET="mi_clave_super_secreta_!2025"
  - export PY_SERVICE=http://localhost:5001
  - export USER_SERVICE=http://localhost:5002
  - node index.js

2) User service (node-service)
  - cd node-service
  - npm install
  - export MONGO_URI=mongodb://localhost:27017/movieinsight
  - export JWT_SECRET="mi_clave_super_secreta_!2025"
  - node index.js

3) Python service (python-service)
  - cd python-service
  - pip install -r requirements.txt
  - export MONGO_URI=mongodb://localhost:27017/movieinsight
  - export OMDB_API_KEY=7071efcd
  - python app.py

Testing the flow
----------------
1) Register:
   POST http://localhost:8080/api/auth/register
   { "username":"juan", "email":"juan@example.com", "password":"123456" }

2) Login:
   POST http://localhost:8080/api/auth/login
   { "username":"juan", "password":"123456" }
   -> returns token

3) Search movie:
   GET http://localhost:8080/api/movies?title=Inception

4) Add favorite (protected):
   POST http://localhost:8080/api/users/<USERID>/favorites
   Header: Authorization: Bearer <token>
   Body: { "imdbid":"tt1375666" }

Notes
-----
- Ensure JWT_SECRET is identical for gateway and user-service.
- OMDB free key has limits; use your own if needed.
