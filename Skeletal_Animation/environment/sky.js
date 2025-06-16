import * as utils from '../shaders/shader_utils.js';
import { BaseModel } from '../models/base_model.js';

const vsPath = 'shaders/sky/vertex.glsl';
const fsPath = 'shaders/sky/fragment.glsl';

export class GradientSky extends BaseModel {
  constructor(gl) {
    super(gl);
    this.isLoad = false;

    utils.initShader(gl, vsPath, fsPath).then(program => {
      if (program) {
        console.log('[GradientSky] shader initialized:', program);
        this.program = program;
        this.initGeometry();
        this.isLoad = true;
      } else {
        console.error('[GradientSky] shader init failed');
      }
    });
  }

  initGeometry() {
    const gl = this.gl;

    const vertices = new Float32Array([
      -1, -1,
       1, -1,
       1,  1,
      -1,  1,
    ]);

    const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

    this.vertPos = gl.getAttribLocation(this.program, 'position');

    this.vertexBuffer = gl.createBuffer();
    this.bindAndSetBuffer(vertices, this.vertexBuffer, gl.ARRAY_BUFFER, gl.STATIC_DRAW);

    this.indexBuffer = gl.createBuffer();
    this.bindAndSetBuffer(indices, this.indexBuffer, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW);

    this.indexCount = indices.length;
  }

  render() {
    if (!this.isLoad) return;

    const gl = this.gl;
    gl.useProgram(this.program);

    gl.disable(gl.DEPTH_TEST);
    
    this.bindAndEnableBuffers(this.vertPos, this.vertexBuffer, 2);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);

    gl.enable(gl.DEPTH_TEST);

    return this.indexCount/3;
  }
}
