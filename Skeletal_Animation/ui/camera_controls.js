import { TextureType } from '../models/utils/texture_utils.js';
import { StaticLoader } from '../ui/static_loader.js'

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
    this.textureModeSelector = document.getElementById("texture-mode-selector");

    // light 
    this.lightXSlider = document.getElementById("light-x-slider");
    this.lightXValue = document.getElementById("light-x-value");
    this.lightYSlider = document.getElementById("light-y-slider");
    this.lightYValue = document.getElementById("light-y-value");
    this.lightZSlider = document.getElementById("light-z-slider");
    this.lightZValue = document.getElementById("light-z-value");

    // Light
    this.lightIntensitySlider = document.getElementById("light-intensity-slider");
    this.lightIntensityValue = document.getElementById("light-intensity-value");
    this.enableHDR = document.getElementById("enable-hdr");
    this.enableAttenuation = document.getElementById("enable-attenuation");
    this.attenuationRangeSlider = document.getElementById("attenuation-range");
    this.attenuationRangeLabel = document.getElementById("attenuation-label");

    this.objectsList = document.getElementById("objects-list");
  }



  setReferences(camera, characterController, environment) {
    this.camera = camera;
    this.characterController = characterController;
    this.environment = environment;
    this.initEventListeners();
    this.initTextureModeSelector();

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

    // light
    this.lightXSlider.addEventListener('input', (e) => {
      this.lightXValue.textContent = parseFloat(e.target.value);
      this.updatePointLightPosition();
    });

    this.lightYSlider.addEventListener('input', (e) => {
      this.lightYValue.textContent = parseFloat(e.target.value);
      this.updatePointLightPosition();
    });

    this.lightZSlider.addEventListener('input', (e) => {
      this.lightZValue.textContent = parseFloat(e.target.value)
      this.updatePointLightPosition();
    });

    this.lightIntensitySlider.addEventListener('input', (e) => {
      const intensity = parseFloat(e.target.value);
      this.lightIntensityValue.textContent = intensity.toFixed(1);
      this.updateLightIntensity(intensity);
    });

    // HDR
    this.enableHDR.addEventListener('change', (e) => {
      this.environment.hdr =e.target.checked;
    });

    // Attenuation
    this.enableAttenuation.addEventListener('change', (e) => {
      this.environment.attenuationEnabled =e.target.checked;
      this.attenuationRangeSlider.disabled = !e.target.checked;
      this.attenuationRangeLabel.style.opacity = e.target.checked ? '1' : '0.5';
    });

    this.attenuationRangeSlider.addEventListener('input', (e) => {
      const attenuationRange = parseFloat(e.target.value);
      this.updateAttenuationRange(attenuationRange);
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

  initTextureModeSelector() {
      this.textureModeSelector.innerHTML = '';
      
      for (const key of Object.keys(TextureType)) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = TextureType[key].name;
        if (key === 'mod1') {
          console.log('TextureType:', TextureType);
          option.selected = true;
        }
        
        this.textureModeSelector.appendChild(option);
      }
      
      this.textureModeSelector.addEventListener('change', (e) => {
        const textureMode = e.target.value;
        this.updateTextureMode(textureMode);
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

    const actualRotationSpeed = this.characterController.rotationSpeed;
    let normalizedValue = Math.sqrt(Math.max(0, (actualRotationSpeed - this.characterController.minRotationSpeed) / this.characterController.maxRotationSpeed));
    normalizedValue = Math.max(0, Math.min(1, normalizedValue));
    
    this.rotationSpeedSlider.value = normalizedValue;
    this.rotationSpeedValue.textContent = normalizedValue.toFixed(2);

    // light
    const lightPosition = this.environment.lightPosition;
    this.lightXSlider.value = lightPosition[0].toFixed(2);
    this.lightXValue.textContent = this.lightXSlider.value;
    this.lightYSlider.value = lightPosition[1].toFixed(2);
    this.lightYValue.textContent = this.lightYSlider.value;
    this.lightZSlider.value = lightPosition[2].toFixed(2);
    this.lightZValue.textContent = this.lightZSlider.value;

    // light intensity
    const hdr = this.environment.hdr;
    const attenuationEnabled = this.environment.attenuationEnabled;
    const attenuationRange = this.environment.attenuationRange;
    this.lightIntensitySlider.value = this.environment.dirLightIntensity.toFixed(1);
    this.lightIntensityValue.textContent = this.lightIntensitySlider.value;
    this.enableHDR.checked = hdr;
    this.enableAttenuation.checked = attenuationEnabled;
    this.attenuationRangeSlider.value = attenuationRange.toFixed(1);
    this.attenuationRangeLabel.textContent = `Attenuation range: ${this.environment.attenuationRange.toFixed(1)}`;
    this.attenuationRangeSlider.disabled = !attenuationEnabled;
    this.attenuationRangeLabel.style.opacity = attenuationEnabled ? '1' : '0.5';
  }

  resetToDefaults() {
    this.camera.reset();
    this.camera.moveSpeed = 4.0;

    this.characterController.resetSpeed();
    


    this.walkAnimationSelector.value = this.characterController.model.currentWalkType || 'normal';
    for (const option of this.textureModeSelector.options) {
      if (option.textContent === TextureType.mod1.name) {
        option.selected = true;
        break;
      } 
    }
  
    // Light
    this.environment.resetLightPosition();
    this.environment.setDirectionalLightIntensity(1.0);
    

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

  updateTextureMode(textureMode) {
     
    StaticLoader.doAction(() => {
        this.environment.updateTextureMode(TextureType[textureMode]);
    }, 5000); 
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
      });

      objectItem.appendChild(checkbox);
      objectItem.appendChild(label);
      this.objectsList.appendChild(objectItem);
    });
  }


  updateAttenuationRange(attenuationRange) {
    if (!this.environment) return;

    this.environment.attenuationRange = attenuationRange;
    this.attenuationRangeLabel.textContent = `Attenuation range: ${attenuationRange.toFixed(1)}`;
  }

  updateLightIntensity(intensity) {
    if (!this.environment) return;

    this.environment.setDirectionalLightIntensity(intensity);

    const x = parseFloat(this.lightXSlider.value);
    const y = parseFloat(this.lightYSlider.value);
    const z = parseFloat(this.lightZSlider.value);

  }

  updatePointLightPosition() {
    if (!this.environment) return;

    const x = parseFloat(this.lightXSlider.value);
    const y = parseFloat(this.lightYSlider.value);
    const z = parseFloat(this.lightZSlider.value);

    this.environment.setLightPosition(x, y, z);

    const intensity = this.lightIntensitySlider ? parseFloat(this.lightIntensitySlider.value) : 1.0;
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
        this.characterController.model.animationSpeed = normalizedSpeed * speedMultiplier * this.characterController.normalizationFactor(normalizedSpeed);
      }

    }
    else {

      const cameraSpeed = 1.0 + (normalizedSpeed * 6.0);
      this.camera.moveSpeed = cameraSpeed;
    }
  }

  updateRotationSpeed(displaySpeed) {
    if (!this.characterController) return;

    let adjustedValue = (displaySpeed * (this.characterController.maxRotationSpeed-this.characterController.minRotationSpeed)) + this.characterController.minRotationSpeed;
    
    this.characterController.rotationSpeed = adjustedValue;
  }
}