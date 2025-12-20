PROYECTO: Movie Insight 
ESTUDIANTE: Omar Eiyana Aboghrara 
REPOSITORIO: https://github.com/MrOmarxD/movie_insight

Resumen del proyecto: 
- Movie Insight es una aplicación web basada en una arquitectura de microservicios, cuyo objetivo es permitir la búsqueda de películas, visualizar tendencias y gestionar favoritos de usuarios autenticados.

Servicios incluidos:
- Gateway (Node.js – puerto 8080)
   - Sirve la interfaz HTML5 (frontend).
   - Actúa como API Gateway y proxy hacia los microservicios.
   - Documentación OpenAPI disponible en /api-docs.
- Movie Service (Python / Flask – puerto 5001)
   - Búsqueda de películas por título exacto o IMDb ID.
   - Búsqueda por texto con paginación y filtros (año, género).
   - Endpoint de películas en tendencia.
   - Cacheo de resultados en MongoDB con TTL de 7 días.
   - Especificación OpenAPI en movie-service/openapi.yaml.
- User Service (Node.js – puerto 5002)
   - Autenticación de usuarios mediante JWT.
   - Gestión de favoritos con rating y comentarios.
   - Auditoría de acciones almacenada en PostgreSQL.
   - Favoritos almacenados en MongoDB.
   - Swagger disponible en /api-docs.

Frontend:
- Interfaz HTML5 con uso intensivo de JavaScript.
- Indicadores de carga (loader) y notificaciones (toasts).
- Visualización de trending en tiempo real.
- Ratings y comentarios visibles tanto en búsquedas como en favoritos.