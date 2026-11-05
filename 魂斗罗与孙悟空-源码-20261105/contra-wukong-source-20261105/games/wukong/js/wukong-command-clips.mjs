// Authored timings for complete painted figures, not body-part transforms.
// The strike drawings stay on screen long enough to read before recovery.
const clip=(duration,sheet,times,start=0)=>Object.freeze({duration,sheet,times:Object.freeze(times),start});
export const COMMAND_CLIPS=Object.freeze({
  thrust:clip(.48,'extra',[0,.10,.22,.34,.48,.70,.84,.96]),
  lift:clip(.56,'uppercut',[0,.10,.24,.38,.52,.70,.85,.96]),
  low:clip(.64,'low',[0,.10,.23,.36,.50,.66,.83,.96]),
  wheel:clip(.78,'cyclone',[0,.10,.23,.36,.50,.65,.81,.96]),
  sweep:clip(1.05,null,[0,.10,.23,.36,.50,.65,.81,.96]),
  flower:clip(1.12,null,[0,.10,.23,.36,.50,.65,.81,.96]),
  airThrust:clip(.44,'extra',[0,.10,.22,.34,.48,.70,.84,.96],8),
  airLift:clip(.54,'uppercut',[0,.10,.24,.38,.52,.70,.85,.96],8),
  travelSweep:clip(.82,'sweep',[0,.10,.22,.35,.49,.65,.82,.96],8),
  travelFlower:clip(.94,'blossom',[0,.10,.22,.35,.49,.65,.82,.96]),
  travelCleave:clip(.90,'cleave',[0,.10,.22,.35,.49,.65,.82,.96],8),
  travelWushu:clip(1.22,'martial',[0,.12,.24,.38,.53,.68,.83,.97]),
  travelCoil:clip(1.05,null,[0,.10,.22,.35,.49,.65,.82,.96]),
  travelWheel:clip(.92,'cyclone',[0,.10,.22,.35,.49,.65,.82,.96]),
  travelThrust:clip(.48,'extra',[0,.10,.22,.34,.48,.70,.84,.96]),
  travelAirWheel:clip(.60,'uppercut',[0,.10,.22,.35,.49,.65,.82,.96],8),
  travelAirCross:clip(.64,'cleave',[0,.10,.22,.35,.49,.65,.82,.96],8),
  travelAirReverse:clip(.66,'uppercut',[0,.10,.22,.35,.49,.65,.82,.96],8)
});
export function commandFrameIndex(command,phase){
  const clip=COMMAND_CLIPS[command];if(!clip)return null;
  let index=0;while(index<clip.times.length-1&&phase>=clip.times[index+1])index++;
  return index;
}
