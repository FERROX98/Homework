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

  initTexture() {
    TextureUtils.setTexture(this, this.textures, true);
    this.toggleTextures(true);
    this.texturesLoaded = true;
  }

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

  initGeometry(size) {
    const gl = this.gl;

    const quad = this.createGroundQuad(size);
    
    this.vertPos = gl.getAttribLocation(this.program, 'position');
    this.vertNormal = gl.getAttribLocation(this.program, 'normal');
    this.vertTexCoords = gl.getAttribLocation(this.program, 'textureCoords');

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
       size, 0,  size,
      -size, 0,  size
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

    const model = this.model;

    // vertex
    gl.uniformMatrix4fv(this.uniforms.projection, false, proj);
    gl.uniformMatrix4fv(this.uniforms.view, false, view);
    gl.uniformMatrix4fv(this.uniforms.model, false, model);

    // fragment
    gl.uniform3fv(this.uniforms.dirLightDir, lights.dirLightDir);
    gl.uniform3fv(this.uniforms.dirLightColor, lights.dirLightColor);
    gl.uniform3fv(this.uniforms.ambientLight, lights.ambientLight);
    gl.uniform1f(this.uniforms.ambientIntensity, lights.ambientIntensity);
    
  
    const normalMatrix = mat3.create();
    mat3.fromMat4(normalMatrix, model);
    gl.uniformMatrix3fv(this.uniforms.normalMatrix, false, normalMatrix);

    if (this.texturesLoaded) 
      TextureUtils.setTexture(this, this.textures);

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
