Movie Insight - Proyecto Desarrollo avanzado de aplicaciones para la Web de Datos

Resumen:
- Gateway (Node.js, 8080): sirve la UI HTML5, proxys a servicios, OpenAPI en /api-docs.
- Movie service (Python/Flask, 5001): busqueda exacta (title/imdbid) o lista (search + page) con filtros de ano/genero, trending y cache Mongo (TTL 7 dias). Esquema en movie-service/openapi.yaml.
- User service (Node.js, 5002): auth JWT y favoritos con rating/comentario; escribe auditoria en Postgres y guarda favoritos en Mongo. Swagger en /api-docs.
- Frontend: tema oscuro, toasts, loader, trending real, rating/notas visibles en busqueda y favoritos.

Requisitos:
- Docker + Docker Compose O Node 18+ y Python 3.11+
- Clave OMDb en .env (OMDB_API_KEY)
- Postgres para auditoria relacional (se levanta en docker-compose)

Arranque rapido (Docker):
1) cp .env.example .env y define OMDB_API_KEY (opcional POSTGRES_PASSWORD/URI)
2) docker compose up --build
3) Abre http://localhost:8080
   Docs gateway: http://localhost:8080/api-docs
   Swagger user-service: http://localhost:5002/api-docs

Ejecucion local (sin Docker):
1) Levanta MongoDB y Postgres en local.
2) Movie service:
   cd movie-service
   pip install -r requirements.txt
   export OMDB_API_KEY=your_key
   export MONGO_URI=mongodb://localhost:27017/movieinsight
   python app.py
3) User service:
   cd user-service
   npm install
   export JWT_SECRET=mi_clave_super_secreta_!2025
   export MONGO_URI=mongodb://localhost:27017/movieinsight
   export POSTGRES_URI=postgresql://postgres:postgres@localhost:5432/movieinsight
   node index.js
4) Gateway:
   cd gateway
   npm install
   export PY_SERVICE=http://localhost:5001
   export USER_SERVICE=http://localhost:5002
   export JWT_SECRET=mi_clave_super_secreta_!2025
   node index.js

Endpoints utiles:
- OpenAPI gateway: GET /api-docs
- Movies:
  - GET /api/movies?title=Inception
  - GET /api/movies?imdbid=tt1375666
  - GET /api/movies?search=batman&page=2&year=2008&genre=Action
  - GET /api/trending
- Auth:
  - POST /api/auth/register
  - POST /api/auth/login
- Favoritos:
  - GET/POST /api/users/{id}/favorites
  - PUT/DELETE /api/users/{id}/favorites/{imdbid}
  - GET /api/users/{id}/favorites/logs (auditoria Postgres)

Seed de usuario demo:
Ejecuta: node user-service/seed.js
Usuario: demo | Email: demo@example.com | Password: demo123
