

export class AnimationUIControls {
  constructor() {
    this.initializeButtons();
    this.initializeEventListeners();
    this.isLeftMinimized = false;
    this.isRightMinimized = false;

    this.AnimationUIControls = document.getElementById("animation-selector-overlay");
  }

  initializeButtons() {

    // General controls
    this.leftButtonPanel = document.getElementById("left-button-panel");
    this.resetDefaultsButton = document.getElementById("resetDefaultsButton");
    this.collapseAllButton = document.getElementById("collapseAllButton");
    this.uiPanel = document.getElementById("ui-panel");
    this.textureModel = document.getElementById("textureToggle");
  }

  initializeEventListeners() {
   
    this.leftButtonPanel.addEventListener("click", () => 
      this.toggleLeftPanel());
 
    this.resetDefaultsButton.addEventListener("click", () =>
      this.resetToDefaults());

    this.collapseAllButton.addEventListener("click", () =>
      this.collapseAllSections());

    document.querySelectorAll(".section-header").forEach((header) => {
      header.addEventListener("click", () => {
        const content = header.nextElementSibling;
        const toggle = header.querySelector(".section-toggle");
        content.classList.toggle("collapsed");
        toggle.classList.toggle("collapsed");
      });
    });
  }

  toggleLeftPanel() {
    if (this.uiPanel && this.leftButtonPanel) {
      this.isLeftMinimized = !this.isLeftMinimized;
      this.uiPanel.classList.toggle("minimized");
      this.leftButtonPanel.classList.toggle("floating");
      this.leftButtonPanel.textContent = this.isLeftMinimized ? "▶" : "◀";
    }
  }

  resetToDefaults() {
    document.querySelectorAll('input[type="range"]').forEach((slider) => {
      slider.value = slider.defaultValue;
      const label = document.getElementById(`${slider.id}Value`);
      if (label) label.textContent = slider.value;
    });
    document.getElementById("lightColor").value = "#ffffff";
    document.getElementById("shadowMapping").checked = true;
    document.getElementById("shadowOverlay").checked = false;
    document.getElementById("timeOfDayPreset").value = "custom";
  }

  collapseAllSections() {
    document.querySelectorAll(".section-content").forEach((sc) => {
      sc.classList.add("collapsed");
    });
    document.querySelectorAll(".section-toggle").forEach((st) => {
      st.classList.add("collapsed");
    });
  }


}
