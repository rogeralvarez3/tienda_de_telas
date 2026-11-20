let ctx;

// Pitido corto para avisar a caja de un pedido nuevo
export function pitar() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const ganancia = ctx.createGain();
    osc.connect(ganancia);
    ganancia.connect(ctx.destination);
    osc.frequency.value = 880;
    ganancia.gain.value = 0.15;
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // El navegador puede bloquear el audio hasta que haya una interacción; se ignora
  }
}
