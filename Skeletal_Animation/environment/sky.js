import * as utils from '../shaders/shader_utils.js';
import { BaseModel } from '../models/base_model.js';
import { mat4 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';
import { Model } from '../models/model.js';


export class GradientSky extends BaseModel {
  constructor(gl) {
    super(gl);
    this.name = 'sky';
    this.isLoaded = false;
    this.models = [];

    utils.resolveShaderPaths(this.name).then((shadersPath) => {
      // shader 
      console.log(`[${this.name}] Resolved shaders:`, shadersPath);
      utils.initShader(gl, shadersPath.vs, shadersPath.fs).then(program => {
        if (program) {
          console.log(`[${this.name}] shader initialized:`, program);
          this.program = program;
          this.initGeometry();
          this.isLoaded = true;
        } else {
          console.error(`[${this.name}] shader init failed`);
        }
      });
    });
  }
    initGeometry() {
      const gl = this.gl;

      const vertices = new Float32Array([
        -1, -1,
        1, -1,
        1, 1,
        -1, 1,
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

      return this.indexCount / 3;
    }
}
