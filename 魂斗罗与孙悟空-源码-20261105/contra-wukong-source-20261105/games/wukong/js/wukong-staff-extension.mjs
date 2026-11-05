import { staffSequenceBeat } from './wukong-staff-sequences.mjs';
// Extend only during a strike; the same envelope drives painting and damage.
export const STAFF_EXTENSION=Object.freeze({maxScale:1.45,extendAt:.12,fullAt:.38,retractAt:.62,damageEnd:.68,retractedAt:.98,recovery:.16});
const clamp=n=>Math.max(0,Math.min(1,n)),ease=n=>{n=clamp(n);return n*n*(3-2*n);};
const eligible=a=>a?.weapon==='laser'&&!['ultimate','qiCast'].includes(a.kind);
export function extendStaffAction(action,pace=1){
  return eligible(action)?{...action,extension:true,duration:action.duration+STAFF_EXTENSION.recovery*pace}:action;
}
export function staffExtension(p,time=p.staff?.t??0){
  const a=p.staff;
  if(!eligible(a)||p.dead||p.hurt||p.staffCharge?.active)return {scale:1,amount:0,recovering:false};
  const phase=clamp(time/a.duration),u=staffSequenceBeat(a.variant,phase)?.phase??phase,s=STAFF_EXTENSION;
  const amount=ease((u-s.extendAt)/(s.fullAt-s.extendAt))*(1-ease((u-s.retractAt)/(s.retractedAt-s.retractAt)));
  return {scale:1+(s.maxScale-1)*amount,amount,recovering:u>=s.damageEnd};
}
