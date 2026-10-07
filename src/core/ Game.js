import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.181.1/build/three.module.js";
import { World } from "../world/World.js";
import { Vehicle } from "../vehicle/Vehicle.js";
import { Input } from "../input/Input.js";
import { HUD } from "../ui/HUD.js";
import { EngineAudio } from "../audio/EngineAudio.js";
import { CONFIG } from "./Config.js";

export class Game {
  constructor(canvas) {
    this.canvas=canvas;
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
    this.renderer.setSize(innerWidth,innerHeight,false);
    this.renderer.shadowMap.enabled=true;
    this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.scene=new THREE.Scene();
    this.scene.background=new THREE.Color(0x8bb3cf);
    this.scene.fog=new THREE.Fog(0x8bb3cf,700,5200);
    this.camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,9000);
    this.camera.position.set(0,7,12);
    this.input=new Input();
    this.hud=new HUD();
    this.audio=new EngineAudio();
    this.world=new World(this.scene);
    this.vehicle=new Vehicle(this.scene,this.input,CONFIG.vehicle);
    this.world.addVehicle(this.vehicle);
    this.last=performance.now();
    this.running=true;
    addEventListener("resize",()=>this.resize());
  }
  async init(setProgress) {
    setProgress(15,"Creating Hsinchu world...");
    await this.world.init(setProgress);
    setProgress(72,"Spawning vehicle...");
    await this.vehicle.init();
    setProgress(90,"Starting systems...");
    this.audio.bind(this.vehicle);
    this.hud.bind(this.vehicle,this.world);
    this.resize();
    setProgress(100,"Ready");
    requestAnimationFrame(t=>this.loop(t));
  }
  resize(){
    this.camera.aspect=innerWidth/innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth,innerHeight,false);
  }
  loop(now){
    if(!this.running)return;
    const dt=Math.min((now-this.last)/1000,.033); this.last=now;
    this.vehicle.update(dt);
    this.world.update(dt,this.vehicle);
    this.hud.update(dt);
    this.audio.update();
    this.camera.position.lerp(this.vehicle.cameraPosition,1-Math.exp(-CONFIG.camera.smoothing*dt));
    this.camera.lookAt(this.vehicle.cameraLook);
    this.renderer.render(this.scene,this.camera);
    requestAnimationFrame(t=>this.loop(t));
  }
}
