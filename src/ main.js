const loading = document.getElementById("loading");
const progress = document.getElementById("progress");
const text = document.getElementById("loadingText");

function showError(msg) {
  if (text) text.innerHTML = `<span style="color:#ff5555;font-weight:bold;">ERROR: ${msg}</span>`;
}

window.addEventListener("error", (e) => showError(`${e.message} (${e.filename}:${e.lineno})`));
window.addEventListener("unhandledrejection", (e) => showError(`Promise Rejected: ${e.reason}`));

async function start() {
  try {
    text.textContent = "Loading Game engine...";
    const { Game } = await import("./core/Game.js");
    
    const game = new Game(document.getElementById("game"));
    
    await game.init((p, msg) => {
      if (progress) progress.style.width = p + "%";
      if (text) text.textContent = msg;
    });

    setTimeout(() => {
      if (loading) {
        loading.style.opacity = "0";
        setTimeout(() => loading.remove(), 550);
      }
    }, 350);
  } catch (err) {
    console.error(err);
    showError(err.message || err);
  }
}

start();
