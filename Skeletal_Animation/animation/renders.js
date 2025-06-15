import { Stats } from '../ui/stats.js';
import { Camera } from '../environment/camera.js';

export class Renderer {

  constructor(gl, canvas, env) {
    this.gl = gl;
    this.canvas = canvas;
    this.env = env;

    this.stats = new Stats();
    this.camera = new Camera(canvas);
    this.characterController = null;
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


