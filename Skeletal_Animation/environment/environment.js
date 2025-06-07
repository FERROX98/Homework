import * as utils from '../shaders/shader_utils.js';
import { Ground } from './ground.js';

const vsPath = './shaders/env/vertex.glsl';
const fsPath = './shaders/env/fragment.glsl';

class Environment {
  constructor(gl) {
    this.gl = gl;
    this.ground = null;
    this.isLoad = true;
    this.model = null;
    this.dirLightDir = [0.5, 1.0, 0.3];
    this.dirLightColor = [1.0, 1.0, 1.0];
    this.lightPos = [10.0, 10.0, 10.0];
    this.lightColor = [1.0, 1.0, 1.0];
    // Initialize shader program
     this.init();
    // utils.initShader(this.gl, vsPath, fsPath).then(program => {
    //   if (program) {
    //       console.log('Environment shader program initialized:', program);
    //       this.isLoad = true;
    //       this.envProgram = program;
    //       this.init();
    //   } else {
    //       console.error('Failed to initialize environment shader program');
    //   }
    // });
  }

  init() {
    console.log('Environment initialized');
    this.ground = new Ground(this.gl);
    console.log('Ground initialized');
  }

  renderEnvironment(proj, view) {
    let trianglesCount = 0;
    if (!this.isLoad) {
      console.warn('Env program not initialized yet');
      return;
    }
     const lights = {
      lightPos: this.lightPos,
      lightColor: this.lightColor,
      dirLightDir: this.dirLightDir,
      dirLightColor: this.dirLightColor
    };

    if (this.ground) {
      trianglesCount += this.ground.render(proj, view, lights);
    }
    if (this.model) {
      trianglesCount += this.model.render(proj, view, lights);
    }
    return trianglesCount;
  }

  setModel(model) {
    this.model = model;
    console.log('Model set in environment:', model);
  }
}

export {Environment};