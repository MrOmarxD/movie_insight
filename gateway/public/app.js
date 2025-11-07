const btn = document.getElementById('btn');
const q = document.getElementById('q');
const results = document.getElementById('results');

btn.onclick = async () => {
  const title = q.value.trim();
  if(!title) return alert('Escribe un título');
  results.innerHTML = 'Buscando...';
  try {
    const res = await fetch(`/api/movies?title=${encodeURIComponent(title)}`);
    if(!res.ok){ const err = await res.json(); results.innerHTML = `<b>Error:</b> ${err.error||res.statusText}`; return; }
    const movie = await res.json();
    results.innerHTML = `
      <div class="movie">
        <img src="${movie.Poster!=='N/A'? movie.Poster : ''}" alt="poster"/>
        <div>
          <h2>${movie.Title} (${movie.Year})</h2>
          <p>${movie.Genre} — ${movie.Director}</p>
          <p>${movie.Plot}</p>
        </div>
      </div>
    `;
  } catch(e) {
    results.innerHTML = 'Error en petición';
  }
};
