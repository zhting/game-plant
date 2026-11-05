import test from 'node:test';
import assert from 'node:assert/strict';
import { thermalSeconds, thermalTemperature, colorizeThermalPixels, ThermalMaterialCache } from '../../games/contra2026/js/stage-five-thermal.mjs';

test('热成像只随存活角色的道具时效开启，不依赖暴风雪强度',()=>{
  assert.equal(thermalSeconds([]),0);assert.equal(thermalSeconds([{thermT:0},{thermT:-.01}]),0);
  assert.equal(thermalSeconds([{thermT:15},{thermT:7}]),15);
  assert.equal(thermalSeconds([{thermT:15,dead:true},{thermT:4}]),4);
  assert.equal(thermalSeconds([{thermT:15,dead:true}]),0);
});
test('人体头胸、机械发动机与雪层具有不同温度，枪械低于人体热源',()=>{
  const head=thermalTemperature('human',.5,.15),torso=thermalTemperature('human',.5,.5),boots=thermalTemperature('human',.5,.97),gun=thermalTemperature('human',.95,.25);
  assert.ok(head>torso&&torso>boots&&boots>gun);
  const engine=thermalTemperature('vehicle',.88,.47),tracks=thermalTemperature('vehicle',.5,.9),snow=thermalTemperature('vehicle',.5,.05,1);
  assert.ok(engine>tracks&&tracks>snow);assert.ok(thermalTemperature('cold',.5,.5,1)<boots);
});
test('温度着色保留透明轮廓、半透明边缘与动作内部细节',()=>{
  const pixels=new Uint8ClampedArray([9,20,30,0,80,90,100,70,150,160,170,128,220,230,240,255]);
  colorizeThermalPixels(pixels,2,2,'human');
  assert.deepEqual([...pixels.filter((_,i)=>i%4===3)],[0,70,128,255]);assert.deepEqual([...pixels.slice(0,4)],[9,20,30,0]);
  assert.notDeepEqual([...pixels.slice(4,7)],[80,90,100]);assert.notDeepEqual([...pixels.slice(4,7)],[...pixels.slice(8,11)]);
});
test('静态材质复用缓存，动作版本更新且传感器计算尺寸有限',()=>{
  const createCanvas=()=>{
    const canvas={width:1,height:1};const ink={setTransform(){},clearRect(){},drawImage(){},
      getImageData(){const data=new Uint8ClampedArray(canvas.width*canvas.height*4);for(let i=0;i<data.length;i+=4){data[i]=120;data[i+1]=130;data[i+2]=140;data[i+3]=i?255:0;}return{data};},putImageData(){}};
    canvas.getContext=()=>ink;return canvas;
  };
  const cache=new ThermalMaterialCache(createCanvas),source={width:4000,height:2000},crop=[0,0,4000,2000],options={w:180,h:80};
  const first=cache.image(source,crop,'vehicle',options),again=cache.image(source,crop,'vehicle',options);
  assert.equal(first,again);assert.equal(cache.inspect().converted,1);assert.equal(first.width,720);assert.equal(first.height,320);
  cache.image(source,crop,'vehicle',{...options,version:1});assert.equal(cache.inspect().converted,2);
  cache.image(source,crop,'vehicle',{...options,version:1,force:true});assert.equal(cache.inspect().converted,3);
});

test('运动热像复用温度场，以原动作透明轮廓裁切且不逐帧读取像素',()=>{
  let reads=0,fields=0;const createCanvas=()=>{
    const canvas={width:1,height:1},ink={draws:[],setTransform(){},
      createImageData(w,h){return{data:new Uint8ClampedArray(w*h*4)};},putImageData(){fields++;},getImageData(){reads++;throw Error('Animated frame readback');},
      drawImage(...args){this.draws.push({mode:this.globalCompositeOperation,alpha:this.globalAlpha,args});}};
    canvas.getContext=()=>ink;return canvas;
  };
  const cache=new ThermalMaterialCache(createCanvas),source={width:280,height:360,getContext(){}},options={w:28,h:36,actor:{x:-14,y:-36,w:28,h:36}};
  const image=cache.image(source,[0,0,280,360],'human',options);
  cache.image(source,[0,0,280,360],'human',{...options,version:1});
  assert.equal(reads,0);assert.equal(fields,1);assert.equal(cache.inspect().converted,2);
  const draws=image.getContext().draws;assert.deepEqual(draws.map(d=>d.mode),['copy','multiply','destination-in','copy','multiply','destination-in']);
  assert.equal(draws.at(-1).args[0],source);assert.equal(draws.at(-1).alpha,1);assert.equal(image.getContext().globalCompositeOperation,'source-over');
});
