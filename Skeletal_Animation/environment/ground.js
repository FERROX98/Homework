import { TextureUtils, TextureType } from '../models/utils/texture_utils.js';
import * as utils from '../shaders/shader_utils.js';
import { mat4, mat3 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';
import { BaseModel } from '../models/base_model.js';

const basePath = 'models/assets/textures/ground/';
export class Ground extends BaseModel {

  constructor(gl, size =100) {
    super(gl);
    this.isLoaded = false;
    this.texturesLoaded = false;
    this.model = mat4.create();
    this.name = 'ground';
    this.textureMode =  TextureType.mod1;

    utils.resolveShaderPaths(this.name).then((shadersPath) => {
      // shader 
      console.log(`[${this.name}] Resolved shaders:`, shadersPath);
      utils.initShader(gl, shadersPath.vs, shadersPath.fs).then(program => {
        if (!program) 
          console.error(`[${this.name}] shader program not initialized:`, program);
        
        this.program = program;
        this.initBuffer(size);
        
        TextureUtils.loadTextures(this,basePath).then((textures) => {
          this.textures = textures;

          this.initTexture();
          this.isLoaded = true;
        });
        
        this.initUniformsLocations();
      });
    });
  }

  updateTextureMode(mode) {
    if (this.textureMode === mode) {
      return;
    }
    this.textureMode = mode;
    this.texture = TextureUtils.loadTextures(this, basePath, mode);
    TextureUtils.bindTexture(this);
  }



  initTexture() {
    TextureUtils.bindTexture(this,null, true);
    this.texturesLoaded = true;
    this.toggleTextures(true)
  }


  initBuffer(size){
    this.quad = this.createGroundQuad(size);
    const quad = this.quad;

    super.initBuffer(quad, this);
  }

  createGroundQuad(size = 100) {
    const positions = new Float32Array([
      -size, 0, -size,
      size, 0, -size,
      size, 0, size,
      -size, 0, size
    ]);

    // y --> normal direction
    const normals = new Float32Array([
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0
    ]);

    // x --> u direction 
    const tangents = new Float32Array([
      1, 0, 0,
      1, 0, 0,
      1, 0, 0,
      1, 0, 0
    ]);

    // z --> v direction right-hand
    // bitangents

    // texture
    const textureCoords = new Float32Array([
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0
    ]);

    const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

    return { 
      positions: positions,
      normals:  normals,
      textureCoords:  textureCoords,
      indices:  indices,
      tangents: tangents,
      indexCount : indices.length,
    //  bitangents: bitangentArray
    };
  }

  // shader selected
  render(proj, view, lights) {

    if (!this.isLoaded) {
      return;
    }

    const gl = this.gl;
    gl.useProgram(this.program);

    const modelMatrix = this.model;

    // uniforms
    this.onPreDraw( modelMatrix, proj, view, lights, this.uniforms);
   
    // attributes
    this.onDraw(this); 

    // draw 
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);

    
    return this.indexCount / 3;
  }
}
