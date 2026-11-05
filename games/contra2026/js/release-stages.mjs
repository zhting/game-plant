// Public release boundary, shared by the browser and multiplayer service.
// Later-stage prototypes remain in source while their entry points stay closed.
export const OPEN_STAGES=Object.freeze([1,2,3,4,5,6,7,8]);
export const LAST_OPEN_STAGE=OPEN_STAGES.at(-1);
export const STAGE_RELEASE_MESSAGE='当前版本开放第一关至第八关';
export const isStageOpen=stage=>Number.isInteger(stage)&&OPEN_STAGES.includes(stage);
export const nextOpenStage=stage=>isStageOpen(stage+1)?stage+1:null;
