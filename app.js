const launch = document.getElementById('launch');
const reset = document.getElementById('reset');
const lineFill = document.getElementById('lineFill');
const rig = document.getElementById('rig');
const percentage = document.getElementById('percentage');
const state = document.getElementById('state');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
let running = false;

function setProgress(p) {
  const clamped = Math.max(0, Math.min(1, p));
  lineFill.style.strokeDashoffset = String(1 - clamped);
  // The parachute follows the same progress value as the drawn rail.
  const rail = document.querySelector('.delivery');
  const width = rail.clientWidth;
  rig.style.left = `${(width * clamped)}px`;
  percentage.textContent = `${Math.round(clamped * 100)}%`;
}

async function downloadDemo() {
  if (running) return;
  running = true;
  document.body.classList.remove('is-done');
  document.body.classList.add('is-running');
  reset.hidden = true;
  state.textContent = 'Preparing the payload…';
  percentage.textContent = '0%';
  lineFill.style.strokeDashoffset = '1';
  rig.style.left = '0px';

  // Create a local demo payload and read it as a stream.
  // Progress is based on actual bytes read from this stream.
  const content = [
    'Parachute Download Demo\n',
    'This file was delivered by the animated download control.\n',
    'The progress indicator is driven by bytes read from a local Blob stream.\n',
    'Have a great day!\n'
  ].join('').repeat(220);
  const blob = new Blob([content], {type:'text/plain'});
  const total = blob.size;
  const reader = blob.stream().getReader();
  let loaded = 0;
  const started = performance.now();
  const minMs = 2400;
  const chunks = [];

  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.length;
      const actual = loaded / total;
      const elapsed = performance.now() - started;
      const shown = Math.min(actual, elapsed / minMs);
      setProgress(shown);
      state.textContent = `Delivering payload · ${loaded.toLocaleString()} / ${total.toLocaleString()} bytes`;
      await wait(35);
    }

    const remaining = Math.max(0, minMs - (performance.now() - started));
    await wait(remaining);
    setProgress(1);

    const file = new Blob(chunks, {type:'text/plain'});
    const url = URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'parachute-delivery.txt';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    await wait(260);
    document.body.classList.remove('is-running');
    document.body.classList.add('is-done');
    percentage.textContent = '100%';
    state.textContent = 'Complete — your payload has landed.';
    reset.hidden = false;
  } catch (error) {
    state.textContent = 'Download failed. Please try again.';
    document.body.classList.remove('is-running');
    reset.hidden = false;
  } finally {
    running = false;
  }
}

launch.addEventListener('click', downloadDemo);
reset.addEventListener('click', () => {
  document.body.classList.remove('is-running','is-done');
  setProgress(0);
  percentage.textContent = 'READY TO DOWNLOAD';
  state.textContent = 'Press the button to send the payload.';
  reset.hidden = true;
});
window.addEventListener('resize', () => {
  if (!running) rig.style.left = '0px';
});
