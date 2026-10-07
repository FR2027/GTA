import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.181.1/build/three.module.js";
import { GeoSystem } from "../core/GeoSystem.js";
import { CONFIG } from "../core/Config.js";

export class World {
  constructor(scene){this.scene=scene;this.geo=new GeoSystem();this.landmarks=[];this.time=10}
  async init(setProgress){
    this.setupLights();
    setProgress(25,"Generating terrain...");
    this.makeGround();
    this.makeRoads();
    setProgress(45,"Building Hsinchu landmarks...");
    this.makeLandmarks();
    this.makeStreetProps();
    setProgress(65,"World streaming ready...");
  }
  setupLights(){
    this.sun=new THREE.DirectionalLight(0xffffff,2.2);this.sun.position.set(500,900,300);this.sun.castShadow=true;
    this.sun.shadow.mapSize.set(2048,2048);this.sun.shadow.camera.left=-1600;this.sun.shadow.camera.right=1600;this.sun.shadow.camera.top=1600;this.sun.shadow.camera.bottom=-1600;
    this.scene.add(this.sun);this.scene.add(new THREE.HemisphereLight(0xbddcff,0x334455,1.1));
  }
  makeGround(){
    const g=new THREE.PlaneGeometry(9000,9000,32,32);g.rotateX(-Math.PI/2);
    const m=new THREE.MeshStandardMaterial({color:0x4d694e,roughness:1});
    const ground=new THREE.Mesh(g,m);ground.receiveShadow=true;this.scene.add(ground);
  }
  road(x,z,w,h){
    const m=new THREE.MeshStandardMaterial({color:0x202328,roughness:.92});
    const r=new THREE.Mesh(new THREE.BoxGeometry(w,.035,h),m);r.position.set(x,.02,z);r.receiveShadow=true;this.scene.add(r);
    return r;
  }
  makeRoads(){
    const size=4300, step=600;
    for(let x=-size;x<=size;x+=step)this.road(x,0,CONFIG.world.roadWidth,size*2);
    for(let z=-size;z<=size;z+=step)this.road(0,z,size*2,CONFIG.world.roadWidth);
    // Major diagonal connectors.
    const mat=new THREE.MeshStandardMaterial({color:0x202328});
    for(const s of [-1,1]){
      const r=new THREE.Mesh(new THREE.BoxGeometry(25,.035,12200),mat);r.rotation.y=s*.19;r.receiveShadow=true;this.scene.add(r);
    }
  }
  building(x,z,w,d,h,color=0x6d747c){
    const mat=new THREE.MeshStandardMaterial({color,roughness:.78,metalness:.08});
    const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);b.position.set(x,h/2,z);b.castShadow=true;b.receiveShadow=true;this.scene.add(b);
    for(let y=2;y<h;y+=3.3){
      for(let xx=-w/2+1.2;xx<w/2-1;xx+=2.5){
        const win=new THREE.Mesh(new THREE.BoxGeometry(.9,.8,.035),new THREE.MeshBasicMaterial({color:0x92b8c8}));
        win.position.set(x+xx,y,z-d/2-.02);this.scene.add(win);
      }
    }
    return b;
  }
  landmark(name,lat,lon,opts={}){
    const p=this.geo.wgs84ToENU(lat,lon,opts.height||0);
    const g=new THREE.Group();g.position.copy(p);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(opts.r||22,opts.r||28,1.2,32),new THREE.MeshStandardMaterial({color:opts.color||0x8b8f94,metalness:.2}));
    base.position.y=.6;g.add(base);
    const tower=new THREE.Mesh(new THREE.BoxGeometry(opts.w||28,opts.h||16,opts.d||22),new THREE.MeshStandardMaterial({color:opts.body||0x777d85,roughness:.7}));
    tower.position.y=(opts.h||16)/2+1;g.add(tower);
    const label=new THREE.Sprite(new THREE.SpriteMaterial({map:this.textTexture(name),transparent:true,depthTest:false}));
    label.scale.set(28,7,1);label.position.y=(opts.h||16)+9;g.add(label);
    this.scene.add(g);this.landmarks.push({name,pos:p,radius:opts.radius||120});
  }
  textTexture(text){
    const c=document.createElement("canvas");c.width=512;c.height=128;const x=c.getContext("2d");
    x.fillStyle="rgba(5,8,12,.82)";x.roundRect(4,8,504,112,24);x.fill();
    x.fillStyle="#fff";x.font="bold 44px sans-serif";x.textAlign="center";x.textBaseline="middle";x.fillText(text,256,64);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
  }
  makeLandmarks(){
    const a=CONFIG.anchor;
    this.landmark("東門城",24.80395,120.97150,{h:18,w:34,d:34,radius:150,color:0xb79b68,body:0x9a8157});
    this.landmark("新竹火車站",24.80153,120.97197,{h:12,w:55,d:25,radius:170,color:0x777b80,body:0x8d9095});
    this.landmark("巨城購物中心",24.80985,120.97555,{h:45,w:70,d:55,radius:190,color:0x454a52,body:0x616975});
    this.landmark("新竹科學園區",24.77500,121.01500,{h:22,w:70,d:70,radius:300,color:0x465b55,body:0x647a72});
    this.landmark("竹北高鐵站",24.80680,121.04030,{h:25,w:60,d:48,radius:220,color:0x6e747b,body:0x92989d});
    this.landmark("竹北市區",24.83300,121.00800,{h:35,w:75,d:65,radius:260,color:0x515862,body:0x707780});
  }
  makeStreetProps(){
    const rng=(n)=>{let x=Math.sin(n*999)*43758.5453;return x-Math.floor(x)}
    for(let i=0;i<260;i++){
      const x=(rng(i)-.5)*7600,z=(rng(i+100)-.5)*7600;
      if(Math.abs(x%600)<70||Math.abs(z%600)<70)continue;
      const h=8+rng(i+4)*45,w=12+rng(i+7)*35,d=12+rng(i+8)*35;
      this.building(x,z,w,d,h,0x555b62+Math.floor(rng(i+9)*18)*0x010101);
    }
  }
  addVehicle(v){this.vehicle=v}
  update(dt,vehicle){
    this.time+=dt*.15;
    // Day/night visual cycle.
    const phase=(this.time%240)/240;
    const daylight=.35+.65*Math.max(0,Math.sin(phase*Math.PI*2));
    this.sun.intensity=.5+1.8*daylight;
    this.scene.background.lerpColors(new THREE.Color(0x08101d),new THREE.Color(0x8bb3cf),daylight);
    this.scene.fog.color.copy(this.scene.background);
  }
  nearestLandmark(pos){
    let best=null,dist=Infinity;
    for(const l of this.landmarks){const d=pos.distanceTo(l.pos);if(d<dist){dist=d;best=l}}
    return best&&dist<best.radius?best:null;
  }
}
