/* 所有联网游戏共用腾讯云后台；本地 HTTP 预览仍连接当前服务。 */
window.GAMES_BACKEND = {
  url: (location.protocol === 'http:' || ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname))
    ? '' : 'https://api.tangletang.top',
  gandengyanPath: '/games/gandengyan/socket.io',
  junqiPath: '/games/junqi/ws',
  contraPath: '/games/contra2026/ws',
  wukongPath: '/games/wukong/ws'
};
