const API = '/api';
const TOKEN_KEY = 'auth_token';

function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export async function fetchWithAuth(url, options = {}) {
  const headers = getAuthHeaders(options.headers || {});
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    options = { ...options, body: JSON.stringify(options.body) };
  }
  const r = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
  if (r.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('auth_user');
    window.dispatchEvent(new Event('auth:logout'));
  }
  return r;
}

export async function login(username, password) {
  const r = await fetch(API + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.error || 'Error al iniciar sesión');
  }
  return r.json();
}

export async function getLoginNames() {
  const r = await fetch(API + '/auth/login-names');
  if (!r.ok) return { names: [] };
  const data = await r.json();
  return { names: data.names || [] };
}

export async function register(nombre, password, rol) {
  const r = await fetchWithAuth(API + '/auth/register', {
    method: 'POST',
    body: { nombre, password, rol },
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.error || 'Error al registrar');
  }
  return r.json();
}

export async function getMe() {
  const r = await fetchWithAuth(API + '/auth/me');
  if (!r.ok) throw new Error('Sesión inválida');
  return r.json();
}

export async function getUsers() {
  const r = await fetchWithAuth(API + '/users');
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function deleteUser(id) {
  const r = await fetchWithAuth(API + '/users/' + encodeURIComponent(id), { method: 'DELETE' });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.error || await r.text());
  }
  return r.json();
}

/** Perfiles para asignación (cualquier usuario autenticado) */
export async function getUsersProfiles() {
  const r = await fetchWithAuth(API + '/users/profiles');
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getWorkspaces() {
  const r = await fetchWithAuth(API + '/workspaces');
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function createWorkspace(name, categoria_raiz = 'PROYECTOS') {
  const r = await fetchWithAuth(API + '/workspaces', {
    method: 'POST',
    body: { name: name || (categoria_raiz === 'CLIENTE_GRANDE' ? 'Nuevo cliente' : 'PROYECTOS'), categoria_raiz },
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getFolders(workspaceId, parentId) {
  let url = API + '/folders?workspaceId=' + encodeURIComponent(workspaceId);
  if (parentId !== undefined) url += '&parentId=' + (parentId === null || parentId === '' ? '' : encodeURIComponent(parentId));
  const r = await fetchWithAuth(url);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getFolder(id) {
  const r = await fetchWithAuth(API + '/folders/' + encodeURIComponent(id));
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function createFolder(workspaceId, name, parentId) {
  const body = {
    workspaceId,
    name: name || 'Nueva carpeta',
    parentId: parentId === undefined || parentId === '' ? null : parentId,
  };
  const r = await fetchWithAuth(API + '/folders', {
    method: 'POST',
    body,
  });
  const text = await r.text();
  if (!r.ok) {
    try {
      const d = JSON.parse(text);
      throw new Error(d.error || text || 'Error al crear carpeta');
    } catch (e) {
      if (e instanceof Error && e.message && e.message !== text) throw e;
      throw new Error(text || 'Error al crear carpeta');
    }
  }
  return text ? JSON.parse(text) : null;
}

export async function updateFolder(id, data) {
  const r = await fetchWithAuth(API + '/folders/' + encodeURIComponent(id), {
    method: 'PATCH',
    body: data,
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function deleteFolder(id) {
  const r = await fetchWithAuth(API + '/folders/' + encodeURIComponent(id), { method: 'DELETE' });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function updateWorkspace(id, data) {
  const r = await fetchWithAuth(API + '/workspaces/' + encodeURIComponent(id), {
    method: 'PATCH',
    body: data,
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function deleteWorkspace(id) {
  const r = await fetchWithAuth(API + '/workspaces/' + encodeURIComponent(id), { method: 'DELETE' });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getBoards(workspaceId) {
  const q = workspaceId ? `?workspaceId=${workspaceId}` : '';
  const r = await fetchWithAuth(API + '/boards' + q);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getBoard(id) {
  const r = await fetchWithAuth(API + '/boards/' + id);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/** Obtiene o crea el board del mes para un workspace */
export async function ensureBoardForMonth(workspaceId, mesRegistro) {
  const r = await fetchWithAuth(
    API + '/boards/ensure-month?workspaceId=' + encodeURIComponent(workspaceId) + '&mes_registro=' + encodeURIComponent(mesRegistro)
  );
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/** Obtiene o crea el board de una carpeta (PROYECTOS) */
export async function ensureBoardForFolder(workspaceId, folderId) {
  const r = await fetchWithAuth(
    API + '/boards/ensure-folder?workspaceId=' + encodeURIComponent(workspaceId) + '&folderId=' + encodeURIComponent(folderId)
  );
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function updateBoard(id, data) {
  const r = await fetchWithAuth(API + '/boards/' + id, {
    method: 'PATCH',
    body: data,
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getGroups(boardId) {
  const r = await fetchWithAuth(API + '/groups?boardId=' + boardId);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function createGroup(boardId, title) {
  const r = await fetchWithAuth(API + '/groups', {
    method: 'POST',
    body: { boardId, title: title || 'Nuevo grupo' },
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function updateGroup(id, data) {
  const r = await fetchWithAuth(API + '/groups/' + id, {
    method: 'PATCH',
    body: data,
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function createItem(groupId, name) {
  const r = await fetchWithAuth(API + '/items', {
    method: 'POST',
    body: { groupId, name: name || 'Sin título' },
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function updateItem(id, data) {
  const r = await fetchWithAuth(API + '/items/' + id, {
    method: 'PATCH',
    body: data,
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function deleteItem(id) {
  const r = await fetchWithAuth(API + '/items/' + id, { method: 'DELETE' });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function setCellValue(itemId, columnId, value) {
  const r = await fetchWithAuth(API + '/values', {
    method: 'PUT',
    body: { itemId, columnId, value },
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getColumns(boardId) {
  const r = await fetchWithAuth(API + '/columns?boardId=' + boardId);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function createColumn(boardId, title, type) {
  const r = await fetchWithAuth(API + '/columns', {
    method: 'POST',
    body: { boardId, title: title || 'Columna', type: type || 'text' },
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function uploadFile(file) {
  const fd = new FormData();
  fd.append('file', file);
  const token = localStorage.getItem(TOKEN_KEY);
  const r = await fetch(API + '/upload', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
