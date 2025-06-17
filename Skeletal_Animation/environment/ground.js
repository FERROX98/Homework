import { TextureUtils } from '../models/utils/texture_utils.js';
import * as utils from '../shaders/shader_utils.js';
import { mat4, mat3 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';
import { BaseModel } from '../models/base_model.js';

const vsPath = 'shaders/ground/vertex.glsl';
const fsPath = 'shaders/ground/fragment.glsl';

export class Ground extends BaseModel {

  constructor(gl) {
    super(gl);
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

      this.uniforms = {
        projection: gl.getUniformLocation(program, 'projection'),
        view: gl.getUniformLocation(program, 'view'),
        model: gl.getUniformLocation(program, 'model'),
        ambientLight: gl.getUniformLocation(program, 'ambientLight'),
        ambientIntensity: gl.getUniformLocation(program, 'ambientIntensity'),
        dirLightDir: gl.getUniformLocation(program, 'dirLightDir'),
        dirLightColor: gl.getUniformLocation(program, 'dirLightColor'),
        normalMatrix: gl.getUniformLocation(program, 'normalMatrix'),
        isTextureEnabled: gl.getUniformLocation(program, 'isTextureEnabled'),
      };
    });
  }

  bindTexture(init = false) {
    const units = [
      { tex: this.textures.color, uniform: 'colorTex', unit: 0 },
      { tex: this.textures.metalRough, uniform: 'metalRoughTex', unit: 1 },
      { tex: this.textures.normal, uniform: 'normalTex', unit: 2 },
    ];
    const gl = this.gl;
    gl.useProgram(this.program);
    for (const { tex, uniform, unit } of units) {
      const uniformLoc = gl.getUniformLocation(this.program, uniform);
      if (uniformLoc !== null) {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, tex || fallback);
        if (init)
          gl.uniform1i(uniformLoc, unit);
      }
    }
  }

  initTexture() {

    this.bindTexture(true);

    this.toggleTextures(true);
    this.texturesLoaded = true;
  }

  async loadGroundTextures() {
    const gl = this.gl;
    gl.useProgram(this.program);

    const baseColorTexture = await TextureUtils.loadTextureImage(this, 'models/assets/textures/ground/square_floor_diff_4k.jpg');
    const normalTexture = await TextureUtils.loadTextureImage(this, 'models/assets/textures/ground/square_floor_nor_4k.png');
    const roughnessTexture = await TextureUtils.loadTextureImage(this, 'models/assets/textures/ground/square_floor_rough_4k.png');


    return await {
      color: baseColorTexture,
      normal: normalTexture,
      metalRough: roughnessTexture,
    };
  }

  initGeometry(size) {
    const gl = this.gl;

    const quad = this.createGroundQuad(size);

    this.vertPos = gl.getAttribLocation(this.program, 'position');
    if (this.vertPos === -1)
      console.error('Failed to get attribute location for position');

    this.vertNormal = gl.getAttribLocation(this.program, 'normal');
    if (this.vertNormal === -1)
      console.error('Failed to get attribute location for normal');

    this.vertTexCoords = gl.getAttribLocation(this.program, 'textureCoords');
    if (this.vertTexCoords === -1)
      console.error('Failed to get attribute location for textureCoords');


    // Position
    this.vertPosLoc = gl.createBuffer();
    this.bindAndSetBuffer(quad.positions, this.vertPosLoc, gl.ARRAY_BUFFER, gl.STATIC_DRAW);

    // Normal
    this.vertNormalLoc = gl.createBuffer();
    this.bindAndSetBuffer(quad.normals, this.vertNormalLoc, gl.ARRAY_BUFFER, gl.STATIC_DRAW);

    // Texture
    this.vertTexCoordsLoc = gl.createBuffer();
    this.bindAndSetBuffer(quad.textureCoords, this.vertTexCoordsLoc, gl.ARRAY_BUFFER, gl.STATIC_DRAW);

    // Index
    this.indexBuffer = gl.createBuffer();
    this.bindAndSetBuffer(quad.indices, this.indexBuffer, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW);

    this.groundIndexCount = quad.indices.length;
  }

  createGroundQuad(size = 100) {
    const positions = new Float32Array([
      -size, 0, -size,
      size, 0, -size,
      size, 0, size,
      -size, 0, size
    ]);

    const normals = new Float32Array([
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0
    ]);

    const textureCoords = new Float32Array([
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0
    ]);

    const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

    return { positions, normals, textureCoords, indices };
  }

  render(proj, view, lights) {

    if (!this.isLoad) {
      return;
    }

    const gl = this.gl;
    gl.useProgram(this.program);

    const modelMatrix = this.model;

    // vertex
    gl.uniformMatrix4fv(this.uniforms.projection, false, proj);
    gl.uniformMatrix4fv(this.uniforms.view, false, view);
    gl.uniformMatrix4fv(this.uniforms.model, false, modelMatrix);

    // fragment
    gl.uniform3fv(this.uniforms.dirLightDir, lights.dirLightDir);
    gl.uniform4fv(this.uniforms.dirLightColor, lights.dirLightColor);
    gl.uniform4fv(this.uniforms.ambientLight, lights.ambientLight);
    gl.uniform1f(this.uniforms.ambientIntensity, lights.ambientIntensity);


    const modelViewMatrix = mat4.create();
    mat4.multiply(modelViewMatrix, view, modelMatrix);

    const normalMatrix = mat3.create();
    mat3.fromMat4(normalMatrix, modelViewMatrix);
    mat3.invert(normalMatrix, normalMatrix);
    mat3.transpose(normalMatrix, normalMatrix);

    gl.uniformMatrix3fv(this.uniforms.normalMatrix, false, normalMatrix);

    if (this.texturesLoaded)
      this.bindTexture();

    if (this.vertPos !== -1) {
      this.bindAndEnableBuffers(this.vertPos, this.vertPosLoc, 3);
    }

    if (this.vertNormal !== -1) {
      this.bindAndEnableBuffers(this.vertNormal, this.vertNormalLoc, 3);
    }

    if (this.vertTexCoords !== -1) {
      this.bindAndEnableBuffers(this.vertTexCoords, this.vertTexCoordsLoc, 2);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(gl.TRIANGLES, this.groundIndexCount, gl.UNSIGNED_SHORT, 0);

    return this.groundIndexCount / 3;
  }

}
