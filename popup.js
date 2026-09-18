(() => {
  "use strict";
  const DEFAULTS = { enabled: true, delay: 800, duration: 1500, sound: true, volume: 0.35 };
  const ids = ["enabled", "delay", "duration", "sound", "volume"];
  const elements = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));

  function setOutput(id, value) {
    const output = document.getElementById(`${id}-output`);
    if (!output) return;
    if (id === "volume") output.textContent = `${Math.round(value * 100)}%`;
    else output.textContent = `${(value / 1000).toFixed(value % 1000 ? 1 : 0)} s`;
  }

  function save(name) {
    const element = elements[name];
    const value = element.type === "checkbox" ? element.checked : Number(element.value);
    chrome.storage.sync.set({ [name]: value });
    setOutput(name, value);
  }

  chrome.storage.sync.get(DEFAULTS, (settings) => {
    for (const [name, element] of Object.entries(elements)) {
      const value = settings[name];
      if (element.type === "checkbox") element.checked = value;
      else element.value = value;
      setOutput(name, value);
      element.addEventListener("input", () => save(name));
      element.addEventListener("change", () => save(name));
    }
  });
})();
