import test from 'node:test';
import assert from 'node:assert/strict';
import { GamepadInput, decodeGamepad, gamepadLabel } from '../../games/contra2026/js/gamepad-input.mjs';

const pad=(index=0,id='Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)',buttons=[],axes=[0,0])=>({index,id,connected:true,mapping:'standard',buttons:Array.from({length:17},(_,i)=>({pressed:buttons.includes(i),value:buttons.includes(i)?1:0})),axes});

test('USB 与蓝牙标准手柄使用同一组物理按键，摇杆过滤漂移并支持十字键',()=>{
  for(const id of ['Xbox 360 Controller (XInput STANDARD GAMEPAD)','Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)','Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 09cc)']){
    for(const [button,action]of [[0,'jump'],[1,'nade'],[2,'fire'],[3,'gren'],[4,'cyc'],[5,'fire'],[6,'cyc'],[7,'fire'],[8,'back'],[9,'start'],[12,'up'],[13,'down'],[14,'left'],[15,'right']]){
      const input=decodeGamepad(pad(0,id,[button]));assert.equal(input[action],true,`${id}: ${action}`);
    }
  }
  assert.ok(Object.values(decodeGamepad(pad(0,'',[],[.29,-.29]))).every(v=>!v));
  assert.equal(decodeGamepad(pad(0,'',[],[-.7,.8])).left,true);
  assert.equal(decodeGamepad(pad(0,'',[],[-.7,.8])).down,true);
  assert.equal(decodeGamepad(pad(0,'',[14,15])).left,false);
  assert.equal(decodeGamepad(pad(0,'',[12,13])).up,false);
  const analog=pad();analog.buttons[7]={value:.9,pressed:false};assert.equal(decodeGamepad(analog).fire,true);
  analog.buttons[7]=1;assert.equal(decodeGamepad(analog).fire,true);
  assert.equal(gamepadLabel(pad().id),'Xbox Wireless Controller');
});

test('每帧读取新快照，断开释放输入，重连允许复用索引且状态仅在设备变化时通知',()=>{
  let snapshots=[null,pad(3,'USB pad',[2])],reads=0;const changes=[];
  const input=new GamepadInput({getGamepads:()=>{reads++;return snapshots;},onChange:s=>changes.push(s)});
  assert.equal(input.poll().fire,true);input.poll();assert.equal(reads,2);assert.equal(changes.length,1);
  assert.equal(input.inspect().active.index,3);
  snapshots=[null,{...pad(3,'USB pad',[2]),connected:false}];
  assert.ok(Object.values(input.poll()).every(v=>!v));assert.equal(input.inspect().status,'waiting');
  snapshots=[pad(3,'Bluetooth replacement',[0])];assert.equal(input.poll().jump,true);
  assert.equal(input.inspect().active.name,'Bluetooth replacement');
  const inspected=input.inspect();inspected.active.name='changed';assert.equal(input.inspect().active.name,'Bluetooth replacement');
});

test('多手柄不会合并为冲突方向，只有新按键才会切换当前手柄',()=>{
  let snapshots=[pad(0,'one',[14]),pad(1,'two')];
  const input=new GamepadInput({getGamepads:()=>snapshots});assert.equal(input.poll().left,true);
  snapshots=[pad(0,'one',[14]),pad(1,'two',[15])];
  assert.equal(input.poll().right,true);assert.equal(input.last.left,false);assert.equal(input.inspect().active.index,1);
  snapshots=[pad(0,'one',[14]),pad(1,'two')];input.poll();assert.equal(input.inspect().active.index,1);
  snapshots=[pad(0,'one')];input.poll();assert.equal(input.inspect().active.index,0);
});

test('浏览器不支持或暂时拒绝手柄接口时仍可使用其他输入，接口恢复后重新识别',()=>{
  const unsupported=new GamepadInput();assert.ok(Object.values(unsupported.poll()).every(v=>!v));assert.equal(unsupported.inspect().status,'unsupported');
  let blocked=true;const input=new GamepadInput({getGamepads:()=>{if(blocked)throw Error('not allowed');return[pad()];}});
  assert.ok(Object.values(input.poll()).every(v=>!v));assert.equal(input.inspect().status,'blocked');
  blocked=false;input.poll();assert.equal(input.inspect().status,'connected');
});
