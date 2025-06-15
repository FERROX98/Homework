import * as utils from '../shaders/shader_utils.js';

const vsPath = 'shaders/sky/vertex.glsl';
const fsPath = 'shaders/sky/fragment.glsl';

class GradientSky {
  constructor(gl) {
    this.gl = gl;
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
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    this.indexCount = indices.length;
  }

  render() {
    if (!this.isLoad) return;

    const gl = this.gl;
    gl.useProgram(this.program);

    gl.disable(gl.DEPTH_TEST); // disable depth so sky renders behind
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(this.vertPos, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.vertPos);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);

    gl.enable(gl.DEPTH_TEST); // re-enable for other geometry

    return this.indexCount/3;
  }
}

export { GradientSky };
