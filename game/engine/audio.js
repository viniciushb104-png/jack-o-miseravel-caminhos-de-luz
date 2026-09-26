(() => {
  "use strict";

  class GameAudio {
    constructor(options = {}) {
      this.storagePrefix = options.storagePrefix || "jack-audio";
      this.baseVolume = Number(localStorage.getItem(this.storagePrefix + "-volume"));
      if (!Number.isFinite(this.baseVolume) || this.baseVolume <= 0 || this.baseVolume > 1) {
        this.baseVolume = options.volume ?? 0.58;
      }
      this.duckRatio = options.duckRatio ?? 0.30;
      this.ducked = false;
      this.started = false;
      this.fadeFrame = 0;
      this.music = new Audio(options.musicSrc || "");
      this.music.loop = true;
      this.music.preload = "auto";
      this.music.volume = this.baseVolume;
      this.music.muted = localStorage.getItem(this.storagePrefix + "-muted") === "1";
      this.music.addEventListener("error", () => {
        console.warn("[Áudio] Trilha ainda não encontrada em:", this.music.src);
      });
    }

    async start() {
      if (!this.music.src) return false;
      try {
        await this.music.play();
        this.started = true;
        this.fadeTo(this.ducked ? this.baseVolume * this.duckRatio : this.baseVolume, 450);
        return true;
      } catch (error) {
        console.warn("[Áudio] A música será iniciada após uma interação do jogador.", error);
        return false;
      }
    }

    pause() { this.music.pause(); }

    resume() {
      if (this.started && this.music.paused) this.start();
    }

    setMuted(value) {
      this.music.muted = !!value;
      localStorage.setItem(this.storagePrefix + "-muted", this.music.muted ? "1" : "0");
      this.updateButton();
    }

    toggleMute() {
      this.setMuted(!this.music.muted);
      if (!this.music.muted && !this.started) this.start();
      return this.music.muted;
    }

    setDucked(value) {
      this.ducked = !!value;
      const target = this.ducked ? this.baseVolume * this.duckRatio : this.baseVolume;
      this.fadeTo(target, this.ducked ? 220 : 520);
    }

    fadeTo(target, duration = 400, pauseAfter = false) {
      cancelAnimationFrame(this.fadeFrame);
      const start = this.music.volume;
      const end = Math.max(0, Math.min(1, target));
      const startedAt = performance.now();
      const tick = now => {
        const p = Math.min(1, (now - startedAt) / Math.max(1, duration));
        const eased = 1 - Math.pow(1 - p, 3);
        this.music.volume = start + (end - start) * eased;
        if (p < 1) this.fadeFrame = requestAnimationFrame(tick);
        else if (pauseAfter) this.music.pause();
      };
      this.fadeFrame = requestAnimationFrame(tick);
    }

    fadeOut(duration = 1200) { this.fadeTo(0, duration, true); }

    bindToggle(button) {
      this.button = button;
      if (!button) return;
      this.updateButton();
      button.addEventListener("click", event => {
        event.preventDefault();
        this.toggleMute();
      });
    }

    bindDialogue(root) {
      if (!root) return;
      const sync = () => this.setDucked(root.classList.contains("is-open") && !root.hidden);
      new MutationObserver(sync).observe(root, { attributes:true, attributeFilter:["class","hidden"] });
      sync();
    }

    updateButton() {
      if (!this.button) return;
      const muted = this.music.muted;
      this.button.setAttribute("aria-pressed", muted ? "true" : "false");
      this.button.setAttribute("aria-label", muted ? "Ativar música" : "Silenciar música");
      this.button.title = muted ? "Ativar música" : "Silenciar música";
      const icon = this.button.querySelector("b");
      const label = this.button.querySelector("span");
      if (icon) icon.textContent = muted ? "♩" : "♫";
      if (label) label.textContent = muted ? "MÚSICA OFF" : "MÚSICA";
    }
  }

  window.GameAudio = GameAudio;
})();