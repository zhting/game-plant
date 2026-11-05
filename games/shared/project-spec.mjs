// Project boot: a game page served at /play/<project>/ loads that project's
// game.json (GameSpec overrides) before starting the engine. The stock pages
// (/games/contra2026/, /games/wukong/) have no project and boot the template.
export const PROJECT_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,39}$/;

/** Project id from a /play/<id>/ URL, or null for stock pages. */
export function projectFromPath(pathname) {
  const id = /^\/play\/([^/]+)(?:\/|$)/.exec(pathname)?.[1];
  return id && PROJECT_ID_PATTERN.test(id) ? id : null;
}

/** Fetch the project's overrides; undefined when the page is not a project page. */
export async function loadProjectSpec(loc = location, fetchImpl = fetch) {
  const id = projectFromPath(loc.pathname);
  if (!id) return undefined;
  const rev = new URLSearchParams(loc.search).get('rev');
  const url = `/api/projects/${id}/game.json` + (rev ? `?rev=${encodeURIComponent(rev)}` : '');
  const res = await fetchImpl(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`项目 ${id} 的 game.json 加载失败（HTTP ${res.status}）`);
  return res.json();
}
