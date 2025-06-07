import { mat4, quat } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';
import * as utils from '../shaders/shader_utils.js';
import { Stats } from '../ui/stats.js';
import { OrbitalCamera } from '../environment/camera.js';

const vsPath = './shaders/obj/vertex.glsl';
const fsPath = './shaders/obj/fragment.glsl';

class Renderer {
  constructor(gl, canvas, env) {
    this.gl = gl;
    this.canvas = canvas;
    this.env = env;
  
    this.isLoad = false; 
    this.renderProgram = null; 

    this.stats = new Stats();
    this.camera = new OrbitalCamera(canvas);
    this.isLoad = true;
      //   utils.initShader(gl, vsPath, fsPath).then(program => {
      //     if (program) {
      //       this.renderProgram = program;
      //       this.isLoad = true;
      //       console.log('Render shader program initialized successfully');
      //     } else {
      //       console.error('Failed to initialize render shader program');
      //     }
      //   }); 
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

  render(time) {
    
    // if (!this.isLoad || !this.renderProgram) {
    //   requestAnimationFrame((t) => this.render(t));
    //   return;
    // }
 

    const gl = this.gl;
    const env = this.env;

    this.resizeCanvasToDisplaySize();

    gl.clearColor(0.2, 0.2, 0.3, 1.0); // bianco, per test
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
    const proj = this.camera.projectionMatrix;
    const view = this.camera.viewMatrix;
    
    let trianglesEnv = env.renderEnvironment(proj, view);
    
    this.stats.update(time, trianglesEnv);

    requestAnimationFrame((t) => this.render(t));
  }
}

export { Renderer };
