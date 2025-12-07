const API_URL = "/api";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: "Bearer " + token } : {};
}

async function loadFavorites() {
  const container = document.getElementById("fav-list");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  if (!container) return;

  if (!user || !token) {
    container.innerHTML = `
      <div class="col-span-full text-center text-slate-400">
        Debes iniciar sesión para ver tus favoritos.
      </div>`;
    return;
  }

  container.innerHTML = `
    <p class="col-span-full text-center text-sky-400">
      Cargando favoritos...
    </p>`;

  try {
    const res = await fetch(`${API_URL}/users/${user.id}/favorites`, {
      headers: authHeaders()
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("Error backend favoritos:", txt);
      container.innerHTML = `
        <div class="col-span-full text-center text-red-400">
          Error cargando favoritos.
        </div>`;
      return;
    }

    const data = await res.json();
    const ids = data.favorites || [];

    if (!ids.length) {
      container.innerHTML = `
        <div class="col-span-full text-center text-slate-500">
          Aún no tienes ninguna película marcada como favorita.
        </div>`;
      return;
    }

    const movies = [];
    for (const imdbid of ids) {
      try {
        const r = await fetch(`${API_URL}/movies?imdbid=${encodeURIComponent(imdbid)}`);
        if (!r.ok) continue;
        const m = await r.json();
        movies.push(m);
      } catch (e) {
        console.error("Error cargando película", imdbid, e);
      }
    }

    if (!movies.length) {
      container.innerHTML = `
        <div class="col-span-full text-center text-slate-500">
          No se pudieron cargar las películas.
        </div>`;
      return;
    }

    container.innerHTML = movies.map(m => {
      const poster = m.Poster && m.Poster !== "N/A"
        ? m.Poster
        : "https://via.placeholder.com/300x450?text=Sin+poster";

      return `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow hover:shadow-sky-800/40 transition hover:-translate-y-1 flex flex-col">
          <img src="${poster}" alt="${m.Title}" class="w-full h-64 object-cover">
          <div class="p-3 flex flex-col gap-1 flex-grow">
            <h3 class="text-sm font-semibold text-sky-300 line-clamp-2">
              ${m.Title} <span class="text-slate-400">(${m.Year || "-"})</span>
            </h3>
            <p class="text-xs text-slate-400 line-clamp-2">${m.Genre || ""}</p>

            <button 
              class="mt-2 text-xs px-3 py-1 rounded-full border border-red-500 text-red-300 hover:bg-red-500/10 self-start remove-fav-btn"
              data-id="${m.imdbID}">
              Quitar
            </button>
          </div>
        </div>
      `;
    }).join("");

  } catch (e) {
    console.error(e);
    container.innerHTML = `
      <div class="col-span-full text-center text-red-400">
        Error de red al cargar favoritos.
      </div>`;
  }
}

// Delegación de evento para quitar favoritos
document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("remove-fav-btn")) return;

  const imdbid = e.target.dataset.id;
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  if (!user || !token) {
    alert("Debes iniciar sesión");
    return;
  }

  try {
    const res = await fetch(
      `${API_URL}/users/${user.id}/favorites?imdbid=${encodeURIComponent(imdbid)}`,
      {
        method: "DELETE",
        headers: authHeaders()
      }
    );

    if (!res.ok) {
      const txt = await res.text();
      console.error("Error quitando favorito:", txt);
      alert("No se pudo quitar de favoritos");
      return;
    }

    loadFavorites();
  } catch (e) {
    console.error(e);
    alert("Error de red al quitar favorito");
  }
});

document.addEventListener("DOMContentLoaded", loadFavorites);