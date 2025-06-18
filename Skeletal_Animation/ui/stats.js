export class Stats {
  constructor() {

    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    this.lastFrameTime = performance.now();

    this.isVisible = true;
    this.isMinimized = false;

    this.minimizeBtn = document.getElementById("minimizeBtn");
    this.fullContent = document.getElementById('full-content');
    this.minimizedView = document.getElementById('minimized-view');
    this.container = document.getElementById('stats-container');

    this.setEventsHandler();
  }

  setEventsHandler() {
   
    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'h') {
        this.toggle();
      }
    });

    this.minimizeBtn.addEventListener('mouseenter', () => {
      this.minimizeBtn.style.background = '#333';
    });

    this.minimizeBtn.addEventListener('mouseleave', () => {
      this.minimizeBtn.style.background = '#222';
    });

    this.minimizeBtn.addEventListener('click', (e) => {
      this.toggleMinimize();
    });
  }
  
  updatePerformanceState(time, triangles = "-") {
    if (!this.isVisible) return;

    // At each frame
    this.frameCount++;

    let ms = "-";

    // this frame - last frame  
    let frameTime = time - this.lastFrameTime;
    ms = frameTime.toFixed(1) + " ms";

    if ((time % 12000) < 20) {
      console.log('Rendering frame at time:', time / 1000);
    }

    // update at each second
    if (time - this.lastFpsUpdate >= 1000) {
      //   console.log('Updating FPS:', this.frameCount, 'frames in', time - this.lastFpsUpdate, 'ms');

      this.fps = this.frameCount;

      const fpsDisplay = this.isMinimized ? document.getElementById("fps-mini") : document.getElementById("fps");
      if (fpsDisplay) {
        fpsDisplay.textContent = this.fps;
      }
      this.lastFpsUpdate = time;
      this.frameCount = 0;

      let mb = "-";
      if (performance && performance.memory) {
        mb = Math.round(performance.memory.totalJSHeapSize / 10 ** 6) + " MB";
      }

      const msDisplay = document.getElementById("ms");
      if (msDisplay) {
        msDisplay.textContent = ms;
      }

      const mbDisplay = document.getElementById("mb");
      if (mbDisplay) {
        mbDisplay.textContent = mb;
      }

      const triDisplay = document.getElementById("triangles");
      if (triDisplay) {
        triDisplay.textContent = triangles;
      }
    }
    this.lastFrameTime = time;
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;

    if (this.isMinimized) {
      this.fullContent.style.display = 'none';
      this.minimizedView.style.display = 'block';
      this.minimizeBtn.innerHTML = '+';
      this.container.style.minWidth = 'auto';
      this.container.style.width = 'auto';
    } else {
      this.fullContent.style.display = 'block';
      this.minimizedView.style.display = 'none';
      this.minimizeBtn.innerHTML = '−';
    }
  }

  updateCharacterState(characterController, camera) {
    if (!this.isVisible) return;

    if (!characterController || !characterController.model)
      return
    
    // state 
    const state = characterController.getState();
    const pos = state.position;
    const rotationDegrees = (state.rotation * 180 / Math.PI).toFixed(1);

    const posElement = document.getElementById('position-info');
    if (posElement) {
      posElement.textContent = `(${pos[0].toFixed(1)}, ${pos[1].toFixed(1)}, ${pos[2].toFixed(1)})`;
    }

    const rotElement = document.getElementById('rotation-info');
    if (rotElement) {
      rotElement.textContent = `${rotationDegrees}°`;
    }

    const pitchElement = document.getElementById('pitch-info');
    if (pitchElement) {
      // in degrees
      pitchElement.textContent = (state.pitch * 180 / Math.PI).toFixed(1) + '°';
    }

    // debug info
    const moveElement = document.getElementById('movement-info');
    if (moveElement) {
      moveElement.textContent = state.isMoving ? 'Yes' : 'No';
    }
    
    const activeKeys = Object.keys(state.keys)
      .filter(key => state.keys[key])
      .map(key => key.toUpperCase())
      .join(', ') || 'None';

    const keysElement = document.getElementById('keys-info');
    if (keysElement) {
      keysElement.textContent = activeKeys;
    }
    
    const animationElement = document.getElementById('animation-info');
    if (animationElement && state.currentAnimation) {
      animationElement.textContent = state.currentAnimation;
    }
    
    const animationSpeedElement = document.getElementById('animation-speed-info');
    if (animationSpeedElement && state.animationSpeed) {
      animationSpeedElement.textContent = state.animationSpeed;
    }

    const cameraMode = state.cameraMode;
    let displayMode = '';
    switch (cameraMode) {
      case 'thirdPerson':
        displayMode = 'Third Person';
        break;
      case 'firstPerson':
        displayMode = 'First Person';
        break;
      case 'orbital':
        displayMode = 'Orbital';
        break;
      default:
        displayMode = cameraMode;
    }

    const camElement = document.getElementById('camera-mode');
    if (camElement) {
      camElement.textContent = displayMode;
    }
  }

  toggle() {
    this.isVisible = !this.isVisible;

    if (!this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  show() {
    this.isVisible = true;
    this.container.style.display = 'block';
    setTimeout(() => {
      this.container.style.opacity = '1';
      this.container.style.transform = 'translateY(0)';
    }, 10);
  }

  hide() {
    this.isVisible = false;
    this.container.style.opacity = '0';
    this.container.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      this.container.style.display = 'none';
    }, 300);
  }
}
