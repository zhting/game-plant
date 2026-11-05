// Keep old bookmarks working while each game owns its document and URL.
const params = new URLSearchParams(location.search);
if (params.get('theme') === 'wukong') {
  params.delete('theme');
  const target = new URL('/games/wukong/', location.origin);
  target.search = params.toString();
  target.hash = location.hash;
  location.replace(target.href);
} else {
  const { startArcade } = await import('/games/shared/arcade-engine.mjs?v=foundry-exit-art-1');
  startArcade();
}
