// Studio API client. The shared Studio token (if the server sets STUDIO_TOKEN)
// is kept in localStorage and sent as a Bearer header.
const TOKEN_KEY = 'game-plant-studio-token';
export const getToken = () => localStorage.getItem(TOKEN_KEY) || '';
export const setToken = token => localStorage.setItem(TOKEN_KEY, token);

export class ApiError extends Error {
  constructor(status, message, details) { super(message); this.status = status; this.details = details; }
}

async function request(method, url, body, { raw, type, headers = {} } = {}) {
  const res = await fetch(url, {
    method,
    headers: { ...(raw ? { 'content-type': type || 'application/octet-stream' } : body ? { 'content-type': 'application/json' } : {}), ...(getToken() ? { authorization: `Bearer ${getToken()}` } : {}), ...headers },
    body: raw ?? (body ? JSON.stringify(body) : undefined),
  });
  const resType = res.headers.get('content-type') || '';
  const data = resType.includes('json') ? await res.json() : await res.text();
  if (!res.ok) throw new ApiError(res.status, data?.error || `HTTP ${res.status}`, data?.details);
  return data;
}

export const api = {
  status: () => request('GET', '/api/studio/status'),
  schema: () => request('GET', '/api/spec/schema'),
  projects: () => request('GET', '/api/projects'),
  createProject: body => request('POST', '/api/projects', body),
  duplicateProject: (id, body = {}) => request('POST', `/api/projects/${id}/duplicate`, body),
  deleteProject: id => request('DELETE', `/api/projects/${id}`),
  exportProjectZip: async id => {
    const res = await fetch(`/api/projects/${id}/export`, {
      headers: getToken() ? { authorization: `Bearer ${getToken()}` } : {},
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new ApiError(res.status, err?.error || `导出失败 HTTP ${res.status}`, err?.details);
    }
    return res.blob();
  },
  importProjectZip: (buf, title) => request('POST', '/api/projects/import', null, {
    raw: buf, type: 'application/zip', headers: title ? { 'x-title': encodeURIComponent(title) } : {},
  }),
  project: id => request('GET', `/api/projects/${id}`),
  patch: (id, patch, message) => request('PATCH', `/api/projects/${id}/game.json`, { patch, message }),
  put: (id, spec, message) => request('PUT', `/api/projects/${id}/game.json`, { spec, message }),
  undo: id => request('POST', `/api/projects/${id}/undo`),
  restore: (id, commit) => request('POST', `/api/projects/${id}/restore`, { commit }),
  diff: (id, rev) => request('GET', `/api/projects/${id}/diff/${rev}`),
  chatLog: id => request('GET', `/api/projects/${id}/chat`),
  chat: (id, message) => request('POST', `/api/projects/${id}/chat`, { message }),
  files: id => request('GET', `/api/projects/${id}/files`),
  readFile: (id, rel) => fetch(`/api/projects/${id}/files/${rel}`, { cache: 'no-store' }).then(r => r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))),
  writeFile: (id, rel, content, type, message) => request('PUT', `/api/projects/${id}/files/${rel}`, null, { raw: content, type, headers: message ? { 'x-message': encodeURIComponent(message) } : {} }),
  deleteFile: (id, rel) => request('DELETE', `/api/projects/${id}/files/${rel}`),
  editSprite: (id, body) => request('POST', `/api/projects/${id}/sprites/edit`, body),
  aiSprite: (id, body) => request('POST', `/api/projects/${id}/sprites/ai`, body),
};

