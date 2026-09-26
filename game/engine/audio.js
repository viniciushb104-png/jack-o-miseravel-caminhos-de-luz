(() => {
  "use strict";

  class GameAudio {
    constructor(options = {}) {
      this.storagePrefix = options.storagePrefix || "jack-audio";
      this.tracks = options.tracks || { theme: options.musicSrc || "" };
      this.trackLabels = options.trackLabels || {};
      this.currentTrack = options.initialTrack || Object.keys(this.tracks)[0] || "theme";
      this.baseVolume = Number(localStorage.getItem(this.storagePrefix + "-volume"));
      if (!Number.isFinite(this.baseVolume) || this.baseVolume <= 0 || this.baseVolume > 1) {
        this.baseVolume = options.volume ?? 0.58;
      }
      this.duckRatio = options.duckRatio ?? 0.30;
      this.ducked = false;
      this.started = false;
      this.fadeFrame = 0;
      this.transitionToken = 0;
      this.transitioning = false;
      this.fadeResolve = null;
      this.nowPlayingTimer = 0;

      this.music = new Audio(this.tracks[this.currentTrack] || "");
      this.music.loop = true;
      this.music.preload = "auto";
      this.music.volume = this.baseVolume;
      this.music.muted = localStorage.getItem(this.storagePrefix + "-muted") === "1";
      this.music.addEventListener("error", () => {
        console.warn("[Áudio] Trilha não encontrada:", this.music.currentSrc || this.music.src);
      });
    }

    targetVolume() {
      return this.ducked ? this.baseVolume * this.duckRatio : this.baseVolume;
    }

    async start(trackName = this.currentTrack) {
      if (trackName !== this.currentTrack) {
        return this.switchTrack(trackName, { fadeOut:0, fadeIn:500 });
      }
      if (!this.music.src) return false;
      try {
        await this.music.play();
        this.started = true;
        this.fadeTo(this.targetVolume(), 450);
        this.announceTrack();
        return true;
      } catch (error) {
        console.warn("[Áudio] A música será iniciada após uma interação do jogador.", error);
        return false;
      }
    }

    async switchTrack(trackName, options = {}) {
      const src = this.tracks[trackName];
      if (!src) {
        console.warn("[Áudio] Faixa desconhecida:", trackName);
        return false;
      }
      if (trackName === this.currentTrack && this.started && !this.music.paused) return true;

      const token = ++this.transitionToken;
      const fadeOut = options.fadeOut ?? 850;
      const fadeIn = options.fadeIn ?? 900;
      this.transitioning = true;

      if (this.started && !this.music.paused && fadeOut > 0) {
        await this.fadeTo(0, fadeOut, true);
      } else {
        this.music.pause();
      }
      if (token !== this.transitionToken) {
        this.transitioning = false;
        return false;
      }

      this.currentTrack = trackName;
      this.music.src = src;
      this.music.load();
      try { this.music.currentTime = 0; } catch (_) {}
      this.music.volume = 0;

      try {
        await this.music.play();
        if (token !== this.transitionToken) {
          this.transitioning = false;
          return false;
        }
        this.started = true;
        this.announceTrack();
        this.transitioning = false;
        this.fadeTo(this.targetVolume(), fadeIn);
        return true;
      } catch (error) {
        this.transitioning = false;
        console.warn("[Áudio] Não foi possível iniciar a faixa:", trackName, error);
        return false;
      }
    }

    pause() { this.music.pause(); }

    resume() {
      if (this.started && this.music.paused) this.start(this.currentTrack);
    }

    setMuted(value) {
      this.music.muted = !!value;
      localStorage.setItem(this.storagePrefix + "-muted", this.music.muted ? "1" : "0");
      this.updateButton();
    }

    toggleMute() {
      this.setMuted(!this.music.muted);
      if (!this.music.muted && !this.started) this.start(this.currentTrack);
      return this.music.muted;
    }

    setDucked(value) {
      this.ducked = !!value;
      if (!this.transitioning) {
        this.fadeTo(this.targetVolume(), this.ducked ? 220 : 520);
      }
    }

    fadeTo(target, duration = 400, pauseAfter = false) {
      cancelAnimationFrame(this.fadeFrame);
      if (this.fadeResolve) {
        this.fadeResolve(false);
        this.fadeResolve = null;
      }
      const start = this.music.volume;
      const end = Math.max(0, Math.min(1, target));
      if (duration <= 0) {
        this.music.volume = end;
        if (pauseAfter) this.music.pause();
        return Promise.resolve();
      }
      const startedAt = performance.now();
      return new Promise(resolve => {
        this.fadeResolve = resolve;
        const tick = now => {
          const p = Math.min(1, (now - startedAt) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          this.music.volume = start + (end - start) * eased;
          if (p < 1) this.fadeFrame = requestAnimationFrame(tick);
          else {
            if (pauseAfter) this.music.pause();
            this.fadeResolve = null;
            resolve(true);
          }
        };
        this.fadeFrame = requestAnimationFrame(tick);
      });
    }

    fadeOut(duration = 1200) {
      ++this.transitionToken;
      this.transitioning = false;
      return this.fadeTo(0, duration, true);
    }

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

    bindNowPlaying(root) {
      this.nowPlaying = root;
      if (root) this.announceTrack(false);
    }

    announceTrack(show = true) {
      if (!this.nowPlaying) return;
      const title = this.nowPlaying.querySelector("strong");
      if (title) title.textContent = this.trackLabels[this.currentTrack] || this.currentTrack;
      this.nowPlaying.dataset.track = this.currentTrack;
      if (!show) return;
      clearTimeout(this.nowPlayingTimer);
      this.nowPlaying.classList.remove("show");
      void this.nowPlaying.offsetWidth;
      this.nowPlaying.classList.add("show");
      this.nowPlayingTimer = setTimeout(() => this.nowPlaying.classList.remove("show"), 3200);
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