export class CameraControls {
  constructor() {
    this.isVisible = false;
    this.camera = null;
    this.characterController = null;
    this.environment = null;
    this.closeBtn = document.getElementById("camera-close-btn");
    
    // fov 
    this.fovSlider = document.getElementById("fov-slider");
    this.fovValue = document.getElementById("fov-value");

    // Speed controls
    this.speedSlider = document.getElementById("speed-slider");
    this.speedValue = document.getElementById("speed-value");
    
    // Walk animation controls
    this.walkAnimationSelector = document.getElementById("walk-animation-selector");
    this.walkAnimationDescription = document.getElementById("walk-animation-description");
    
    // Sun position controls
    this.sunXSlider = document.getElementById("sun-x-slider");
    this.sunXValue = document.getElementById("sun-x-value");
    this.sunYSlider = document.getElementById("sun-y-slider");
    this.sunYValue = document.getElementById("sun-y-value");
    this.sunZSlider = document.getElementById("sun-z-slider");
    this.sunZValue = document.getElementById("sun-z-value");
    
    // Light intensity controls
    this.lightIntensitySlider = document.getElementById("light-intensity-slider");
    this.lightIntensityValue = document.getElementById("light-intensity-value");
    this.lightingStatus = document.getElementById("lighting-status");
    
    // Objects list control
    this.objectsList = document.getElementById("objects-list");
    
    this.resetBtn = document.getElementById("reset-camera-settings");

    this.panel = document.getElementById("camera-controls-panel");
    this.initEventListeners(); 
  }

  setReferences(camera, characterController, environment) {
    console.warn('CameraControls setReferences called');
    this.camera = camera;
    this.characterController = characterController;
    this.environment = environment;
    
    // Set up callback for model list updates
    if (this.environment && this.environment.setModelsUpdatedCallback) {
      this.environment.setModelsUpdatedCallback(() => {
        this.updateObjectsList();
      });
    }
    
    // Initialize the objects list
    this.initObjectsList();
    
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
      const speed = parseFloat(e.target.value);
      this.speedValue.textContent = speed.toFixed(1);
      this.updateSpeed(speed);
    });

    // Walk animation selector
    this.walkAnimationSelector.addEventListener('change', (e) => {
      const animationType = e.target.value;
      this.updateWalkAnimationType(animationType);
      this.updateWalkAnimationDescription(animationType);
    });

    // Sun position controls
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

    // Light intensity control
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

  updateSpeed(speed) {
    if (!this.characterController) return;
    
    if(!this.camera.cameraMode.isOrbital) {
      this.characterController.moveSpeed = speed;
    } 
    else{
        this.camera.moveSpeed = speed;
    }
  }

  updateSpeedSliderRange() {
  
    this.speedSlider.min = '1';
    this.speedSlider.max = '10';
    this.speedSlider.step = '0.5';
    this.speedSlider.value = this.characterController ? this.characterController.moveSpeed : '10.0';
    
    this.speedValue.textContent = parseFloat(this.speedSlider.value).toFixed(1);
  }

  updateControls() {
    if (!this.camera || !this.characterController) return;
    
    const currentFov = (this.camera.fov * 180 / Math.PI).toFixed(0);
    this.fovSlider.value = currentFov;
    this.fovValue.textContent = currentFov + '°';
 
  }

 
  resetToDefaults() {
    if (this.camera) {
      this.camera.fov = (45 * Math.PI) / 180;
      this.camera.updateProjection();
      this.camera.moveSpeed = 4.0;
    }
    
    if (this.characterController) {
      this.characterController.moveSpeed = 1;
      this.characterController.rotationSpeed = 2.0;
    }
    
    // Reset lighting controls
    if (this.environment) {
      this.environment.setSunPosition(50, 80, 30);
      this.environment.setDirectionalLightIntensity(1.0);
    }
    
    // Reset UI controls for sun position
    if (this.sunXSlider) {
      this.sunXSlider.value = '50';
      this.sunXValue.textContent = '50';
    }
    if (this.sunYSlider) {
      this.sunYSlider.value = '80';
      this.sunYValue.textContent = '80';
    }
    if (this.sunZSlider) {
      this.sunZSlider.value = '30';
      this.sunZValue.textContent = '30';
    }
    
    // Reset UI controls for lighting
    if (this.lightIntensitySlider) {
      this.lightIntensitySlider.value = '1.0';
      this.lightIntensityValue.textContent = '1.0';
    }
    
    this.updateSpeedSliderRange();
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

  //ok
  hide() {
    this.isVisible = false;
    this.panel.style.opacity = '0';
    this.panel.style.transform = 'translateY(-10px)';
     setTimeout(() => {
      this.panel.style.display = 'none';
    }, 300);
  }


  //ok
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  updateWalkAnimationType(animationType) {
    if (!this.characterController) return;
    
    console.log(`Changing walk animation type to: ${animationType}`);
    
    // Set the walk animation type in the character controller
    if (this.characterController.setWalkAnimationType) {
      this.characterController.setWalkAnimationType(animationType);
    } else {
      // Fallback: trigger custom event for other components to handle
      window.dispatchEvent(new CustomEvent('walkAnimationTypeChanged', {
        detail: { animationType: animationType }
      }));
    }
  }

  updateWalkAnimationDescription(animationType) {
    const descriptions = {
      'normal': 'Standard walking animation',
      'relaxed': 'Slow, relaxed walking style',
      'fast': 'Fast running animation'
    };
    
    if (this.walkAnimationDescription) {
      this.walkAnimationDescription.textContent = descriptions[animationType] || 'Unknown animation type';
    }
  }

  // Initialize objects list
  initObjectsList() {
    if (!this.environment || !this.objectsList) return;
    
    this.updateObjectsList();
  }

  // Update objects list dynamically
  updateObjectsList() {
    if (!this.environment || !this.objectsList) return;
    
    // Clear existing list
    this.objectsList.innerHTML = '';
    
    // Get models from environment
    const modelsList = this.environment.getModelsList();
    
    if (modelsList.length === 0) {
      this.objectsList.innerHTML = '<div class="object-item">No objects in scene</div>';
      return;
    }
    
    // Create list items for each model
    modelsList.forEach((modelInfo, index) => {
      const objectItem = document.createElement('div');
      objectItem.className = 'object-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `object-${index}`;
      checkbox.checked = modelInfo.isVisible;
      checkbox.className = 'object-checkbox';
      
      const label = document.createElement('label');
      label.htmlFor = `object-${index}`;
      label.textContent = modelInfo.name;
      label.className = 'object-name';
      
      // Add event listener for visibility toggle
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
    
    // Update status
    if (this.lightingStatus) {
      this.lightingStatus.textContent = `Light intensity: ${intensity.toFixed(1)} - Directional light follows sun position`;
    }
  }

  updateSunPosition() {
    if (!this.environment) return;

    const x = parseFloat(this.sunXSlider.value);
    const y = parseFloat(this.sunYSlider.value);
    const z = parseFloat(this.sunZSlider.value);

    this.environment.setSunPosition(x, y, z);
    
    // Update status
    if (this.lightingStatus) {
      const intensity = this.lightIntensitySlider ? parseFloat(this.lightIntensitySlider.value) : 1.0;
      this.lightingStatus.textContent = `Sun: [${x}, ${y}, ${z}] - Light intensity: ${intensity.toFixed(1)}`;
    }
  }

}