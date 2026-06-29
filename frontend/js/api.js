/* ===========================
   SHARED UTILITIES
   =========================== */

const API = 'http://localhost:5000/api';

// ---- TOKEN ----
const getToken = () => localStorage.getItem('token');
const getUser  = () => JSON.parse(localStorage.getItem('user') || 'null');
const setAuth  = (user, token) => {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('token', token);
};
const clearAuth = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

// ---- FETCH HELPERS ----
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

async function apiGet(path) {
  const res = await fetch(API + path, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

async function apiPost(path, body) {
  const res = await fetch(API + path, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

async function apiPut(path, body) {
  const res = await fetch(API + path, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

async function apiDelete(path) {
  const res = await fetch(API + path, { method: 'DELETE', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ---- TOAST ----
function toast(msg, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ---- REDIRECT HELPERS ----
function requireAuth() {
  if (!getToken()) { window.location.href = '/pages/login.html'; return false; }
  return true;
}
function redirectIfLoggedIn() {
  if (getToken()) window.location.href = '/pages/feed.html';
}

// ---- TIME FORMAT ----
function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

// ---- AVATAR HELPER ----
function avatarEl(user, size = 40) {
  const initial = (user.fullName || user.username || '?')[0].toUpperCase();
  if (user.avatar) {
    return `<img src="${user.avatar}" class="avatar" width="${size}" height="${size}" style="width:${size}px;height:${size}px">`;
  }
  return `<div class="avatar-placeholder" style="width:${size}px;height:${size}px;font-size:${size*0.4}px">${initial}</div>`;
}

// ---- NAV BAR ----
function renderNav(activePage = '') {
  const user = getUser();
  if (!user) return;
  const nav = document.getElementById('topnav');
  if (!nav) return;
  nav.innerHTML = `
    <a class="logo" href="/pages/feed.html">✦ Vibe</a>
    <input class="search-input" id="nav-search" placeholder="Search users…" type="text" autocomplete="off">
    <nav class="nav-links">
      <a href="/pages/feed.html" class="nav-btn ${activePage==='feed'?'active':''}">Home</a>
      <a href="/pages/explore.html" class="nav-btn ${activePage==='explore'?'active':''}">Explore</a>
      <a href="/pages/profile.html?u=${user.username}" class="nav-btn ${activePage==='profile'?'active':''}">Profile</a>
      <a href="#" class="nav-btn" id="logout-btn">Sign out</a>
    </nav>
    <a href="/pages/profile.html?u=${user.username}">
      ${user.avatar
        ? `<img src="${user.avatar}" class="avatar-sm">`
        : `<div class="avatar-placeholder" style="width:34px;height:34px;font-size:14px">${(user.fullName||user.username)[0].toUpperCase()}</div>`}
    </a>
  `;

  document.getElementById('logout-btn').addEventListener('click', e => {
    e.preventDefault(); clearAuth(); window.location.href = '/pages/login.html';
  });

  const searchInput = document.getElementById('nav-search');
  let timer;
  searchInput.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const q = searchInput.value.trim();
      if (!q) return;
      window.location.href = `/pages/explore.html?search=${encodeURIComponent(q)}`;
    }, 500);
  });
}