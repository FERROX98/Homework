export function createUI() {
  // Collapse all sections
  document.getElementById("collapseAllButton").addEventListener("click", () => {
    document.querySelectorAll(".section-content").forEach((sc) => {
      sc.classList.add("collapsed");
    });
    document.querySelectorAll(".section-toggle").forEach((st) => {
      st.classList.add("collapsed");
    });
  });

  // Expand/Collapse per section
  document.querySelectorAll(".section-header").forEach((header) => {
    header.addEventListener("click", () => {
      const content = header.nextElementSibling;
      const toggle = header.querySelector(".section-toggle");
      content.classList.toggle("collapsed");
      toggle.classList.toggle("collapsed");
    });
  });

  // Reset to default (example: reset sliders only)
  document
    .getElementById("resetDefaultsButton")
    .addEventListener("click", () => {
      document.querySelectorAll('input[type="range"]').forEach((slider) => {
        slider.value = slider.defaultValue;
        const label = document.getElementById(`${slider.id}Value`);
        if (label) label.textContent = slider.value;
      });
      document.getElementById("lightColor").value = "#ffffff";
      document.getElementById("shadowMapping").checked = true;
      document.getElementById("shadowOverlay").checked = false;
      document.getElementById("timeOfDayPreset").value = "custom";
      document.getElementById("textureToggle").checked = true;
      window.setTextureEnabled(true); // Reset texture toggle
    });

  // Texture toggle logic
  document.getElementById("textureToggle").addEventListener("change", (e) => {
    const enable = e.target.checked;
    if (window.setTextureEnabled) {
      window.setTextureEnabled(enable); // must be defined in your rendering logic
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    const panel = document.getElementById("ui-panel");
    const hideBtn = document.getElementById("hide-left-panel");
    const showBtn = document.getElementById("show-left-panel");

    hideBtn.addEventListener("click", () => {
      panel.classList.add("minimized");
      hideBtn.style.display = "none";
      showBtn.style.display = "inline-block";
    });

    showBtn.addEventListener("click", () => {
      panel.classList.remove("minimized");
      showBtn.style.display = "none";
      hideBtn.style.display = "inline-block";
    });
  });
}

export class UIControls {
  constructor() {
    this.initializeButtons();
    this.initializeEventListeners();
    this.isLeftMinimized = false;
    this.isRightMinimized = false;
  }

  initializeButtons() {
    // Panel visibility controls
   // this.minimizeButton = document.getElementById("minimize-button");
    this.leftButtonPanel = document.getElementById("left-button-panel");

    // General controls
    this.resetDefaultsButton = document.getElementById("resetDefaultsButton");
    this.collapseAllButton = document.getElementById("collapseAllButton");
   // this.toggleCameraMode = document.getElementById("toggleCameraMode");

    // Panels
    this.uiPanel = document.getElementById("ui-panel");
    //this.objectPanel = document.getElementById("object-panel");

    // this.hideBtn = document.getElementById("hide-left-panel");
    // this.showBtn = document.getElementById("show-left-panel");

    this.textureModel = document.getElementById("textureToggle");
  }

  initializeEventListeners() {
    // Panel visibility controls
    this.leftButtonPanel.addEventListener("click", () => this.toggleLeftPanel());
    // this.hideRightPanel.addEventListener("click", () =>
    //   this.toggleRightPanel()
    // );

    // General controls
    this.resetDefaultsButton.addEventListener("click", () =>
      this.resetToDefaults()
    );
    this.collapseAllButton.addEventListener("click", () =>
      this.collapseAllSections()
    );

    document.querySelectorAll(".section-header").forEach((header) => {
      header.addEventListener("click", () => {
        const content = header.nextElementSibling;
        const toggle = header.querySelector(".section-toggle");
        content.classList.toggle("collapsed");
        toggle.classList.toggle("collapsed");
      });
    });

    this.textureModel.addEventListener("change", (e) => {
      const enable = e.target.checked;
      if (window.setTextureEnabled) {
        window.setTextureEnabled(enable); // must be defined in your rendering logic
      }
    });
  }

  // Panel visibility methods
  toggleLeftPanel() {
    if (this.uiPanel && this.leftButtonPanel) {
      this.isLeftMinimized = !this.isLeftMinimized;
      this.uiPanel.classList.toggle("minimized");
      this.leftButtonPanel.classList.toggle("floating");
      this.leftButtonPanel.textContent = this.isLeftMinimized ? "▶" : "◀";
    }
  }

  toggleRightPanel() {
    if (this.objectPanel && this.hideRightPanel) {
      this.isRightMinimized = !this.isRightMinimized;
      this.objectPanel.classList.toggle("minimized");
      this.hideRightPanel.classList.toggle("floating");
      this.hideRightPanel.textContent = this.isRightMinimized ? "◀" : "▶";
    }
  }

  // General control methods
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
    document.getElementById("textureToggle").checked = true;
    window.setTextureEnabled(true); // Reset texture toggle
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
