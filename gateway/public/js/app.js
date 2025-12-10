const searchBtn = document.getElementById('search-btn');
const q = document.getElementById('q');
const results = document.getElementById('results');

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { "Authorization": "Bearer " + token } : {};
}

// BÚSQUEDA DE PELIS
searchBtn.addEventListener('click', async () => {
  const title = q.value.trim();
  if (!title) return alert('⚠️ Escribe un título');

  results.innerHTML = `<p class="text-blue-400 text-lg mt-4">🔎 Buscando "${title}"...</p>`;

  try {
    const token = localStorage.getItem("token");
    const headers = token ? { "Authorization": "Bearer " + token } : {};

    const res = await fetch(`/api/movies?title=${encodeURIComponent(title)}`, { headers });

    if (!res.ok) {
      const err = await res.json();
      return results.innerHTML = `<p class="text-red-400 text-lg mt-4">❌ Error: ${err.error || res.statusText}</p>`;
    }

    const movie = await res.json();
    renderMovie(movie);

  } catch (e) {
    results.innerHTML = `<p class="text-red-400 text-lg mt-4">🔥 Error en la petición</p>`;
  }
});

// RENDER DE PELÍCULA
function renderMovie(movie) {
  const poster = movie.Poster && movie.Poster !== 'N/A'
    ? `<img src="${movie.Poster}" class="w-32 rounded-2xl shadow-lg mr-6">`
    : '';

  results.innerHTML = `
    <div class="bg-gray-900 text-white p-6 rounded-2xl shadow-xl flex items-start border border-gray-800">
      ${poster}
      <div class="flex flex-col gap-2">
        <h2 class="text-2xl font-bold text-blue-400">🎬 ${movie.Title} (${movie.Year})</h2>
        <p class="text-sm text-gray-400">${movie.Genre} — Dir: ${movie.Director}</p>
        <p class="text-gray-300">${movie.Plot || "Sin sinopsis disponible."}</p>

        <button onclick="addFavorite('${movie.imdbID}')"
          class="mt-4 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl w-fit transition font-medium shadow-md">
          ⭐ Guardar como favorito
        </button>
      </div>
    </div>
  `;
}

// GUARDAR FAVORITOS
async function addFavorite(imdbid) {
  const token = localStorage.getItem('token');
  if (!token) return alert("⚠ Debes iniciar sesión");

  const payload = JSON.parse(atob(token.split(".")[1]));
  const realUserId = payload.sub;

  try {
    const res = await fetch(`/api/users/${realUserId}/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ imdbid })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Backend error:", data);
      return alert(data.error || "Error al guardar favorito");
    }

    alert("⭐ Añadido a favoritos ✅");

  } catch (e) {
    console.error("🔥 Network error:", e);
    alert("No se pudo conectar con el servidor");
  }
}