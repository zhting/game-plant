import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer as createJunqi } from '../games/junqi/server/index.js';
import { attachContra } from './contra.mjs';
import { isWukongStageOpen, WUKONG_RELEASE_MESSAGE } from '../games/wukong/js/release-stages.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 将所有需要服务器的游戏挂到一个 HTTP 服务，保留原游戏的规则与协议。 */
export async function attachGames(server, { dataDir = process.env.GAMES_DATA_DIR || path.join(root, 'backend/data') } = {}) {
  process.env.GDG_DATA_DIR = path.join(dataDir, 'gandengyan');
  const { default: gandengyan } = await import(pathToFileURL(path.join(root, 'games/gandengyan/server.js')).href);
  gandengyan.io.attach(server, {
    path: '/games/gandengyan/socket.io',
    destroyUpgrade: false,
    cors: { origin: process.env.GAMES_ALLOWED_ORIGINS?.split(',') || '*' }
  });
  const junqi = createJunqi({
    httpServer: server,
    wsPaths: ['/games/junqi/ws', '/ws'],
    dataFile: path.join(dataDir, 'junqi/players.json')
  });
  const contra = attachContra(server);
  const wukong = attachContra(server, { path: '/games/wukong/ws', stageAllowed: isWukongStageOpen, releaseMessage: WUKONG_RELEASE_MESSAGE });

  return {
    health() {
      return { ok: true, games: { junqi: junqi.lobby.stats(), gandengyan: { rooms: gandengyan.rooms.rooms.size }, contra2026: contra.stats(), wukong: wukong.stats() } };
    },
    async close() {
      await contra.close();
      await wukong.close();
      await new Promise(resolve => gandengyan.io.close(resolve));
      gandengyan.rooms.rooms.forEach(room => gandengyan.rooms.destroyRoom(room));
      gandengyan.store.flush();
      await junqi.close();
    }
  };
}
