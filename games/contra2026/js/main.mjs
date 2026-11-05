// Keep old bookmarks working while each game owns its document and URL.
const params = new URLSearchParams(location.search);
if (params.get('theme') === 'wukong') {
  params.delete('theme');
  const target = new URL('/games/wukong/', location.origin);
  target.search = params.toString();
  target.hash = location.hash;
  location.replace(target.href);
} else {
  const [{ startArcade }, { loadProjectSpec }] = await Promise.all([
    import('/games/shared/arcade-engine.mjs?v=spec-1'),
    import('/games/shared/project-spec.mjs?v=spec-1'),
  ]);
  // /play/<project>/ pages boot with that project's game.json; the stock page boots the template.
  startArcade(undefined, await loadProjectSpec());
}
