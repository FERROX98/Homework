
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

    this.objectsList = document.getElementById("objects-list");
  }



  setReferences(camera, characterController, environment) {
    this.camera = camera;
    this.characterController = characterController;
    this.environment = environment;
    this.initEventListeners();

    this.environment.onModelsUpdated = (() => {
      this.updateObjectsList();
    });

    this.updateObjectsList();
    this.resetToDefaults();
  }

  initEventListeners() {

    window.addEventListener('keydown', (e) => {
      e.preventDefault();

      if (e.ctrlKey && e.key.toLowerCase() === 'f') {
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
      this.speedValue.textContent = displaySpeed.toFixed(2);
      this.updateSpeed(displaySpeed);
    });

    this.rotationSpeedSlider.addEventListener('input', (e) => {
      const displaySpeed = parseFloat(e.target.value);
      this.rotationSpeedValue.textContent = displaySpeed.toFixed(2);
      this.updateRotationSpeed(displaySpeed);
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

    //resets
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



  updateControls() {
    if (!this.camera || !this.characterController) return;

    // fov
    // display degrees 
    const currentFov = (this.camera.fov * 180 / Math.PI).toFixed(0);
    this.fovSlider.value = currentFov;
    this.fovValue.textContent = currentFov + '°';

    const displaySpeed = this.characterController.moveSpeed;
    //move speed
    this.speedSlider.value = displaySpeed;
    this.speedValue.textContent = displaySpeed.toFixed(2);

    //rotatiomn
    const displayRotationSpeed = this.characterController.rotationSpeed ;
    this.rotationSpeedSlider.value = displayRotationSpeed;
    this.rotationSpeedValue.textContent = displayRotationSpeed.toFixed(2);

    // sun
    const sunPosition = this.environment.sunPosition;
    this.sunXSlider.value = sunPosition[0].toFixed(2);
    this.sunXValue.textContent = this.sunXSlider.value;
    this.sunYSlider.value = sunPosition[1].toFixed(2);
    this.sunYValue.textContent = this.sunYSlider.value;
    this.sunZSlider.value = sunPosition[2].toFixed(2);
    this.sunZValue.textContent = this.sunZSlider.value;

    // light intensity
    this.lightIntensitySlider.value = this.environment.dirLightIntensity.toFixed(1);
    this.lightIntensityValue.textContent = this.lightIntensitySlider.value;
    this.lightingStatus.textContent = `Sun: [${sunPosition[0].toFixed(2)}, ${sunPosition[1].toFixed(2)}, ${sunPosition[2].toFixed(2)}] - Light intensity: ${this.environment.dirLightIntensity.toFixed(1)}`;
  }

  resetToDefaults() {
    if (this.camera) {
      this.camera.reset();
      this.camera.moveSpeed = 4.0;
    }

    if (this.characterController) {
      this.characterController.resetSpeed();

      if (this.walkAnimationSelector) {
        this.walkAnimationSelector.value = this.characterController.model.currentWalkType || 'normal';
      }
    }

    // Sun
    if (this.environment) {
      this.environment.resetSunPosition();
      this.environment.setDirectionalLightIntensity(1.0);
    }

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

      checkbox.addEventListener('change', (e) => {
        const isVisible = e.target.checked;
        this.environment.setModelVisibility(modelInfo, isVisible);
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

  updateFOV(fov) {
    if (!this.camera) return;
    // degrees to radians  
    const fovRad = (fov * Math.PI) / 180;
    this.camera.fov = fovRad;
    this.camera.updateProjection();
  }

  updateSpeed(normalizedSpeed) {
    if (!this.characterController) return;

    if (!this.camera.cameraMode.isOrbital) {

      const actualSpeed = normalizedSpeed;;

      this.characterController.moveSpeed = actualSpeed;
      this.characterController.updateSpeed(actualSpeed);

      if (this.characterController.model && this.characterController.model.animationSpeed) {

        const speedMultiplier = this.characterController.animationSpeedMultiplier;
        this.characterController.model.animationSpeed = normalizedSpeed * speedMultiplier *  this.characterController.normalizationFactor(normalizedSpeed);
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
    this.characterController.rotationSpeed = normalizedRotationSpeed *0.8;
  }
}