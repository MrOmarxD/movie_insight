Movie Insight - Instrucciones

Repositorio: https://github.com/MrOmarxD/movie_insight

0) Software a instalar
-----------------------
Opción recomendada (Docker)
- Docker
- Docker Compose

Opción alternativa (sin Docker)
- Node.js 18 o superior
- Python 3.11 o superior
- MongoDB
- PostgreSQL

Además:
- Clave de la API de OMDb (variable OMDB_API_KEY)

1) Servicios a arrancar
-----------------------
- MongoDB
- Postgres
- movie-service (Python)
- user-service (Node)
- gateway (Node)
(Con Docker Compose, todos los servicios se levantan automáticamente.)

2) Dependencias
---------------
- movie-service: 'pip install -r requirements.txt'
- user-service: 'npm install'
- gateway: 'npm install'

3) Arrancar la parte servidora
------------------------------
- Todo el programa: 'docker compose up --build'
- movie-service: 'python app.py'
- user-service: 'node index.js'
- gateway: 'node index.js'


4) Ejecución local (sin Docker)
----------------------------
- Movie Service:
cd movie-service
pip install -r requirements.txt
export OMDB_API_KEY=your_key
export MONGO_URI=mongodb://localhost:27017/movieinsight
python app.py

- User Service:
cd user-service
npm install
export JWT_SECRET=mi_clave_super_secreta_!2025
export MONGO_URI=mongodb://localhost:27017/movieinsight
export POSTGRES_URI=postgresql://postgres:postgres@localhost:5432/movieinsight
node index.js

- Gateway:
cd gateway
npm install
export PY_SERVICE=http://localhost:5001
export USER_SERVICE=http://localhost:5002
export JWT_SECRET=mi_clave_super_secreta_!2025
node index.js

5) Acceso a la parte cliente
----------------------------
Aplicación web:
- http://localhost:8080

Documentación OpenAPI Gateway:
- http://localhost:8080/api-docs

Swagger User Service:
- http://localhost:5002/api-docs

6) Endpoints útiles
----------------------------
Películas
- GET /api/movies?title=Inception
- GET /api/movies?imdbid=tt1375666
- GET /api/movies?search=batman&page=2&year=2008&genre=Action
- GET /api/trending

Autenticación
- POST /api/auth/register
- POST /api/auth/login

Favoritos
- GET /api/users/{id}/favorites
- POST /api/users/{id}/favorites
- PUT /api/users/{id}/favorites/{imdbid}
- DELETE /api/users/{id}/favorites/{imdbid}
- GET /api/users/{id}/favorites/logs (auditoría en PostgreSQL)

7) Usuario de demostración (seed)
----------------------------
Para crear un usuario de prueba:
- node user-service/seed.js

Credenciales:
- Usuario: demo
- Email: demo@example.com
- Password: demo123