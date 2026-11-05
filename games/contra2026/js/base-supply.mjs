// Two soldiers in each normal room carry its supplies, during the second and
// fifth waves. The rest remain ordinary soldiers; passing the room awards none.
export function baseSupplyKind(stage, room, wave) {
  if (![2,4].includes(stage) || room.boss || wave < 2 || (wave - 2) % 3) return null;
  return room.supply?.[(wave - 2) / 3] || null;
}

// Runtime uniform palette for the existing painted animation atlas. Skin,
// weapons, boots and transparency retain their original pixels and shading.
export function redSupplyUniform(data) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (!data[i + 3] || g < 22 || g < r * .82 || g < b * 1.6) continue;
    const light = r * .2126 + g * .7152 + b * .0722;
    data[i] = Math.min(255, light * 1.85);
    data[i + 1] = light * .35;
    data[i + 2] = light * .28;
  }
}
