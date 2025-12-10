const searchBtn = document.getElementById('search-btn');
const q = document.getElementById('q');
const results = document.getElementById('results');

searchBtn.addEventListener('click', async () => {
  const title = q.value.trim();
  if (!title) return alert('⚠️ Escribe un título');

  results.innerHTML = `🔎 Buscando...`;

  const res = await fetch(`/api/movies?title=${encodeURIComponent(title)}`);
  const movie = await res.json();
  renderMovie(movie);
});

function renderMovie(movie) {
  results.innerHTML = `
    <div class="movie">
      <img src="${movie.Poster}">
      <h2>${movie.Title}</h2>
      <button onclick="addFavorite('${movie.imdbID}')">⭐ Guardar</button>
    </div>
  `;
}

async function addFavorite(imdbid) {
  const token = localStorage.getItem('token');
  if (!token) return alert("Debes iniciar sesión");

  const payload = JSON.parse(atob(token.split(".")[1]));
  const realUserId = payload.sub;

  const res = await fetch(`/api/users/${realUserId}/favorites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({ imdbid })
  });

  const data = await res.json();

  if (!res.ok) return alert(data.error || "Error");

  alert("⭐ Añadido a favoritos ✅");
}