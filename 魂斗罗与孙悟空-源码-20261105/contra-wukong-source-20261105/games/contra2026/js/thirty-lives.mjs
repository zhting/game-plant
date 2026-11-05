export const THIRTY_LIVES=30;
const SEQUENCE=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyB','KeyA','KeyB','KeyA'];
const KEYS=new Set(SEQUENCE);

// Only deliberate presses count. Partial input is discarded when leaving the title.
export class ThirtyLivesCheat{
  constructor(){this.enabled=false;this.resetInput();}
  resetInput(){this.keys=[];this.keyTime=null;this.taps=[];}
  clear(){this.enabled=false;this.resetInput();}
  enable(){const changed=!this.enabled;this.enabled=true;this.resetInput();return changed;}
  key(code,now,{repeat=false,modified=false}={}){
    if(repeat)return false;
    if(modified||!KEYS.has(code)){this.keys=[];this.keyTime=null;return false;}
    if(this.keyTime!==null&&now-this.keyTime>2000)this.keys=[];
    this.keyTime=now;this.keys.push(code);
    while(this.keys.length&&!this.keys.every((key,i)=>key===SEQUENCE[i]))this.keys.shift();
    if(this.keys.length===SEQUENCE.length){this.resetInput();return true;}
    return false;
  }
  tap(now){
    this.taps=this.taps.filter(time=>now-time<=4000);this.taps.push(now);
    if(this.taps.length>=8){this.resetInput();return true;}
    return false;
  }
}

export function inTitleLogo(x,y){return x>=8&&x<=376&&y>=14&&y<=72;}
