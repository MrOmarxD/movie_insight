const searchBtn = document.getElementById('search-btn');
const q = document.getElementById('q');
const results = document.getElementById('results');

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { "Authorization": "Bearer " + token } : {};
}

searchBtn.addEventListener('click', async ()=> {
  const title = q.value.trim();
  if(!title) { alert('Escribe un título'); return; }
  results.innerHTML = '<p>Buscando...</p>';
  try {
    const res = await fetch(`/api/movies?title=${encodeURIComponent(title)}`);
    if(!res.ok){ const err = await res.json(); results.innerHTML = '<p>Error: '+(err.error||res.statusText)+'</p>'; return; }
    const movie = await res.json();
    renderMovie(movie);
  } catch(e) {
    results.innerHTML = '<p>Error en la petición</p>';
  }
});

function renderMovie(movie){
  const poster = movie.Poster && movie.Poster !== 'N/A' ? `<img src="${movie.Poster}" class="w-24 mr-4">` : '';
  results.innerHTML = `
    <div class="bg-white p-4 rounded shadow flex">
      ${poster}
      <div>
        <h2 class="text-xl font-bold">${movie.Title} <span class="text-gray-600">(${movie.Year})</span></h2>
        <p class="text-sm text-gray-700">${movie.Genre} — ${movie.Director}</p>
        <p class="mt-2 text-gray-600">${movie.Plot}</p>
        <div class="mt-3">
          <button id="fav-btn" class="bg-yellow-400 px-3 py-1 rounded">Añadir a favoritos</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById('fav-btn').addEventListener('click', addFavorite.bind(null, movie.imdbID));
}

async function addFavorite(imdbid){
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');
  if(!token || !user){ alert('Necesitas iniciar sesión para añadir favoritos'); return; }
  const res = await fetch(`/api/users/${user.id}/favorites`, {
    method:'POST',
    headers: Object.assign({'content-type':'application/json'}, authHeaders()),
    body: JSON.stringify({ imdbid })
  });
  const data = await res.json();
  if(res.ok){ alert('Favorito añadido'); } else { alert(data.error || 'Error'); }
}
