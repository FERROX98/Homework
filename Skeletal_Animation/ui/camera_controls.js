
export class CameraControls {
  constructor() {

    this.isVisible = false;
    this.camera = null;
    this.characterController = null;
    this.environment = null;

    this.closeBtn = document.getElementById("camera-close-btn");
    this.resetBtn = document.getElementById("reset-camera-settings");
    this.panel = document.getElementById("camera-controls-panel");

    // fov 
    this.fovSlider = document.getElementById("fov-slider");
    this.fovValue = document.getElementById("fov-value");

    // Speed
    this.speedSlider = document.getElementById("speed-slider");
    this.speedValue = document.getElementById("speed-value");

    // Rotation
    this.rotationSpeedSlider = document.getElementById("rotation-speed-slider");
    this.rotationSpeedValue = document.getElementById("rotation-speed-value");

    this.walkAnimationSelector = document.getElementById("walk-animation-selector");

    // Sun 
    this.sunXSlider = document.getElementById("sun-x-slider");
    this.sunXValue = document.getElementById("sun-x-value");
    this.sunYSlider = document.getElementById("sun-y-slider");
    this.sunYValue = document.getElementById("sun-y-value");
    this.sunZSlider = document.getElementById("sun-z-slider");
    this.sunZValue = document.getElementById("sun-z-value");

    // Light
    this.lightIntensitySlider = document.getElementById("light-intensity-slider");
    this.lightIntensityValue = document.getElementById("light-intensity-value");
    this.lightingStatus = document.getElementById("lighting-status");

    // TODO fix
    this.objectsList = document.getElementById("objects-list");

    this.initEventListeners();
    this.initValue();
  }

  initValue() {
    this.walkAnimationSelector.value = this.characterController ? this.characterController.model.currentWalkType : 'normal';
    //this.updateSpeedSliderRange();

    // TODO get initial values from characterController or environment
  }

  setReferences(camera, characterController, environment) {
    this.camera = camera;
    this.characterController = characterController;
    this.environment = environment;

    this.environment.onModelsUpdated = (() => {
      this.updateObjectsList();
    });

    this.updateObjectsList();

    this.updateControls();
  }

  initEventListeners() {

    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        this.toggle();
      }
    });

    this.closeBtn.addEventListener('mouseenter', () => {
      this.closeBtn.style.background = '#ff6666';
    });
    this.closeBtn.addEventListener('mouseleave', () => {
      this.closeBtn.style.background = '#ff4444';
    });
    this.closeBtn.addEventListener('click', () => {
      this.hide();
    });

    this.fovSlider.addEventListener('input', (e) => {
      const fov = parseInt(e.target.value);
      this.fovValue.textContent = fov + '°';
      this.updateFOV(fov);
    });

    this.speedSlider.addEventListener('input', (e) => {
      const displaySpeed = parseFloat(e.target.value);
      // TODO Normalize from 0.1-3 range to 0-1 range
      const normalizedSpeed = (displaySpeed - 0.1) / (1 - 0.1); // (value - min) / (max - min)
      this.speedValue.textContent = displaySpeed.toFixed(1);
      this.updateSpeed(normalizedSpeed);
    });

    this.rotationSpeedSlider.addEventListener('input', (e) => {
      const displaySpeed = parseFloat(e.target.value);
      this.rotationSpeedValue.textContent = displaySpeed.toFixed(2);
      //TODO  Fix: Normalize from 0.1-0.8 range to 0-1 range
      const normalizedRotationSpeed = (displaySpeed - 0.1) / (0.8 - 0.1); // (value - min) / (max - min)
      this.updateRotationSpeed(normalizedRotationSpeed);
    });

    // Walk
    this.walkAnimationSelector.addEventListener('change', (e) => {
      const animationType = e.target.value;
      this.updateWalkAnimationType(animationType);
    });

    // Sun
    this.sunXSlider.addEventListener('input', (e) => {
      const x = parseFloat(e.target.value);
      this.sunXValue.textContent = x;
      this.updateSunPosition();
    });

    this.sunYSlider.addEventListener('input', (e) => {
      const y = parseFloat(e.target.value);
      this.sunYValue.textContent = y;
      this.updateSunPosition();
    });

    this.sunZSlider.addEventListener('input', (e) => {
      const z = parseFloat(e.target.value);
      this.sunZValue.textContent = z;
      this.updateSunPosition();
    });

    this.lightIntensitySlider.addEventListener('input', (e) => {
      const intensity = parseFloat(e.target.value);
      this.lightIntensityValue.textContent = intensity.toFixed(1);
      this.updateLightIntensity(intensity);
    });

    this.resetBtn.addEventListener('click', () => {
      this.resetToDefaults();
    });

    this.resetBtn.addEventListener('mouseenter', () => {
      this.resetBtn.style.background = '#888';
    });

    this.resetBtn.addEventListener('mouseleave', () => {
      this.resetBtn.style.background = '#666';
    });
  }

  updateFOV(fov) {
    if (!this.camera) return;

    const fovRad = (fov * Math.PI) / 180;
    this.camera.fov = fovRad;
    this.camera.updateProjection();
  }

  updateSpeed(normalizedSpeed) {
    if (!this.characterController) return;

    if (!this.camera.cameraMode.isOrbital) {

      const actualSpeed = normalizedSpeed * 0.1;

      this.characterController.moveSpeed = actualSpeed;
      this.characterController.updateSpeed(actualSpeed);

      if (this.characterController.model && this.characterController.model.animationSpeed) {

        const baseAnimSpeed = 1.0;
        const speedMultiplier = 0.05 + (normalizedSpeed);
        this.characterController.model.animationSpeed = baseAnimSpeed * speedMultiplier;
      }
      console.log(`Character move speed updated to: ${this.characterController.moveSpeed} (normalized: ${normalizedSpeed})`);
      console.log(`Character animation speed updated to: ${this.characterController.model?.animationSpeed}`);
    }
    else {

      const cameraSpeed = 1.0 + (normalizedSpeed * 6.0);
      this.camera.moveSpeed = cameraSpeed;
    }
  }

  updateRotationSpeed(normalizedRotationSpeed) {
    if (!this.characterController) return;

    this.characterController.rotationSpeed = normalizedRotationSpeed * 0.8;
  }

  updateSpeedSliderRange() {
    this.speedSlider.min = '0.1';
    this.speedSlider.max = '3';
    this.speedSlider.step = '0.1';

    // TODO normalize
    this.speedSlider.value = this.characterController ? this.characterController.moveSpeed : '1.5';

    this.speedValue.textContent = parseFloat(this.speedSlider.value).toFixed(1);
  }

  updateControls() {
    if (!this.camera || !this.characterController) return;

    const currentFov = (this.camera.fov * 180 / Math.PI).toFixed(0);
    this.fovSlider.value = currentFov;
    this.fovValue.textContent = currentFov + '°';

    const moveSpeedNormalized = this.characterController.moveSpeed / 0.3;
    const displaySpeed = (moveSpeedNormalized * (3 - 0.1)) + 0.1;

    this.speedSlider.value = displaySpeed;
    this.speedValue.textContent = displaySpeed.toFixed(1);

    const rotationSpeedNormalized = this.characterController.rotationSpeed / 0.8;
    const displayRotationSpeed = (rotationSpeedNormalized * (0.8 - 0.1)) + 0.1;
    this.rotationSpeedSlider.value = displayRotationSpeed;
    this.rotationSpeedValue.textContent = displayRotationSpeed.toFixed(2);
  }

  resetToDefaults() {
    if (this.camera) {
      this.camera.fov = (45 * Math.PI) / 180;
      this.camera.updateProjection();
      this.camera.moveSpeed = 4.0;
    }

    if (this.characterController) {
      // TODO fix
      const mediumMovementDisplay = 1.5;
      const normalizedMovement = (mediumMovementDisplay - 0.1) / (3 - 0.1);
      const actualMovementSpeed = normalizedMovement * 1.5;
      this.characterController.moveSpeed = actualMovementSpeed;

      this.characterController.rotationSpeed = 0.20;

      this.characterController.setWalkAnimationType('normal');

      if (this.walkAnimationSelector) {
        this.walkAnimationSelector.value = 'normal';
      }
    }

    // Sun
    if (this.environment) {
      this.environment.setSunPosition(50, 80, 30);
      this.environment.setDirectionalLightIntensity(1.0);
    }

    this.sunXSlider.value = '50';
    this.sunXValue.textContent = '50';

    this.sunYSlider.value = '80';
    this.sunYValue.textContent = '80';

    this.sunZSlider.value = '30';
    this.sunZValue.textContent = '30';

    this.lightIntensitySlider.value = '1.0';
    this.lightIntensityValue.textContent = '1.0';

    this.updateControls();
  }

  show() {
    this.isVisible = true;
    this.panel.style.display = 'block';

    setTimeout(() => {
      this.panel.style.opacity = '1';
      this.panel.style.transform = 'translateY(0)';
    }, 10);

    this.updateControls();
  }

  hide() {
    this.isVisible = false;
    this.panel.style.opacity = '0';
    this.panel.style.transform = 'translateY(-10px)';

    setTimeout(() => {
      this.panel.style.display = 'none';
    }, 300);
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  updateWalkAnimationType(animationType) {
    if (!this.characterController) return;
    this.characterController.setWalkAnimationType(animationType);
  }

  updateObjectsList() {
    if (!this.environment || !this.objectsList) return;

    this.objectsList.innerHTML = '';

    const modelsList = this.environment.getModelsList();

    if (modelsList.length === 0) {
      this.objectsList.innerHTML = '<div class="object-item">Empty</div>';
      return;
    }

    modelsList.forEach((modelInfo, index) => {
      const objectItem = document.createElement('div');
      objectItem.className = 'object-item';
      objectItem.style.display = 'flex';
      objectItem.style.alignItems = 'center';
      objectItem.style.gap = '8px';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `object-${index}`;
      checkbox.checked = modelInfo.isVisible;
      checkbox.className = 'object-checkbox';

      const label = document.createElement('label');
      label.htmlFor = `object-${index}`;
      label.textContent = modelInfo.name;
      label.className = 'object-name';
      label.style.margin = '0';
      label.style.cursor = 'pointer';

      //TODO fix Add event listener for visibility toggle
      checkbox.addEventListener('change', (e) => {
        const isVisible = e.target.checked;
        this.environment.setModelVisibility(modelInfo.model, isVisible);
        console.log(`Toggled ${modelInfo.name} visibility: ${isVisible}`);
      });

      objectItem.appendChild(checkbox);
      objectItem.appendChild(label);
      this.objectsList.appendChild(objectItem);
    });
  }

  updateLightIntensity(intensity) {
    if (!this.environment) return;

    this.environment.setDirectionalLightIntensity(intensity);

    const x = parseFloat(this.sunXSlider.value);
    const y = parseFloat(this.sunYSlider.value);
    const z = parseFloat(this.sunZSlider.value);

    this.lightingStatus.textContent = `Sun: [${x}, ${y}, ${z}] - Light intensity: ${intensity.toFixed(1)}`;
  }

  updateSunPosition() {
    if (!this.environment) return;

    const x = parseFloat(this.sunXSlider.value);
    const y = parseFloat(this.sunYSlider.value);
    const z = parseFloat(this.sunZSlider.value);

    this.environment.setSunPosition(x, y, z);

    const intensity = this.lightIntensitySlider ? parseFloat(this.lightIntensitySlider.value) : 1.0;
    this.lightingStatus.textContent = `Sun: [${x}, ${y}, ${z}] - Light intensity: ${intensity.toFixed(1)}`;
  }

}