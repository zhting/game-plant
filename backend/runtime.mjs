import { attachContra } from './contra.mjs';
import { isWukongStageOpen, WUKONG_RELEASE_MESSAGE } from '../games/wukong/js/release-stages.mjs';

/** 将魂斗罗与大闹天宫的双人联机服务挂到同一个 HTTP 服务，保留原游戏的规则与协议。 */
export async function attachGames(server) {
  const contra = attachContra(server);
  const wukong = attachContra(server, { path: '/games/wukong/ws', stageAllowed: isWukongStageOpen, releaseMessage: WUKONG_RELEASE_MESSAGE });

  return {
    health() {
      return { ok: true, games: { contra2026: contra.stats(), wukong: wukong.stats() } };
    },
    async close() {
      await contra.close();
      await wukong.close();
    }
  };
}
