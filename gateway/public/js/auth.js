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

openAuthBtn.addEventListener('click', ()=> {
  modal.classList.remove('hidden');
  modal.classList.add('flex');
});

closeAuthBtn.addEventListener('click', ()=> {
  modal.classList.add('hidden');
  modal.classList.remove('flex');
});

showRegister.addEventListener('click', (e)=> {
  e.preventDefault();
  loginForm.classList.add('hidden');
  registerForm.classList.remove('hidden');
});

showLogin.addEventListener('click', (e)=> {
  e.preventDefault();
  registerForm.classList.add('hidden');
  loginForm.classList.remove('hidden');
});

async function register() {
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;

  if(!username||!email||!password) return alert("Completa todo");

  const res = await fetch(API_URL+'/auth/register', {
    method:'POST',
    headers:{'content-type':'application/json'},
    body: JSON.stringify({username,email,password})
  });

  const data = await res.json();
  if(res.ok){
    alert("Registro correcto");
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  } else {
    alert(data.error || "Error");
  }
}

async function login() {
  const identifier = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  if(!identifier||!password) return alert("Completa todo");

  const res = await fetch(API_URL+"/auth/login", {
    method:"POST",
    headers:{'content-type':'application/json'},
    body: JSON.stringify({ identifier, password })
  });

  const data = await res.json();

  if(res.ok){
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    modal.classList.add('hidden');
    updateUI();
  } else {
    alert("Credenciales incorrectas");
  }
}

function updateUI(){
  const token = localStorage.getItem("token");

  if(token){
    openAuthBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    favoritesLink.classList.remove("hidden");
  } else {
    openAuthBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    favoritesLink.classList.add("hidden");
  }
}

logoutBtn.addEventListener("click",()=>{
  localStorage.clear();
  updateUI();
});

document.getElementById('do-register').addEventListener("click", register);
document.getElementById('do-login').addEventListener("click", login);

document.addEventListener("DOMContentLoaded", updateUI);