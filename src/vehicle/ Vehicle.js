import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.181.1/build/three.module.js";

export class Vehicle {
  constructor(scene,input,cfg){
    this.scene=scene;this.input=input;this.cfg=cfg;this.group=new THREE.Group();scene.add(this.group);
    this.velocity=new THREE.Vector3();this.yaw=0;this.speed=0;this.steer=0;this.wheelSpin=0;
    this.cameraPosition=new THREE.Vector3();this.cameraLook=new THREE.Vector3();
    this.spawn=new THREE.Vector3(0,.65,0);
  }
  async init(){
    const bodyMat=new THREE.MeshStandardMaterial({color:0x15202c,metalness:.75,roughness:.22});
    const glass=new THREE.MeshStandardMaterial({color:0x0a1720,metalness:.35,roughness:.1});
    const body=new THREE.Mesh(new THREE.BoxGeometry(2.05,.55,4.35),bodyMat);body.position.y=.85;body.castShadow=true;this.group.add(body);
    const roof=new THREE.Mesh(new THREE.BoxGeometry(1.7,.48,2.1),glass);roof.position.set(0,1.27,-.05);roof.castShadow=true;this.group.add(roof);
    const bumper=new THREE.Mesh(new THREE.BoxGeometry(2.08,.25,.25),new THREE.MeshStandardMaterial({color:0x08090b,metalness:.5}));bumper.position.set(0,.63,2.16);this.group.add(bumper);
    const wheelGeo=new THREE.CylinderGeometry(.38,.38,.22,20);
    this.wheels=[];
    for(const x of [-.98,.98]) for(const z of [-1.45,1.45]){
      const w=new THREE.Mesh(wheelGeo,new THREE.MeshStandardMaterial({color:0x090909,roughness:.9}));
      w.rotation.z=Math.PI/2;w.position.set(x,.48,z);w.castShadow=true;this.group.add(w);this.wheels.push({mesh:w,x,z});
    }
    this.group.position.copy(this.spawn);
    this.group.traverse(o=>{if(o.isMesh)o.castShadow=true});
    this.makeLights();
    this.updateCamera();
  }
  makeLights(){
    const mat=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:3});
    for(const x of [-.68,.68]){
      const l=new THREE.Mesh(new THREE.BoxGeometry(.38,.12,.08),mat);l.position.set(x,.83,-2.19);this.group.add(l);
    }
  }
  update(dt){
    this.input.update();
    const forward=new THREE.Vector3(Math.sin(this.yaw),0,Math.cos(this.yaw)).negate();
    const right=new THREE.Vector3(forward.z,0,-forward.x);
    const localSpeed=this.velocity.dot(forward);
    const targetSteer=this.input.steering*.48;
    this.steer=THREE.MathUtils.lerp(this.steer,targetSteer,1-Math.exp(-7*dt));
    const accel=this.input.throttle*16-this.input.brake*22;
    this.velocity.addScaledVector(forward,accel*dt);
    if(this.input.handbrake)this.velocity.multiplyScalar(Math.max(0,1-4.2*dt));
    const lateral=this.velocity.dot(right);
    this.velocity.addScaledVector(right,-lateral*Math.min(1,7*dt));
    this.velocity.multiplyScalar(1-Math.min(.98,this.cfg.drag*dt));
    const max=this.cfg.maxSpeed;
    if(this.velocity.length()>max)this.velocity.setLength(max);
    const steerStrength=localSpeed/(1+Math.abs(localSpeed)*.035);
    this.yaw += this.steer*steerStrength*1.55*dt;
    this.group.position.addScaledVector(this.velocity,dt);
    this.group.position.y=.65;
    // Soft world boundary.
    const lim=4300;
    if(Math.abs(this.group.position.x)>lim)this.velocity.x*=-.35;
    if(Math.abs(this.group.position.z)>lim)this.velocity.z*=-.35;
    this.group.rotation.y=this.yaw;
    const wheelRot=localSpeed*dt/.38;
    for(const w of this.wheels){w.mesh.rotation.x+=wheelRot;if(w.z<0)w.mesh.rotation.y=this.steer}
    this.updateCamera();
  }
  updateCamera(){
    const back=new THREE.Vector3(Math.sin(this.yaw),0,Math.cos(this.yaw));
    this.cameraPosition.copy(this.group.position).addScaledVector(back,8.5);this.cameraPosition.y+=4;
    this.cameraLook.copy(this.group.position);this.cameraLook.y+=1;
  }
  reset(){this.group.position.copy(this.spawn);this.velocity.set(0,0,0);this.yaw=0}
  get speedKmh(){return this.velocity.length()*3.6}
  get rpm(){return Math.min(8500,900+this.speedKmh*105)}
  get forward(){return new THREE.Vector3(Math.sin(this.yaw),0,Math.cos(this.yaw)).negate()}
}
