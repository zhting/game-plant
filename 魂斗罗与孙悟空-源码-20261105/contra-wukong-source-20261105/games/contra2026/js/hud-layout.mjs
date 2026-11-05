// Shared by the painted inventory and its pointer hit areas in every HD stage.
export const HUD_PLAYER_X = Object.freeze([8, 248]);

export function inventorySlotBounds(index, hudX = HUD_PLAYER_X[0]) {
  return { x: hudX + 39 + index * 18, y: 15.5, w: 17, h: 9.5 };
}

export function inventorySlotAt(x, y, playerIndex = 0) {
  for (let index = 0; index < 3; index++) {
    const box = inventorySlotBounds(index, HUD_PLAYER_X[playerIndex]);
    if (x >= box.x && x < box.x + box.w && y >= box.y && y < box.y + box.h) return index;
  }
  return -1;
}
