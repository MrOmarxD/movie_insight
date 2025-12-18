const searchBtn = document.getElementById('search-btn');
const q = document.getElementById('q');
const yearInput = document.getElementById('year');
const genreInput = document.getElementById('genre');
const listModeCheckbox = document.getElementById('list-mode');
const results = document.getElementById('results');
const trendingGrid = document.getElementById('trending-grid');
const loader = document.getElementById('loader');
let favoritesCache = new Map();

function renderMessage(text) {
  results.innerHTML = `<p class="text-slate-200 bg-slate-900 border border-slate-800 rounded px-3 py-2">${text}</p>`;
}

function showLoader(show) {
  if (!loader) return;
  loader.classList.toggle('hidden', !show);
}

async function searchMovie(event) {
  event?.preventDefault();
  const title = q.value.trim();
  if (!title) {
    renderMessage('Escribe un titulo para buscar');
    return;
  }

  results.innerHTML = ``;
  showLoader(true);

  try {
    const params = new URLSearchParams();
    const year = yearInput?.value.trim();
    const genre = genreInput?.value.trim();

    if (listModeCheckbox?.checked) {
      params.append("search", title);
    } else {
      params.append("title", title);
    }
    if (year) params.append("year", year);
    if (genre) params.append("genre", genre);

    const res = await fetch(`/api/movies?${params.toString()}`);
    const data = await res.json();

    if (!res.ok) {
      renderMessage(data.error || 'No se encontro la pelicula');
      showToast(data.error || "No se pudo buscar", "error");
      return;
    }

    if (data.Search) {
      renderList(data);
    } else {
      renderMovie(data);
    }
  } catch (err) {
    renderMessage('No se pudo buscar ahora mismo');
    console.error(err);
    showToast("No se pudo buscar ahora mismo", "error");
  }
  showLoader(false);
}

function initialsFromTitle(title) {
  return (title || "MI").split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase();
}

function posterBlock(movie) {
  if (movie.Poster && movie.Poster !== "N/A") {
    return `<img src="${movie.Poster}" alt="${movie.Title || 'Poster'}" class="w-full h-full object-cover">`;
  }
  const initials = initialsFromTitle(movie.Title);
  return `
    <div class="w-full h-full grid place-content-center bg-slate-800 text-slate-200 text-4xl font-semibold tracking-widest">
      ${initials}
    </div>
  `;
}

function renderMovie(movie) {
  const cachedTag = movie.cached ? '<span class="px-2 py-1 text-xs rounded bg-amber-200/10 text-amber-200 border border-amber-300/30">cache</span>' : '';
  const favData = favoritesCache.get(movie.imdbID);
  const isFav = !!favData;
  const ratingBadge = favData ? `<span class="px-2 py-1 text-xs rounded bg-emerald-200/10 text-emerald-100 border border-emerald-300/30">Mi valoracion: ${favData.rating}/5</span>` : "";
  const commentBlock = favData && favData.comment
    ? `<p class="text-xs text-slate-400 border border-slate-800 rounded px-2 py-2 bg-slate-900">Nota: ${favData.comment}</p>`
    : "";

  results.innerHTML = `
    <article class="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl shadow-sky-900/30 overflow-hidden grid md:grid-cols-[220px,1fr] gap-4">
      <div class="bg-slate-800">
        ${posterBlock(movie)}
      </div>
      <div class="p-4 space-y-3">
        <div class="flex items-center gap-2">
          <h2 class="text-2xl font-semibold text-slate-50">${movie.Title || 'Titulo desconocido'}</h2>
          ${cachedTag}
          ${ratingBadge}
        </div>
        <p class="text-sm text-slate-300 leading-relaxed">${movie.Plot || 'Sin descripcion disponible.'}</p>
        <dl class="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm text-slate-200">
          <div><dt class="font-medium text-slate-500">Ano</dt><dd>${movie.Year || 'n/d'}</dd></div>
          <div><dt class="font-medium text-slate-500">Genero</dt><dd>${movie.Genre || 'n/d'}</dd></div>
          <div><dt class="font-medium text-slate-500">Director</dt><dd>${movie.Director || 'n/d'}</dd></div>
          <div><dt class="font-medium text-slate-500">IMDB</dt><dd>${movie.imdbRating || 'n/d'}</dd></div>
          <div><dt class="font-medium text-slate-500">Duracion</dt><dd>${movie.Runtime || 'n/d'}</dd></div>
          <div><dt class="font-medium text-slate-500">Pais</dt><dd>${movie.Country || 'n/d'}</dd></div>
        </dl>
        ${commentBlock}
        <div class="flex flex-wrap items-center gap-3">
          <button id="save-fav" class="bg-sky-600 hover:bg-sky-500 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2 rounded" ${isFav ? "disabled" : ""}>
            ${isFav ? "Ya en favoritos" : "Guardar en favoritos"}
          </button>
          <a href="https://www.imdb.com/title/${movie.imdbID}" target="_blank" rel="noreferrer"
            class="text-sky-300 hover:underline text-sm">Ver en IMDb</a>
        </div>
      </div>
    </article>
  `;

  const saveBtn = document.getElementById('save-fav');
  if (!isFav) {
    saveBtn.addEventListener('click', () => addFavorite(movie.imdbID, saveBtn));
  }
}

function renderList(payload) {
  const movies = payload.Search || [];
  if (!movies.length) {
    renderMessage("No se encontraron resultados con los filtros aplicados.");
    return;
  }

  const cards = movies.map(movie => {
    const poster = posterBlock(movie);
    const favData = favoritesCache.get(movie.imdbID);
    const rating = favData ? `${favData.rating}/5` : null;
    return `
      <article class="bg-slate-900 border border-slate-800 rounded-xl shadow-md shadow-sky-900/30 overflow-hidden flex flex-col">
        <div class="aspect-[2/3] bg-slate-800">${poster}</div>
        <div class="p-3 space-y-1 flex-1 flex flex-col">
          <h3 class="text-lg font-semibold text-slate-50">${movie.Title}</h3>
          <p class="text-slate-400 text-sm">${movie.Year || ""}</p>
          <p class="text-slate-400 text-sm">${movie.Genre || ""}</p>
          ${rating ? `<p class="text-xs text-emerald-200">Mi valoracion: ${rating}</p>` : ""}
          <div class="mt-auto pt-2">
            <a href="https://www.imdb.com/title/${movie.imdbID}" target="_blank" class="text-sky-300 text-sm hover:underline">Ver en IMDb</a>
          </div>
        </div>
      </article>
    `;
  }).join("");

  const page = payload.page || 1;
  const nextPage = page + 1;
  const prevPage = page > 1 ? page - 1 : null;

  results.innerHTML = `
    <div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3">${cards}</div>
    <div class="flex justify-between items-center mt-4 text-sm">
      <button ${prevPage ? "" : "disabled"} class="px-3 py-2 rounded border border-slate-700 text-slate-200 disabled:opacity-50" id="prev-page">Anterior</button>
      <span class="text-slate-400">Pagina ${page}</span>
      <button class="px-3 py-2 rounded border border-slate-700 text-slate-200" id="next-page">Siguiente</button>
    </div>
  `;

  const year = yearInput?.value.trim() || "";
  const genre = genreInput?.value.trim() || "";

  document.getElementById("next-page").addEventListener("click", () => {
    paginate(nextPage, year, genre);
  });
  const prevBtn = document.getElementById("prev-page");
  if (prevBtn && prevPage) {
    prevBtn.addEventListener("click", () => paginate(prevPage, year, genre));
  }
}

async function paginate(page, year, genre) {
  const title = q.value.trim();
  if (!title) return;
  const params = new URLSearchParams({ search: title, page: String(page) });
  if (year) params.append("year", year);
  if (genre) params.append("genre", genre);
  showLoader(true);
  try {
    const res = await fetch(`/api/movies?${params.toString()}`);
    const data = await res.json();
    if (res.ok) renderList(data);
  } finally {
    showLoader(false);
  }
}

async function addFavorite(imdbid, buttonEl) {
  const session = window.authSession?.();
  if (!session?.token || !session.userId) {
    showToast("Inicia sesion para guardar favoritos", "info");
    return;
  }

  if (favoritesCache.has(imdbid)) {
    showToast("Esta pelicula ya esta en favoritos", "info");
    buttonEl.disabled = true;
    buttonEl.textContent = "Ya en favoritos";
    return;
  }

  buttonEl.disabled = true;
  buttonEl.textContent = "Guardando...";

  try {
    const res = await fetch(`/api/users/${session.userId}/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: "Bearer " + session.token
      },
      body: JSON.stringify({ imdbid })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || "No se pudo guardar", "error");
      buttonEl.disabled = false;
      buttonEl.textContent = "Guardar en favoritos";
      return;
    }

    buttonEl.textContent = "Guardada";
    showToast("Guardada en favoritos", "success");
    favoritesCache.set(imdbid, { rating: 5, comment: "" });
    buttonEl.disabled = true;
    buttonEl.textContent = "Ya en favoritos";
  } catch (err) {
    console.error(err);
    showToast("No se pudo guardar ahora mismo", "error");
    buttonEl.disabled = false;
    buttonEl.textContent = "Guardar en favoritos";
  }
}

async function loadTrending() {
  if (!trendingGrid) return;
  try {
    const res = await fetch("/api/trending");
    const data = await res.json();
    if (!res.ok || !data.results) return;
    trendingGrid.innerHTML = data.results.slice(0, 6).map(m => `
      <article class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md shadow-sky-900/30 flex gap-3">
        <div class="w-16 h-20 bg-slate-800 rounded overflow-hidden">${posterBlock(m)}</div>
        <div class="flex-1">
          <h3 class="text-sm font-semibold text-slate-50">${m.Title}</h3>
          <p class="text-xs text-slate-400">${m.Year || ""} ${m.Genre || ""}</p>
          <p class="text-xs text-slate-400 overflow-hidden">${m.Plot || ""}</p>
        </div>
      </article>
    `).join("");
  } catch (err) {
    console.error("trending error", err);
  }
}

searchBtn.addEventListener('click', searchMovie);
q.addEventListener('keypress', (e) => {
  if (e.key === "Enter") searchMovie(e);
});

async function loadFavoritesCache() {
  const session = window.authSession?.();
  if (!session?.token || !session.userId) {
    favoritesCache = new Map();
    return;
  }
  try {
    const res = await fetch(`/api/users/${session.userId}/favorites`, {
      headers: { Authorization: "Bearer " + session.token }
    });
    const data = await res.json();
    if (res.ok && Array.isArray(data.favorites)) {
      favoritesCache = new Map(
        data.favorites
          .map(f => typeof f === "string"
            ? [f, { rating: 5, comment: "" }]
            : [f.imdbid, { rating: f.rating || 5, comment: f.comment || "" }])
      );
    }
  } catch (e) {
    console.error("favorites cache error", e);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadTrending();
  loadFavoritesCache();
});
