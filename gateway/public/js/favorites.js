const list = document.getElementById("fav-list");

const token = localStorage.getItem("token");

if (!token) {
  list.innerHTML = "<p class='text-red-400'>Debes iniciar sesión para ver tus favoritos.</p>";
  throw new Error("No autenticado");
}

const payload = JSON.parse(atob(token.split(".")[1]));
const realUserId = payload.sub;

async function loadFavorites() {
  try {
    const res = await fetch(`/api/users/${realUserId}/favorites`, {
      headers: { Authorization: "Bearer " + token }
    });

    if (!res.ok) throw new Error("No se pudieron cargar favoritos");

    const data = await res.json();
    const ids = data.favorites || [];

    if (ids.length === 0) {
      list.innerHTML = "<p class='text-slate-400'>No has guardado películas aún.</p>";
      return;
    }

    list.innerHTML = "";

    for (const imdbid of ids) {
      const movieRes = await fetch(`/api/movies?imdbid=${imdbid}`);
      const movie = await movieRes.json();

      list.innerHTML += `
        <div class="bg-slate-900 rounded-xl shadow-lg p-4 border border-slate-800">
          <img class="rounded mb-2 w-full h-60 object-cover" src="${movie.Poster !== 'N/A' ? movie.Poster : ''}">
          <h3 class="font-semibold text-sky-300">${movie.Title} (${movie.Year})</h3>
          <p class="text-xs text-slate-400 mt-1">${movie.Plot}</p>
        </div>
      `;
    }
  } catch (err) {
    console.error("❌ Error cargando favoritos:", err);
    list.innerHTML = "<p class='text-red-400'>Error cargando favoritos.</p>";
  }
}

loadFavorites();