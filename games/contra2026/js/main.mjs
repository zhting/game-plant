// Keep old bookmarks working while each game owns its document and URL.
const params = new URLSearchParams(location.search);
if (params.get('theme') === 'wukong') {
  params.delete('theme');
  const target = new URL('/games/wukong/', location.origin);
  target.search = params.toString();
  target.hash = location.hash;
  location.replace(target.href);
} else {
  const [{ startArcade }, { loadProjectSpec, loadProjectModules }] = await Promise.all([
    import('/games/shared/arcade-engine.mjs?v=mods-2'),
    import('/games/shared/project-spec.mjs?v=mods-1'),
  ]);
  // /play/<project>/ pages boot with that project's game.json and modules; the stock page boots the template.
  const [spec, modules] = await Promise.all([loadProjectSpec(), loadProjectModules()]);
  startArcade(undefined, spec, modules);
}
