export class CameraControls {
  constructor() {
    this.isVisible = false;
    this.camera = null;
    this.characterController = null; 
    this.closeBtn = document.getElementById("camera-close-btn");
    
    // fov 
    this.fovSlider = document.getElementById("fov-slider");
    this.fovValue = document.getElementById("fov-value");

    // Speed controls
    this.speedSlider = document.getElementById("speed-slider");
    this.speedValue = document.getElementById("speed-value");
    
    this.resetBtn = document.getElementById("reset-camera-settings");

    this.panel = document.getElementById("camera-controls-panel");
    this.initEventListeners(); 
  }

  setReferences(camera, characterController) {
    this.camera = camera;
    this.characterController = characterController;
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
} 