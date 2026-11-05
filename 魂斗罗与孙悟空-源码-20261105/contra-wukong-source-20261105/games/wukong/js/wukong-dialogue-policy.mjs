import { EXTRA_HERO_VOICES } from './wukong-dialogue-bank.mjs';

export const HERO_DIALOGUE_POLICY=Object.freeze({interval:5.2,globalGap:3,priorityGap:4.5,repeatGap:24,recentCount:4,signatureGap:60,signatureEvery:4});
const originals={ordinary:['effort1','effort2','effort3'],heavy:['effort1','effort3'],qi:['effort1'],ultimate:[]};
export const HERO_DIALOGUE_POOLS=Object.freeze(Object.fromEntries(Object.entries(originals).map(([family,keys])=>
  [family,Object.freeze([...keys,...EXTRA_HERO_VOICES.filter(v=>v.families.includes(family)).map(v=>v.key)])])));
export const heroVoiceFamily=event=>event.sound==='ultimate'?'ultimate':event.sound==='qi'?'qi':event.sound==='heavy'?'heavy':'ordinary';

// Presentation owns its own PRNG. Choosing a line never consumes combat RNG.
export class HeroDialogue{
  constructor({seed=Date.now()>>>0}={}){this.seed=seed||1;this.reset();}
  reset(){this.bags=new Map();this.recent=[];this.keyAt=new Map();this.signatureAt=-Infinity;this.ultimateCalls=0;}
  random(){let x=this.seed;x^=x<<13;x^=x>>>17;x^=x<<5;this.seed=x>>>0;return this.seed/4294967296;}
  shuffle(keys){const bag=[...keys];for(let i=bag.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}return bag;}
  choose(family,clock,{available=()=>true,finale=false}={}){
    const rules=HERO_DIALOGUE_POLICY;
    const signatureReady=clock-this.signatureAt>=rules.signatureGap&&!this.recent.includes('shout');
    if(family==='ultimate'&&signatureReady&&available('shout')&&(finale||(this.ultimateCalls+1)%rules.signatureEvery===0))return 'shout';
    const pool=HERO_DIALOGUE_POOLS[family]||HERO_DIALOGUE_POOLS.ordinary;
    const eligible=key=>available(key)&&!this.recent.includes(key)&&clock-(this.keyAt.get(key)??-Infinity)>=rules.repeatGap;
    let bag=this.bags.get(family)||[],index=bag.findIndex(eligible);
    if(index<0){bag=this.shuffle(pool.filter(eligible));index=0;}
    const key=bag[index];if(!key)return null;
    bag.splice(index,1);this.bags.set(family,bag);return key;
  }
  commit(key,family,clock){
    this.recent.push(key);this.recent=this.recent.slice(-HERO_DIALOGUE_POLICY.recentCount);this.keyAt.set(key,clock);
    if(key==='shout')this.signatureAt=clock;
    if(family==='ultimate')this.ultimateCalls++;
  }
  inspect(){return {recent:[...this.recent],ultimateCalls:this.ultimateCalls,policy:HERO_DIALOGUE_POLICY};}
}
