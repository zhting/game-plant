export const WUKONG_STAGES = Object.freeze([1,2]);
export const WUKONG_RELEASE_MESSAGE = '大闹天宫当前开放前两章 · 云海天宫 / 南天门';
export const isWukongStageOpen = stage => Number.isInteger(stage) && WUKONG_STAGES.includes(stage);
