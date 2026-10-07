import { CONFIG } from "../core/Config.js";

export class HUD {
  constructor(){
    this.speed=document.getElementById("speed");this.rpm=document.getElementById("rpm");this.heading=document.getElementById("heading");
    this.coords=document.getElementById("coords");this.location=document.getElementById("location");this.banner=document.getElementById("banner");
    this.map=document.getElementById("minimap");this.ctx=this.map.getContext("2d");this.lastBanner="";
  }
  bind(vehicle,world){this.vehicle=vehicle;this.world=world}
  update(){
    if(!this.vehicle)return;
    const v=this.vehicle.speedKmh;this.speed.textContent=Math.round(v);this.rpm.style.width=Math.min(100,this.vehicle.rpm/8500*100)+"%";
    const deg=(worldBearing(this.vehicle.forward)+360)%360;const dirs=["N","NE","E","SE","S","SW","W","NW"];this.heading.textContent=`${dirs[Math.round(deg/45)%8]} ${String(Math.round(deg)).padStart(3,"0")}°`;
    this.coords.textContent=this.world.geo.format(this.vehicle.group.position);
    const lm=this.world.nearestLandmark(this.vehicle.group.position);
    const name=lm?lm.name:"新竹市 / 新竹縣";
    this.location.textContent=name;
    if(lm&&this.lastBanner!==lm.name){this.lastBanner=lm.name;this.banner.textContent=`進入　${lm.name}`;this.banner.classList.add("show");clearTimeout(this.bt);this.bt=setTimeout(()=>this.banner.classList.remove("show"),2600)}
    this.drawMap();
    if(this.vehicle.input.keys.has("r"))this.vehicle.reset();
  }
  drawMap(){
    const c=this.ctx,w=this.map.width,h=this.map.height;c.clearRect(0,0,w,h);
    c.fillStyle="#182027";c.fillRect(0,0,w,h);
    const center=this.vehicle.group.position;
    const scale=.085;
    c.save();c.translate(w/2,h/2);c.rotate(-this.vehicle.yaw);
    c.strokeStyle="#56616a";c.lineWidth=3;
    for(let x=-5000;x<=5000;x+=600){c.beginPath();c.moveTo((x-center.x)*scale,-1000);c.lineTo((x-center.x)*scale,1000);c.stroke()}
    for(let z=-5000;z<=5000;z+=600){c.beginPath();c.moveTo(-1000,(z-center.z)*scale);c.lineTo(1000,(z-center.z)*scale);c.stroke()}
    c.fillStyle="#929ba4";
    for(const l of this.world.landmarks){const dx=(l.pos.x-center.x)*scale,dz=(l.pos.z-center.z)*scale;if(Math.abs(dx)<110&&Math.abs(dz)<110){c.beginPath();c.arc(dx,dz,4,0,Math.PI*2);c.fill()}}
    c.restore();
  }
}
function worldBearing(f){return Math.atan2(f.x,-f.z)*180/Math.PI}
