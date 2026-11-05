// Compose complete relief panels between complete pilasters. Repeating the
// entire painting puts its two edge columns beside each other and cuts dragons
// at platform ends. This layout is anchored to each real platform, not camera.
export const FOUNDATION_CROPS=Object.freeze({
  panels:Object.freeze([Object.freeze([112,0,584,1024]),Object.freeze([840,0,568,1024])]),
  pier:Object.freeze([688,0,160,1024]),
});
export function foundationLayout(x,width){
  const pierWidth=Math.min(18,width/4),count=Math.max(1,Math.round(width/90));
  const panelWidth=(width-(count+1)*pierWidth)/count,parts=[];
  for(let i=0;i<count;i++)parts.push({kind:'panel',variant:i%2,x:x+pierWidth+i*(panelWidth+pierWidth),w:panelWidth});
  for(let i=0;i<=count;i++)parts.push({kind:'pier',x:x+i*(panelWidth+pierWidth),w:pierWidth});
  return parts;
}
export function drawFoundationSection(art,s,camera){
  const g=art.g,image=art.images.palaceFoundation;
  const left=Math.max(s.x,camera-4),right=Math.min(s.x+s.w,camera+388);
  if(left>=right)return;
  const depth=s.g?Math.max(s.h||0,216-s.y):s.bridge?12:23;
  g.save();g.beginPath();g.rect(left,s.y,right-left,depth);g.clip();
  g.fillStyle='#aeb9b0';g.fillRect(left,s.y,right-left,depth);
  if(image?.naturalWidth){
    if(s.g){
      // Panels overlap under the piers, which hide filtering seams and provide
      // a deliberate architectural termination at both ends of every terrace.
      for(const part of foundationLayout(s.x,s.w)){
        if(part.x+part.w<left||part.x>right)continue;
        const source=part.kind==='pier'?FOUNDATION_CROPS.pier:FOUNDATION_CROPS.panels[part.variant];
        const overlap=part.kind==='panel'?.65:0;
        g.drawImage(image,...source,part.x-overlap,s.y,part.w+overlap*2,108);
      }
    }else{
      // One continuous cornice per ledge/bridge. Each live bridge segment clips
      // the same full beam, so neighboring segments never restart its pattern.
      const source=FOUNDATION_CROPS.panels[0],sourceH=208;
      const x=s.bridge?s.bridge.x0:s.x,w=s.bridge?s.bridge.n*s.w:s.w;
      g.drawImage(image,source[0],0,source[2],sourceH,x,s.y,w,depth);
    }
  }
  const shade=g.createLinearGradient(0,s.y+Math.min(depth,65),0,s.y+depth);
  shade.addColorStop(0,'rgba(86,115,126,0)');shade.addColorStop(1,'rgba(86,115,126,.22)');
  g.fillStyle=shade;g.fillRect(left,s.y,right-left,depth);g.restore();
  art.line(left,s.y+.3,right,s.y+.3,'#fff5d8',1.1);
}
