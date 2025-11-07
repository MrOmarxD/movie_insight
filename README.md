Movie Insight - Starter

Environment variables (example):
  OMDB_API_KEY=tu_clave_omdb
  JWT_SECRET=una_clave_larga_secreta

Quick start:
  docker compose up --build

Endpoints:
  POST /api/auth/register  { username, email, password }
  POST /api/auth/login     { username, password } -> returns { token }
  GET  /api/movies?title=Inception
  Protected routes (use Authorization: Bearer <token>):
    GET /api/users/:id/favorites
    POST /api/users/:id/favorites  { imdbid: "tt..." }
