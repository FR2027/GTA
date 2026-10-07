export class EngineAudio {
  constructor(){this.ctx=null;this.osc=null;this.gain=null}
  bind(vehicle){
    this.vehicle=vehicle;
    const start=()=>this.ensure();
    addEventListener("pointerdown",start,{once:true});addEventListener("keydown",start,{once:true});
  }
  ensure(){
    if(this.ctx)return;
    this.ctx=new (window.AudioContext||window.webkitAudioContext)();
    this.osc=this.ctx.createOscillator();this.gain=this.ctx.createGain();this.osc.type="sawtooth";this.gain.gain.value=.018;
    this.osc.connect(this.gain).connect(this.ctx.destination);this.osc.start();
  }
  update(){
    if(!this.ctx||!this.vehicle)return;
    const rpm=this.vehicle.rpm;this.osc.frequency.setTargetAtTime(45+rpm/8500*150,this.ctx.currentTime,.04);
    this.gain.gain.setTargetAtTime(.008+Math.min(.035,this.vehicle.speedKmh/1500),this.ctx.currentTime,.08);
  }
}
