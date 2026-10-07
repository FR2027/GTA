import { Game } from "./core/Game.js";

const loading=document.getElementById("loading"),progress=document.getElementById("progress"),text=document.getElementById("loadingText");
const game=new Game(document.getElementById("game"));
game.init((p,msg)=>{progress.style.width=p+"%";text.textContent=msg}).then(()=>{
  setTimeout(()=>{loading.style.opacity="0";setTimeout(()=>loading.remove(),550)},350);
}).catch(err=>{console.error(err);text.textContent="Initialization failed — check browser console.";});
