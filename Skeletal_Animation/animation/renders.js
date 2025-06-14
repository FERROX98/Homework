import { Stats } from '../ui/stats.js';
import { Camera } from '../environment/camera.js';
import { AnimationSelector } from '../ui/animation_selector.js';
import { CameraControls } from '../ui/camera_controls.js';
export class Renderer {
  // ok
  constructor(gl, canvas, env) {

    this.gl = gl;
    this.canvas = canvas;
    this.env = env;

    this.stats = new Stats();
    this.camera = new Camera(canvas);

    this.animationSelector = new AnimationSelector();

    this.characterController = null;
    this.cameraControls = new CameraControls();

    this.setEventsHandler();
  }

  // TODO move in the animation selector 
  setEventsHandler() {
    window.addEventListener('animationSelected', (e) => {
      console.log('Animation selected:', e.detail.animation);
      //TODO trigger actual animation changes on the character
    });
  }

  // ok
  setCharacterController(controller) {
    this.characterController = controller;

    this.cameraControls.setReferences(this.camera, this.characterController);

    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'c') {
        this.characterController.handleCameraToggle();

        setTimeout(() => {
          this.cameraControls.updateControls();
        }, 100);
        e.preventDefault();
      }
    });
  }

  // ok
  resizeCanvasToDisplaySize() {
    const dpr = window.devicePixelRatio || 1;
    const width = Math.round(this.canvas.clientWidth * dpr);
    const height = Math.round(this.canvas.clientHeight * dpr);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  // ok
  render(time) {
    const gl = this.gl;
    const env = this.env;

    this.resizeCanvasToDisplaySize();

    // TODO may be set a texture for the sky
    gl.clearColor(0.2, 0.2, 0.3, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const proj = this.camera.projectionMatrix;
    const view = this.camera.viewMatrix;

    let trianglesCount = env.renderEnvironment(proj, view);

    // update stats 
    this.stats.updatePerformanceState(time, trianglesCount);
    if (this.characterController) {
      this.characterController.update();
      this.stats.updateCharacterState(this.characterController, this.camera);
    }
    requestAnimationFrame((t) => this.render(t));
  }
}


