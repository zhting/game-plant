// Studio API client. The shared Studio token (if the server sets STUDIO_TOKEN)
// is kept in localStorage and sent as a Bearer header.
const TOKEN_KEY = 'game-plant-studio-token';
export const getToken = () => localStorage.getItem(TOKEN_KEY) || '';
export const setToken = token => localStorage.setItem(TOKEN_KEY, token);

export class ApiError extends Error {
  constructor(status, message, details) { super(message); this.status = status; this.details = details; }
}

async function request(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(getToken() ? { authorization: `Bearer ${getToken()}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const type = res.headers.get('content-type') || '';
  const data = type.includes('json') ? await res.json() : await res.text();
  if (!res.ok) throw new ApiError(res.status, data?.error || `HTTP ${res.status}`, data?.details);
  return data;
}

export const api = {
  status: () => request('GET', '/api/studio/status'),
  schema: () => request('GET', '/api/spec/schema'),
  projects: () => request('GET', '/api/projects'),
  createProject: body => request('POST', '/api/projects', body),
  project: id => request('GET', `/api/projects/${id}`),
  patch: (id, patch, message) => request('PATCH', `/api/projects/${id}/game.json`, { patch, message }),
  put: (id, spec, message) => request('PUT', `/api/projects/${id}/game.json`, { spec, message }),
  undo: id => request('POST', `/api/projects/${id}/undo`),
  restore: (id, commit) => request('POST', `/api/projects/${id}/restore`, { commit }),
  diff: (id, rev) => request('GET', `/api/projects/${id}/diff/${rev}`),
  chatLog: id => request('GET', `/api/projects/${id}/chat`),
  chat: (id, message) => request('POST', `/api/projects/${id}/chat`, { message }),
};
