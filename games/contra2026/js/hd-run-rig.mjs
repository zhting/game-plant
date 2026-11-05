// Neutral pieces register at the anatomical joint, independently of the crop.
// Width is calibrated once; animation only rotates around hip/knee/ankle.
import { RUN_BONES } from './stage-one-motion.mjs?v=leg-alignment-2';
const key='runLimbs',url='/games/contra2026/assets/stage1/runner-limbs-v2.webp';
function role(near,far){
  const frames={};
  for(const [name,parts] of [['Near',near],['Far',far]]){
    const bone=([bounds,start,end],length)=>({bounds,anchor:start,end,waist:start[1],scale:.04,scaleY:length/(end[1]-start[1]),angle:0});
    frames[`rig${name}Thigh`]=bone(parts.thigh,RUN_BONES.upper);
    frames[`rig${name}Shin`]=bone(parts.shin,RUN_BONES.lower);
    const [bounds,anchor]=parts.boot;
    frames[`rig${name}Boot`]={bounds,anchor,waist:anchor[1],scale:RUN_BONES.sole/(bounds[1]+bounds[3]-anchor[1]),angle:0};
  }
  return {key,url,size:[1086,1448],frames};
}
export const HD_RUN_RIG=Object.freeze({
  blue:role({
    thigh:[[123,58,152,196],[194,66],[194,246]],
    shin:[[128,319,128,149],[191,330],[191,457]],
    boot:[[111,501,215,157],[182,583]],
  },{
    thigh:[[115,724,164,211],[194,736],[194,922]],
    shin:[[128,997,134,175],[194,1010],[194,1158]],
    boot:[[105,1214,234,173],[181,1306]],
  }),
  red:role({
    thigh:[[474,58,152,196],[545,66],[545,246]],
    shin:[[480,319,128,149],[543,330],[543,457]],
    boot:[[462,501,220,157],[534,583]],
  },{
    thigh:[[464,724,166,211],[544,736],[544,922]],
    shin:[[478,997,134,175],[544,1010],[544,1158]],
    boot:[[457,1214,237,173],[533,1306]],
  }),
  enemy:role({
    thigh:[[827,58,152,196],[898,66],[898,246]],
    shin:[[833,319,128,149],[896,330],[896,457]],
    boot:[[813,501,219,157],[885,583]],
  },{
    thigh:[[820,724,164,211],[899,736],[899,922]],
    shin:[[834,997,132,175],[900,1010],[900,1158]],
    boot:[[810,1214,237,173],[886,1306]],
  }),
});
