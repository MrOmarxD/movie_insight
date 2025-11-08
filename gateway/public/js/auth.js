const API_URL = "/api";

// Modal controls
const modal = document.getElementById('auth-modal');
const openAuthBtn = document.getElementById('open-auth');
const closeAuthBtn = document.getElementById('close-auth');
const logoutBtn = document.getElementById('logout-btn');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegister = document.getElementById('show-register');
const showLogin = document.getElementById('show-login');
const modalTitle = document.getElementById('modal-title');

openAuthBtn.addEventListener('click', ()=> {
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  updateModalState();
});
closeAuthBtn.addEventListener('click', ()=> {
  modal.classList.add('hidden');
  modal.classList.remove('flex');
});
showRegister.addEventListener('click', (e)=> { e.preventDefault(); loginForm.classList.add('hidden'); registerForm.classList.remove('hidden'); modalTitle.textContent='Registrar'; });
showLogin.addEventListener('click', (e)=> { e.preventDefault(); registerForm.classList.add('hidden'); loginForm.classList.remove('hidden'); modalTitle.textContent='Iniciar sesión'; });

async function register() {
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  if(!username||!email||!password){ alert('Rellena todos los campos'); return; }
  const res = await fetch(API_URL+'/auth/register', {
    method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({username,email,password})
  });
  const data = await res.json();
  if(res.ok){ alert('Registrado correctamente, inicia sesión'); registerForm.classList.add('hidden'); loginForm.classList.remove('hidden'); modalTitle.textContent='Iniciar sesión'; }
  else alert(data.error || 'Error');
}

async function login() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  if(!username||!password){ alert('Rellena todos los campos'); return; }
  const res = await fetch(API_URL+'/auth/login', {
    method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({username,password})
  });
  const data = await res.json();
  if(res.ok && data.token){
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    modal.classList.add('hidden'); modal.classList.remove('flex');
    updateModalState();
  } else {
    alert(data.error || 'Credenciales incorrectas');
  }
}

document.getElementById('do-register').addEventListener('click', register);
document.getElementById('do-login').addEventListener('click', login);

function updateModalState(){
  const token = localStorage.getItem('token');
  if(token){
    openAuthBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
  } else {
    openAuthBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
  }
}

logoutBtn.addEventListener('click', ()=> {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  updateModalState();
});

// Initialize
document.addEventListener('DOMContentLoaded', updateModalState);
