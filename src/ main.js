import { Game } from "./core/Game.js";

const loading = document.getElementById("loading");
const progress = document.getElementById("progress");
const text = document.getElementById("loadingText");

// 監測未捕捉的錯誤並直接顯示在螢幕上
window.addEventListener("error", (e) => {
  if (text) text.innerHTML = `<span style="color:red">ERROR: ${e.message} (${e.filename}:${e.lineno})</span>`;
});

window.addEventListener("unhandledrejection", (e) => {
  if (text) text.innerHTML = `<span style="color:red">PROMISE ERROR: ${e.reason}</span>`;
});

const game = new Game(document.getElementById("game"));

game.init((p, msg) => {
  if (progress) progress.style.width = p + "%";
  if (text) text.textContent = msg;
}).then(() => {
  setTimeout(() => {
    if (loading) {
      loading.style.opacity = "0";
      setTimeout(() => loading.remove(), 550);
    }
  }, 350);
}).catch(err => {
  console.error(err);
  if (text) text.innerHTML = `<span style="color:red">Init Failed: ${err.message || err}</span>`;
});
