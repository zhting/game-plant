const ACTIONS=Object.freeze(['up','down','left','right','fire','jump','gren','nade','cyc','start','back','cancel']);
const empty=()=>Object.fromEntries(ACTIONS.map(key=>[key,false]));
const axis=value=>Number.isFinite(value)?Math.max(-1,Math.min(1,value)):0;
const pressed=value=>typeof value==='number'?value>.5:!!value?.pressed||Number(value?.value)>.5;

export function gamepadLabel(id=''){
  return String(id).replace(/\s*\([^)]*(?:STANDARD GAMEPAD|Vendor:|Product:)[^)]*\)/gi,'').trim()||'游戏手柄';
}

export function decodeGamepad(pad){
  const input=empty();if(!pad||pad.connected===false)return input;
  const b=i=>pressed(pad.buttons?.[i]),x=axis(pad.axes?.[0]),y=axis(pad.axes?.[1]);
  input.left=x<-.3||b(14);input.right=x>.3||b(15);
  input.up=y<-.3||b(12);input.down=y>.3||b(13);
  // Common standard layout: Xbox, PlayStation and Switch pads mapped by the browser.
  input.jump=b(0);input.fire=b(2)||b(5)||b(7);input.nade=b(1);
  input.gren=b(3);input.cyc=b(4)||b(6);input.start=b(9);input.back=b(8);input.cancel=b(1);
  if(input.left&&input.right)input.left=input.right=false;
  if(input.up&&input.down)input.up=input.down=false;
  return input;
}

/** Read fresh device snapshots; never retain browser Gamepad objects. */
export class GamepadInput{
  constructor({getGamepads,onChange=()=>{}}={}){
    this.getGamepads=getGamepads;this.onChange=onChange;this.active=null;this.previous=new Map();
    this.last=empty();this.state={status:typeof getGamepads==='function'?'waiting':'unsupported',count:0,active:null};
    this.signature='';
  }
  poll(){
    let pads=[],status=typeof this.getGamepads==='function'?'waiting':'unsupported';
    if(status!=='unsupported')try{pads=Array.from(this.getGamepads()||[]).filter(p=>p&&p.connected!==false);}
    catch{status='blocked';}
    const decoded=pads.map((pad,i)=>({pad,key:`${pad.index??i}:${pad.id||''}`,input:decodeGamepad(pad)}));
    let active=decoded.find(p=>p.key===this.active);
    const changed=decoded.filter(p=>ACTIONS.some(key=>p.input[key]&&!this.previous.get(p.key)?.[key]));
    // A new press selects that controller. Idle pads never override an active one.
    if(changed.length){active=changed.find(p=>p.key===this.active)||changed.at(-1);}
    active??=decoded[0];this.active=active?.key??null;this.last=active?.input||empty();
    this.previous=new Map(decoded.map(p=>[p.key,p.input]));
    const device=active?{index:active.pad.index??0,id:String(active.pad.id||''),name:gamepadLabel(active.pad.id),mapping:active.pad.mapping||''}:null;
    this.state={status:device?'connected':status,count:pads.length,active:device};
    const signature=JSON.stringify(this.state);
    if(signature!==this.signature){this.signature=signature;this.onChange(this.inspect());}
    return this.last;
  }
  inspect(){return{...this.state,active:this.state.active?{...this.state.active}:null};}
}
