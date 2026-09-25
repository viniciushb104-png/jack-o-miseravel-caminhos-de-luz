(() => {
  class DialogueSystem {
    constructor(root) {
      this.root = root;
      this.nameEl = root.querySelector("[data-dialogue-name]");
      this.textEl = root.querySelector("[data-dialogue-text]");
      this.portraitEl = root.querySelector("[data-dialogue-portrait]");
      this.nextButton = root.querySelector("[data-dialogue-next]");
      this.frameArt = root.querySelector("[data-dialogue-frame]");
      this.lines = [];
      this.index = 0;
      this.typing = false;
      this.timer = null;
      this.onComplete = null;
      this.assets = {};
      this.currentText = "";
      this.boundKey = (event) => {
        if (this.root.hidden) return;
        if (["Enter", " ", "e", "E"].includes(event.key)) {
          event.preventDefault();
          this.advance();
        }
      };
      document.addEventListener("keydown", this.boundKey);
      this.nextButton?.addEventListener("click", () => this.advance());
    }

    setAssets(assets) {
      this.assets = assets || {};
      if (this.frameArt && assets.frame) this.frameArt.src = assets.frame.src;
    }

    open(lines, onComplete) {
      if (!Array.isArray(lines) || !lines.length) return;
      this.lines = lines;
      this.index = 0;
      this.onComplete = onComplete || null;
      this.root.hidden = false;
      this.root.classList.add("is-open");
      this.renderLine();
    }

    close() {
      clearInterval(this.timer);
      this.typing = false;
      this.root.classList.remove("is-open");
      this.root.hidden = true;
      const callback = this.onComplete;
      this.onComplete = null;
      if (callback) callback();
    }

    advance() {
      if (this.root.hidden) return;
      if (this.typing) {
        clearInterval(this.timer);
        this.typing = false;
        this.textEl.textContent = this.currentText;
        return;
      }
      this.index += 1;
      if (this.index >= this.lines.length) return this.close();
      this.renderLine();
    }

    renderLine() {
      const line = this.lines[this.index];
      this.nameEl.textContent = line.speaker || "";
      this.setPortrait(line.portrait, line.expression || 0);
      this.typeText(line.text || "");
    }

    setPortrait(character, expression) {
      if (!this.portraitEl) return;
      if (!character || !this.assets[character]) {
        this.portraitEl.style.backgroundImage = "none";
        this.portraitEl.classList.add("is-hidden");
        return;
      }
      this.portraitEl.classList.remove("is-hidden");
      const image = this.assets[character];
      const col = expression % 3;
      const row = Math.floor(expression / 3);
      this.portraitEl.style.backgroundImage = `url("${image.src}")`;
      this.portraitEl.style.backgroundSize = "300% 200%";
      this.portraitEl.style.backgroundPosition = `${col * 50}% ${row * 100}%`;
    }

    typeText(text) {
      clearInterval(this.timer);
      this.currentText = text;
      this.textEl.textContent = "";
      this.typing = true;
      let i = 0;
      this.timer = setInterval(() => {
        i += 1;
        this.textEl.textContent = text.slice(0, i);
        if (i >= text.length) {
          clearInterval(this.timer);
          this.typing = false;
        }
      }, 24);
    }

    get active() {
      return !this.root.hidden;
    }
  }

  window.DialogueSystem = DialogueSystem;
})();