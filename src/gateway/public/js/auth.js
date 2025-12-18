const API_URL = "/api";

const modal = document.getElementById('auth-modal');
const openAuthBtn = document.getElementById('open-auth');
const closeAuthBtn = document.getElementById('close-auth');
const logoutBtn = document.getElementById('logout-btn');
const favoritesLink = document.getElementById('favorites-link');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegister = document.getElementById('show-register');
const showLogin = document.getElementById('show-login');

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function authSession() {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  if (!token) return null;
  const payload = decodeJwt(token);
  if (!payload?.sub) return null;

  return {
    token,
    userId: payload.sub,
    user: user ? JSON.parse(user) : null
  };
}

window.authSession = authSession;

function toggleModal(show) {
  if (!modal) return;
  modal.classList.toggle('hidden', !show);
  modal.classList.toggle('flex', !!show);
}

openAuthBtn?.addEventListener('click', () => toggleModal(true));
closeAuthBtn?.addEventListener('click', () => toggleModal(false));

showRegister?.addEventListener('click', (e) => {
  e.preventDefault();
  loginForm?.classList.add('hidden');
  registerForm?.classList.remove('hidden');
});

showLogin?.addEventListener('click', (e) => {
  e.preventDefault();
  registerForm?.classList.add('hidden');
  loginForm?.classList.remove('hidden');
});

async function register() {
  const username = document.getElementById('reg-username')?.value.trim();
  const email = document.getElementById('reg-email')?.value.trim();
  const password = document.getElementById('reg-password')?.value;

  if (!username || !email || !password) return showToast("Completa todos los campos", "info");

  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });

  const data = await res.json();
  if (res.ok) {
    showToast("Registro correcto, inicia sesion", "success");
    loginForm?.classList.remove('hidden');
    registerForm?.classList.add('hidden');
  } else {
    showToast(data.error || "No se pudo registrar", "error");
  }
}

async function login() {
  const identifier = document.getElementById('login-username')?.value.trim();
  const password = document.getElementById('login-password')?.value;

  if (!identifier || !password) return showToast("Completa todos los campos", "info");

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ identifier, password })
  });

  const data = await res.json();

  if (res.ok) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    toggleModal(false);
    updateUI();
  } else {
    showToast(data.error || "Credenciales incorrectas", "error");
  }
}

function updateUI() {
  const session = authSession();
  const loggedIn = !!session;

  openAuthBtn?.classList.toggle("hidden", loggedIn);
  logoutBtn?.classList.toggle("hidden", !loggedIn);
  favoritesLink?.classList.toggle("hidden", !loggedIn);
}

logoutBtn?.addEventListener("click", () => {
  localStorage.clear();
  updateUI();
  window.location.href = "/";
});

document.getElementById('do-register')?.addEventListener("click", register);
document.getElementById('do-login')?.addEventListener("click", login);

document.addEventListener("DOMContentLoaded", updateUI);
