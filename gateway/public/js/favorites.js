const list = document.getElementById("fav-list");
const token = localStorage.getItem("token");

if (!token) {
  list.innerHTML = "<p>Debes iniciar sesión</p>";
  throw new Error("No autenticado");
}

const payload = JSON.parse(atob(token.split(".")[1]));
const userId = payload.sub;

async function loadFavorites() {
  const res = await fetch(`/api/users/${userId}/favorites`, {
    headers: { Authorization: "Bearer " + token }
  });

  const data = await res.json();
  const ids = data.favorites || [];

  list.innerHTML = "";

  if (ids.length === 0) {
    list.innerHTML = "<p>No tienes favoritos aún</p>";
    return;
  }

  for (const imdbid of ids) {
    const movieRes = await fetch(`/api/movies?imdbid=${imdbid}`);
    const movie = await movieRes.json();

    const div = document.createElement("div");
    div.innerHTML = `
      <img src="${movie.Poster}">
      <h3>${movie.Title}</h3>
      <button onclick="removeFavorite('${imdbid}', this)">❌ Eliminar</button>
    `;

    list.appendChild(div);
  }
}

async function removeFavorite(imdbid, btn) {
  await fetch(`/api/users/${userId}/favorites/${imdbid}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token }
  });

  btn.parentElement.remove();
}

loadFavorites();