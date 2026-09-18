(() => {
  "use strict";

  const DEFAULTS = {
    enabled: true,
    delay: 800,
    duration: 1500,
    sound: true,
    volume: 0.35
  };
  const ROOT_ID = "shorts-scream-root";
  let currentIsShort = false;
  let scareTimer = null;
  let dismissTimer = null;
  let audioContext = null;

  function getSettings() {
    return new Promise((resolve) => chrome.storage.sync.get(DEFAULTS, resolve));
  }

  function isShortsPage() {
    return /^(www\.)?youtube\.com$/.test(location.hostname);
  }

  function clearPendingScare() {
    clearTimeout(scareTimer);
    scareTimer = null;
  }

  function removeScare() {
    clearTimeout(dismissTimer);
    dismissTimer = null;
    document.getElementById(ROOT_ID)?.remove();
  }

  function playScream(volume) {
    try {
      audioContext ??= new AudioContext();
      const now = audioContext.currentTime;
      const gain = audioContext.createGain();
      const oscillator = audioContext.createOscillator();
      const hiss = audioContext.createBufferSource();
      const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.33, audioContext.sampleRate);
      const data = noiseBuffer.getChannelData(0);

      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(170, now);
      oscillator.frequency.exponentialRampToValueAtTime(1050, now + 0.22);
      hiss.buffer = noiseBuffer;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.01, volume), now + 0.035);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
      oscillator.connect(gain).connect(audioContext.destination);
      hiss.connect(gain);
      oscillator.start(now);
      hiss.start(now);
      oscillator.stop(now + 0.4);
      hiss.stop(now + 0.34);
    } catch {
      // Browsers may block audio until the user has interacted with the page.
    }
  }

  function createScare(settings) {
    removeScare();
    const root = document.createElement("div");
    root.id = ROOT_ID;
    root.innerHTML = `
      <div class="shorts-scream-backdrop" role="dialog" aria-label="Jump scare">
        <div class="shorts-scream-card" aria-hidden="true">
          <div class="shorts-scream-face">
            <div class="shorts-scream-hair"></div>
            <div class="shorts-scream-eye shorts-scream-eye--left"></div>
            <div class="shorts-scream-eye shorts-scream-eye--right"></div>
            <div class="shorts-scream-mouth"></div>
          </div>
        </div>
        <div class="shorts-scream-glitch"></div>
        <button class="shorts-scream-dismiss" type="button">Dismiss · Esc</button>
      </div>`;

    root.querySelector("button").addEventListener("click", removeScare);
    document.documentElement.append(root);
    if (settings.sound) playScream(settings.volume);
    dismissTimer = setTimeout(removeScare, settings.duration);
  }

  async function checkRoute() {
    const nowShort = isShortsPage();
    if (nowShort === currentIsShort) return;
    currentIsShort = nowShort;
    clearPendingScare();
    removeScare();
    if (!nowShort) return;

    const settings = await getSettings();
    if (!settings.enabled || !isShortsPage()) return;
    scareTimer = setTimeout(() => {
      if (isShortsPage()) createScare(settings);
    }, settings.delay);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") removeScare();
  }, true);

  window.addEventListener("yt-navigate-finish", checkRoute);
  window.addEventListener("popstate", checkRoute);
  setInterval(checkRoute, 700);
  checkRoute();
})();
