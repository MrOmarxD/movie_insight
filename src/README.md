Movie Insight - Final Delivery
==============================

Overview
--------
Microservices demo that lets you search movies (OMDb), cache results, authenticate users and manage favorites with personal rating/comentario.
- **Gateway (Node.js, 8080)**: sirve la UI HTML5, proxy a servicios, OpenAPI en `/api-docs`.
- **Movie service (Python/Flask, 5001)**: búsqueda avanzada (`t`, `s`, `page`, filtro género/año), caché MongoDB 7 días, endpoint `/trending`.
- **User service (Node.js, 5002)**: autenticación JWT y favoritos con rating (1–5) + comentario.
- **Frontend**: Tailwind (tema oscuro), toasts, loader, lista de trending, ficha de película muestra tu rating/notas si existen.

Requisitos
----------
- Docker y Docker Compose **o** Node 18+ y Python 3.11+
- Clave OMDb (`OMDB_API_KEY` en `.env`)

Arranque rápido (Docker)
------------------------
1. `cp .env.example .env` y define `OMDB_API_KEY`.
2. `docker compose up --build`
3. Navega a http://localhost:8080 y API docs en http://localhost:8080/api-docs

Arranque local (sin Docker)
---------------------------
En terminales separadas con Mongo en `mongodb://localhost:27017/movieinsight`:
1) Movie service (Python)
```
cd movie-service
pip install -r requirements.txt
export OMDB_API_KEY=your_key
export MONGO_URI=mongodb://localhost:27017/movieinsight
python app.py
```
2) User service (Node)
```
cd user-service
npm install
export JWT_SECRET=mi_clave_super_secreta_!2025
export MONGO_URI=mongodb://localhost:27017/movieinsight
node index.js
```
3) Gateway (Node)
```
cd gateway
npm install
export PY_SERVICE=http://localhost:5001
export USER_SERVICE=http://localhost:5002
export JWT_SECRET=mi_clave_super_secreta_!2025
node index.js
```

API útil para probar
--------------------
- Registro: `POST /api/auth/register {username,email,password}`
- Login: `POST /api/auth/login {identifier,password}` -> token
- Búsqueda exacta: `GET /api/movies?title=Inception`
- Búsqueda lista/paginada: `GET /api/movies?search=batman&page=2&genre=Action&year=2008`
- Trending: `GET /api/trending`
- Añadir favorito: `POST /api/users/<USERID>/favorites { imdbid, rating?, comment? }` con `Authorization: Bearer <token>`
- Editar favorito: `PUT /api/users/<USERID>/favorites/<IMDBID> { rating?, comment? }`
- Listar favoritos: `GET /api/users/<USERID>/favorites` (devuelve rating/comentario)

Notas
-----
- Usa el mismo `JWT_SECRET` en gateway y user-service.
- Mongo usa volumen nombrado con Docker (`mongo_data`).
- OpenAPI en `gateway/openapi.yaml` y servido en `/api-docs`.
- Evita subir `node_modules`; está en `.gitignore`.
