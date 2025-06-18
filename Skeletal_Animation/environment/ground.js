import { TextureUtils } from '../models/utils/texture_utils.js';
import * as utils from '../shaders/shader_utils.js';
import { mat4, mat3 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';
import { BaseModel } from '../models/base_model.js';

export class Ground extends BaseModel {

  constructor(gl, size =100) {
    super(gl);
    this.isLoaded = false;
    this.texturesLoaded = false;
    this.model = mat4.create();
    this.name = 'ground';
    utils.resolveShaderPaths(this.name).then((shadersPath) => {
      // shader 
      console.log(`[${this.name}] Resolved shaders:`, shadersPath);
      utils.initShader(gl, shadersPath.vs, shadersPath.fs).then(program => {
        if (program) {
          console.log(`[${this.name}] shader program initialized:`, program);
          this.program = program;
          this.isLoaded = true;
          this.initGeometry(size);

          this.loadGroundTextures().then((textures) => {
            this.textures = textures;
            console.log(`[${this.name}]  textures loaded:`, this.textures);
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
          lightPosition: gl.getUniformLocation(program, 'lightPosition'),
        };
      });
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
      if (uniformLoc !== null && tex) {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, tex);
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

    const baseColorTexture = await TextureUtils.loadTextureImage(this, 'models/assets/textures/ground/diff.jpg');
   // const normalTexture = await TextureUtils.loadTextureImage(this, 'models/assets/textures/ground/nor.png');
    const roughnessTexture = await TextureUtils.loadTextureImage(this, 'models/assets/textures/ground/rough.jpg');
    const normalTexture =  null; 

    return await {
      color: baseColorTexture,
      normal: normalTexture,
      metalRough: roughnessTexture,
    };
  }

  initGeometry(size) {
    const gl = this.gl;

    this.quad = this.createGroundQuad(size);
    const quad = this.quad;

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

    if (!this.isLoaded) {
      return;
    }

    const gl = this.gl;
    gl.useProgram(this.program);

    const modelMatrix = this.model;

    this.onPreDraw(modelMatrix, proj, view, lights, this.uniforms);

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
