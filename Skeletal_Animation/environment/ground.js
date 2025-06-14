import { TextureUtils } from '../models/texture_utils.js';
import * as utils from '../shaders/shader_utils.js';
import { mat4 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';
const vsPath = 'shaders/ground/vertex.glsl';
const fsPath = 'shaders/ground/fragment.glsl';

class Ground {
  // ok
  constructor(gl) {
    this.gl = gl;
    this.isLoad = false;
    this.texturesLoaded = false;
    this.model = mat4.create();

    utils.initShader(gl, vsPath, fsPath).then(program => {
      if (program) {
        console.log('[Ground] shader program initialized:', program);
        this.program = program;
        this.isLoad = true;
        this.initGeometry(100);

        this.loadGroundTextures().then((textures) => {
          this.textures = textures;
          console.log('[Ground]  textures loaded:', this.textures);
          this.initTexture();
        });
      } else {
        console.error('Failed to initialize ground shader program');
      }
    });
  }

  // ok
  initTexture() {
    TextureUtils.initUniforms(this, this.textures);
    this.toggleTextures(true);
    this.texturesLoaded = true;
  }

  // ok
  toggleTextures(enable) {
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.uniform1i(
      gl.getUniformLocation(this.program, 'isTextureEnabled'),
      enable ? 1 : 0);
  }

  //ok
  async loadGroundTextures() {
    const gl = this.gl;
    gl.useProgram(this.program);

    const baseColorTexture = await TextureUtils.loadTextureImage(this, 'models/assets/textures/ground/037_basecolor_2048.png');
    const normalTexture = await TextureUtils.loadTextureImage(this, 'models/assets/textures/ground/037_normal_2048.png');
    const metallicTexture = await TextureUtils.loadTextureImage(this, 'models/assets/textures/ground/037_metallic_2048.png');
    const emissionTexture = await TextureUtils.loadTextureImage(this, 'models/assets/textures/ground/037_ao_2048.png');

    return await {
      color: baseColorTexture,
      normal: normalTexture,
      metalRough: metallicTexture,
      emission: emissionTexture,
    };
  }

  // ok
  async loadTexture(url) {
    const gl = this.gl;
    return new Promise((resolve, reject) => {
      const texture = gl.createTexture();
      const image = new Image();

      image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        gl.generateMipmap(gl.TEXTURE_2D);
        resolve(texture);
      };

      image.onerror = () => {
        reject(new Error(`[Ground] Failed to load texture: ${url}`));
      };

      image.src = url;
    });
  }

  // ok
  initFallbackTexture() {
    TextureUtils.createNaturalFallbackTexture(this);
  }

  // ok
  initGeometry(size) {
    const gl = this.gl;

    const quad = this.createGroundQuad(size);
    this.vertPos = gl.getAttribLocation(this.program, 'position');

    const vertPosLoc = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertPosLoc);
    gl.bufferData(gl.ARRAY_BUFFER, quad.vertices, gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, quad.indices, gl.STATIC_DRAW);

    this.groundIndexCount = quad.indices.length;
    this.vertPosLoc = vertPosLoc;
    this.indexBuffer = indexBuffer;
  }

  // ok
  createGroundQuad(size = 100) {
    const vertices = new Float32Array([
      -size, 0, - size,
      size, 0, -size,
      size, 0, size,
      -size, 0, size
    ]);

    const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
    return { vertices, indices };
  }

  render(proj, view, lights) {

    if (!this.isLoad) {
      return;
    }

    const gl = this.gl;
    gl.useProgram(this.program);

    const model = this.model;

    gl.uniformMatrix4fv(gl.getUniformLocation(this.program, 'projection'), false, proj);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.program, 'view'), false, view);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.program, 'model'), false, model);

    if (lights) {
      gl.uniform3fv(gl.getUniformLocation(this.program, 'lightPos'), lights.lightPos || [0, 10, 0]);
      gl.uniform3fv(gl.getUniformLocation(this.program, 'lightColor'), lights.lightColor || [1, 1, 1]);
      gl.uniform3fv(gl.getUniformLocation(this.program, 'dirLightDir'), lights.dirLightDir || [0, -1, 0]);
      gl.uniform3fv(gl.getUniformLocation(this.program, 'dirLightColor'), lights.dirLightColor || [1, 1, 1]);
    }

    if (this.texturesLoaded)
      TextureUtils.setTexture(this, this.textures);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertPosLoc);
    gl.vertexAttribPointer(this.vertPos, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.vertPos);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(gl.TRIANGLES, this.groundIndexCount, gl.UNSIGNED_SHORT, 0);

    return this.groundIndexCount / 3;
  }

}

export { Ground };
