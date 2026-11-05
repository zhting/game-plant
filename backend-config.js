/* 联机后台地址。默认与页面同源（由 backend/server.mjs 同时提供页面与联机服务）。
 * 若前端与后台分开部署，把 url 改为后台的 HTTPS 地址，例如 'https://api.example.com'。 */
window.GAMES_BACKEND = {
  url: '',
  contraPath: '/games/contra2026/ws',
  wukongPath: '/games/wukong/ws'
};
