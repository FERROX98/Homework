import { Stats } from '../ui/stats.js';
import { Camera } from '../environment/camera.js';

export class Renderer {

  constructor(gl, canvas, env) {
    this.gl = gl;
    this.canvas = canvas;
    this.env = env;

    this.stats = new Stats();
    this.camera = new Camera(canvas);

    this.targetFPS = 61; 
    this.frameInterval = 1000 / this.targetFPS; 
    this.characterController = null;
    this.lastFrameTime = 0; 
  }

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

  setCharacterController(controller) {
    this.characterController = controller;
  }

  render(time) {
    const gl = this.gl;
    const env = this.env;
    // start 0 
    // elapsed 20 ms instead of 16.67 
    const elapsed = time - this.lastFrameTime;
    if (elapsed < this.frameInterval) {
      requestAnimationFrame((t) => this.render(t));
      return;
    }
    // 20 - surplus 3 ms to keep stable
    this.lastFrameTime = time - (elapsed % this.frameInterval);

    this.resizeCanvasToDisplaySize();

    gl.clearColor(0, 0, 0, 0); 
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


