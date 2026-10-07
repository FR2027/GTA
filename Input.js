export class Input {
  constructor(){
    this.keys=new Set(); this.steering=0; this.throttle=0; this.brake=0; this.handbrake=false;
    addEventListener("keydown",e=>{this.keys.add(e.key.toLowerCase()); if([" ","arrowup","arrowdown","arrowleft","arrowright"].includes(e.key.toLowerCase()))e.preventDefault()});
    addEventListener("keyup",e=>this.keys.delete(e.key.toLowerCase()));
    document.querySelectorAll("[data-key]").forEach(b=>{
      const k=b.dataset.key;
      const down=e=>{e.preventDefault();this.keys.add(k)};
      const up=e=>{e.preventDefault();this.keys.delete(k)};
      b.addEventListener("pointerdown",down); b.addEventListener("pointerup",up); b.addEventListener("pointercancel",up); b.addEventListener("pointerleave",up);
    });
  }
  update(){
    const k=this.keys;
    this.throttle=(k.has("w")||k.has("arrowup"))?1:0;
    this.brake=(k.has("s")||k.has("arrowdown"))?1:0;
    this.steering=((k.has("d")||k.has("arrowright"))?1:0)-((k.has("a")||k.has("arrowleft"))?1:0);
    this.handbrake=k.has(" ");
  }
}
