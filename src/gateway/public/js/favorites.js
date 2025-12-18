const list = document.getElementById("fav-list");
const session = window.authSession?.();

if (!session?.token || !session.userId) {
  if (list) list.innerHTML = "<p class='text-slate-300'>Inicia sesion para ver tus favoritos.</p>";
} else {
  loadFavorites();
}

function renderEmpty() {
  list.innerHTML = "<p class='text-slate-300'>Aun no tienes favoritos. Guarda tu primera pelicula desde la pagina de busqueda.</p>";
}

async function loadFavorites() {
  list.innerHTML = "<p class='text-slate-300'>Cargando favoritos...</p>";

  try {
    const res = await fetch(`/api/users/${session.userId}/favorites`, {
      headers: { Authorization: "Bearer " + session.token }
    });
    const data = await res.json();

    if (!res.ok) {
      list.innerHTML = `<p class='text-red-300'>${data.error || "No se pudieron cargar los favoritos"}</p>`;
      showToast(data.error || "No se pudieron cargar los favoritos", "error");
      return;
    }

    const favs = data.favorites || [];
    if (favs.length === 0) return renderEmpty();

    const movies = await Promise.all(favs.map(async (fav) => {
      const imdbid = fav.imdbid || fav;
      try {
        const movieRes = await fetch(`/api/movies?imdbid=${imdbid}`);
        const movie = await movieRes.json();
        return { imdbid, movie, rating: fav.rating, comment: fav.comment };
      } catch {
        return { imdbid, movie: null, rating: fav.rating, comment: fav.comment };
      }
    }));

    list.innerHTML = "";
    movies.forEach(({ imdbid, movie, rating, comment }) => {
      list.appendChild(renderCard(imdbid, movie, rating, comment));
    });
  } catch (err) {
    console.error(err);
    list.innerHTML = "<p class='text-red-300'>Error al cargar favoritos</p>";
    showToast("Error al cargar favoritos", "error");
  }
}

function initialsFromTitle(title) {
  return (title || "MI").split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase();
}

function posterBlock(movie) {
  if (movie?.Poster && movie.Poster !== "N/A") {
    return `<img src="${movie.Poster}" alt="${movie?.Title || "Poster"}" class="w-full h-full object-cover">`;
  }
  const initials = initialsFromTitle(movie?.Title);
  return `<div class="w-full h-full grid place-content-center bg-slate-800 text-slate-200 text-4xl font-semibold tracking-widest">${initials}</div>`;
}

function renderCard(imdbid, movie, rating = 5, comment = "") {
  const div = document.createElement("div");
  div.className = "bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow";

  div.innerHTML = `
    <div class="aspect-[2/3] bg-slate-800">
      ${posterBlock(movie)}
    </div>
    <div class="p-3 space-y-2">
      <h3 class="text-lg font-semibold text-white">${movie?.Title || "Pelicula sin titulo"}</h3>
      <p class="text-sm text-slate-400">${movie?.Year || ""} ${movie?.Genre || ""}</p>
      <p class="text-xs text-emerald-200" id="current-rating-${imdbid}">Tu valoracion: ${rating || 5}/5</p>
      ${comment ? `<p class="text-xs text-slate-300" id="current-comment-${imdbid}">Nota: ${comment}</p>` : `<p class="text-xs text-slate-500" id="current-comment-${imdbid}">Sin nota</p>`}
      <div class="space-y-2">
        <label class="text-xs text-slate-400">Valoracion</label>
        <div class="star-input flex gap-1" data-value="${rating || 5}">
          ${[1,2,3,4,5].map(i => `<button type="button" class="star px-1 text-lg ${i <= (rating||5) ? 'text-amber-400' : 'text-slate-600'}" data-score="${i}">&#9733;</button>`).join("")}
        </div>
        <label class="text-xs text-slate-400">Nota</label>
        <textarea class="comment-input w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm text-slate-100" rows="2">${comment || ""}</textarea>
        <div class="flex gap-2">
          <button data-imdb="${imdbid}" class="save-fav bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-3 py-2 rounded">Guardar</button>
          <button data-imdb="${imdbid}" class="remove-fav bg-red-500/10 border border-red-400/60 text-red-200 text-sm px-3 py-2 rounded hover:bg-red-500/20">Eliminar</button>
        </div>
      </div>
    </div>
  `;

  div.querySelector(".remove-fav").addEventListener("click", (e) => removeFavorite(imdbid, div, e.target));
  const starContainer = div.querySelector(".star-input");
  const starButtons = starContainer.querySelectorAll(".star");
  starButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const score = Number(btn.dataset.score);
      starContainer.dataset.value = score;
      starButtons.forEach(b => b.classList.toggle("text-amber-400", Number(b.dataset.score) <= score));
      starButtons.forEach(b => b.classList.toggle("text-slate-600", Number(b.dataset.score) > score));
    });
  });
  div.querySelector(".save-fav").addEventListener("click", (e) => updateFavorite(imdbid, div, e.target, starContainer));
  return div;
}

async function removeFavorite(imdbid, cardEl, buttonEl) {
  buttonEl.disabled = true;
  buttonEl.textContent = "Eliminando...";

  try {
    const res = await fetch(`/api/users/${session.userId}/favorites/${imdbid}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + session.token }
    });

    if (!res.ok) {
      const data = await res.json();
      showToast(data.error || "No se pudo eliminar", "error");
      buttonEl.disabled = false;
      buttonEl.textContent = "Eliminar";
      return;
    }

    cardEl.remove();
    if (!list.children.length) renderEmpty();
  } catch (err) {
    console.error(err);
    showToast("No se pudo eliminar ahora mismo", "error");
    buttonEl.disabled = false;
    buttonEl.textContent = "Eliminar";
  }
}

async function updateFavorite(imdbid, cardEl, buttonEl, starContainer) {
  const rating = Number(starContainer?.dataset.value || 5);
  const commentInput = cardEl.querySelector(".comment-input");
  buttonEl.disabled = true;
  buttonEl.textContent = "Guardando...";
  try {
    const res = await fetch(`/api/users/${session.userId}/favorites/${imdbid}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.token },
      body: JSON.stringify({ rating, comment: commentInput.value })
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "No se pudo guardar", "error");
      return;
    }
    // actualizar visualmente la vista previa
    const ratingLabel = document.getElementById(`current-rating-${imdbid}`);
    const commentLabel = document.getElementById(`current-comment-${imdbid}`);
    if (ratingLabel) ratingLabel.textContent = `Tu valoracion: ${rating}/5`;
    if (commentLabel) commentLabel.textContent = commentInput.value ? `Nota: ${commentInput.value}` : "Sin nota";
    showToast("Favorito actualizado", "success");
  } catch (err) {
    console.error(err);
    showToast("Error al guardar", "error");
  } finally {
    buttonEl.disabled = false;
    buttonEl.textContent = "Guardar";
  }
}
