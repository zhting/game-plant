export const MINECART=Object.freeze({rimHeight:22,speed:100,mountWidth:16,waist:1,muzzleHeight:4,upMuzzleHeight:19,leaveCooldown:.3});

export function isMinecartRider(player){
  return !!player.cart&&!player.cart.dead&&!player.dead&&!player.ride&&!(player.giantT>0);
}

export function syncMinecartRider(player){
  const cart=player.cart;if(!cart)return;
  player.x=cart.x+(player.cartSeat||0);player.y=cart.y-MINECART.rimHeight;
  player.vx=cart.vx;player.vy=0;player.onGround=true;player.spin=player.prone=player.inWater=player.dive=false;player.support=null;player.anim=0;
}

export function leaveMinecart(player,jumpSpeed=0){
  if(!player.cart)return false;
  player.cart=null;player.cartSeat=0;player.cartDuck=false;player.cartCooldown=MINECART.leaveCooldown;player.onGround=false;player.support=null;
  if(jumpSpeed>0){player.vy=-jumpSpeed;player.airJumps=1;player.coyote=0;player.spin=true;}
  return true;
}

export function boardMinecart(player,carts,previousFoot){
  if(player.cart||player.dead||player.ride||player.giantT>0||player.cartCooldown>0||player.vy<0)return false;
  const cart=carts.find(c=>c.t==='cart'&&!c.dead&&Math.abs(player.x-c.x)<MINECART.mountWidth&&previousFoot<=c.y-MINECART.rimHeight+3&&player.y>=c.y-MINECART.rimHeight-3);
  if(!cart)return false;
  player.cart=cart;player.cartSeat=0;player.cartDuck=false;player.ax=player.face||1;player.ay=0;player.airJumps=1;
  // Boarding a moving vehicle keeps its motion, including when a second
  // passenger joins. A parked cart starts its forward route on boarding.
  const speed=cart.driveVX??cart.vx;cart.driveVX=Math.abs(speed)>.01?speed:MINECART.speed;
  cart.vx=cart.driveVX;syncMinecartRider(player);return true;
}

export function minecartMuzzle(player){
  const face=player.face||1,ax=player.ax??face,ay=player.ay||0;
  if(player.cartDuck)return {x:player.x+face*15,y:player.y-MINECART.muzzleHeight};
  if(ay<-.9&&!player.cartDuck)return {x:player.x+face*2,y:player.y-MINECART.upMuzzleHeight};
  return {x:player.x+ax*13,y:player.y-MINECART.muzzleHeight+ay*11};
}

export function minecartRiderBox(player){
  return {x:player.x-(player.cartDuck?10:6),y:player.y-(player.cartDuck?8:14),w:player.cartDuck?20:12,h:player.cartDuck?8:14};
}

/** A passenger cannot stand up or jump out through a low roof. */
export function minecartCanRise(player,solids){
  const b=minecartRiderBox({...player,cartDuck:false});
  return !solids.some(s=>s.ceiling&&!s.gone&&b.x<s.x+s.w&&b.x+b.w>s.x&&b.y<s.y+s.h&&b.y+b.h>s.y);
}

/** A low overhang checks the people in the hopper as well as the chassis. */
export function collideMinecartClearance(cart,oldX,riders,solids){
  let blocked=false;
  for(const p of riders)for(const s of solids){
    if(!s.ceiling||s.gone)continue;
    const b=minecartRiderBox({...p,x:cart.x+(p.cartSeat||0),y:cart.y-MINECART.rimHeight});
    if(b.y>=s.y+s.h||b.y+b.h<=s.y||b.x+b.w<=s.x||b.x>=s.x+s.w)continue;
    if(cart.x>=oldX)cart.x=s.x-(b.x+b.w-cart.x);
    else cart.x=s.x+s.w-(b.x-cart.x);
    blocked=true;
  }
  return blocked;
}
