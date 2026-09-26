(() => {
  "use strict";

  const KEYS = Object.freeze({
    active: "jack-journey-active",
    phase: "jack-journey-phase",
    replayActive: "jack-replay-active",
    replayPhase: "jack-replay-phase"
  });

  const PHASE_FILES = Object.freeze({
    1: "phase1.html",
    2: "phase2-prototype.html"
  });

  function currentPhase() {
    const phase = Number(localStorage.getItem(KEYS.phase) || 1);
    return Number.isFinite(phase) && phase >= 1 ? phase : 1;
  }

  function isActive() {
    return localStorage.getItem(KEYS.active) === "1";
  }

  function unlockPhase(phase) {
    if (phase <= 1) return;
    localStorage.setItem("jack-phase" + phase + "-unlocked", "yes");
  }

  function isPhaseUnlocked(phase) {
    if (phase <= 1) return true;
    if (localStorage.getItem("jack-phase" + phase + "-unlocked") === "yes") return true;
    return localStorage.getItem("jack-phase" + (phase - 1) + "-complete") === "yes";
  }

  function startNew() {
    restoreReplay();
    localStorage.setItem(KEYS.active, "1");
    localStorage.setItem(KEYS.phase, "1");
    localStorage.setItem("jack-journey-started-at", String(Date.now()));
    localStorage.removeItem("jack-phase2-save");
    localStorage.removeItem("jack-journey-phase1-snapshot");
    localStorage.removeItem("jack-journey-phase2-snapshot");
  }

  function advanceTo(phase) {
    unlockPhase(phase);
    localStorage.setItem(KEYS.active, "1");
    localStorage.setItem(KEYS.phase, String(phase));
  }

  function finishJourney() {
    localStorage.setItem(KEYS.active, "0");
    localStorage.setItem("jack-journey-complete", "yes");
  }

  function continueFile() {
    return PHASE_FILES[currentPhase()] || PHASE_FILES[1];
  }

  function snapshotKey(phase) {
    return "jack-journey-phase" + phase + "-snapshot";
  }

  function beginReplay(phase, storageKeys) {
    if (isActive() && currentPhase() === phase && localStorage.getItem(KEYS.replayActive) !== "1") {
      const values = {};
      storageKeys.forEach(key => {
        values[key] = localStorage.getItem(key);
      });
      localStorage.setItem(snapshotKey(phase), JSON.stringify(values));
    }
    localStorage.setItem(KEYS.replayActive, "1");
    localStorage.setItem(KEYS.replayPhase, String(phase));
  }

  function restoreReplay() {
    if (localStorage.getItem(KEYS.replayActive) !== "1") return false;
    const phase = Number(localStorage.getItem(KEYS.replayPhase) || 0);
    const raw = localStorage.getItem(snapshotKey(phase));
    if (raw) {
      try {
        const values = JSON.parse(raw);
        Object.entries(values).forEach(([key, value]) => {
          if (value === null || value === undefined) localStorage.removeItem(key);
          else localStorage.setItem(key, String(value));
        });
      } catch (error) {
        console.warn("Não foi possível restaurar o save da Jornada.", error);
      }
    }
    localStorage.removeItem(snapshotKey(phase));
    localStorage.removeItem(KEYS.replayActive);
    localStorage.removeItem(KEYS.replayPhase);
    return true;
  }

  window.JackJourney = Object.freeze({
    currentPhase,
    isActive,
    unlockPhase,
    isPhaseUnlocked,
    startNew,
    advanceTo,
    finishJourney,
    continueFile,
    beginReplay,
    restoreReplay
  });
})();