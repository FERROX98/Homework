import { TextureUtils } from '../models/utils/texture_utils.js';
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
    utils.resolveShaderPaths(this.name).then((shadersPath) => {
      // shader 
      console.log(`[${this.name}] Resolved shaders:`, shadersPath);
      utils.initShader(gl, shadersPath.vs, shadersPath.fs).then(program => {
        if (!program) 
          console.error(`[${this.name}] shader program not initialized:`, program);
        
        this.program = program;
        this.initGeometry(size);
        
        this.loadGroundTextures().then((textures) => {
          this.textures = textures;
          console.log(`[${this.name}]  textures loaded:`, this.textures);
          this.initTexture();
          this.isLoaded = true;

        });
        
        this.initUniformsLocations();
      });
    });
  }

  initTexture() {
    TextureUtils.bindTexture(this,null, true);
    this.texturesLoaded = true;
    this.toggleTextures(true)
  }

  // shader selected
  async loadGroundTextures() {
    const gl = this.gl;
    gl.useProgram(this.program);

    const [color, normal, rough, metal, ao, disp] = await Promise.all([
        TextureUtils.loadTextureImage(this, basePath+'diff.jpg'),
        TextureUtils.loadTextureImage(this, basePath+'nor.jpg'),
        TextureUtils.loadTextureImage(this, basePath+'rough.jpg'),
        TextureUtils.loadTextureImage(this, basePath+'met.jpg'),
        TextureUtils.loadTextureImage(this, basePath+'ao.jpg'),
        TextureUtils.loadTextureImage(this, basePath+'disp.jpg')
      ]);
      
      return {
        color: color,
        normal: normal,
        metal: metal,
        rough: rough,
        ao: ao,
        disp: disp
      };
    
  }

  initGeometry(size) {
    const gl = this.gl;
    gl.useProgram(this.program);
    this.quad = this.createGroundQuad(size);
    const quad = this.quad;

    this.vertPos = gl.getAttribLocation(this.program, 'position');
    if (this.vertPos === -1)
      console.warn('[Ground] Failed to get attribute location for position');
   
    this.vertNormal = gl.getAttribLocation(this.program, 'normal');
    if (this.vertNormal === -1)
      console.warn('[Ground] Failed to get attribute location for normal');

    this.vertTangent = gl.getAttribLocation(this.program, 'tangent');
    if (this.vertTangent === -1)
      console.warn('[Ground] Failed to get attribute location for tangent');

    // this.vertBitangent = gl.getAttribLocation(this.program, 'bitangent');
    // if (this.vertBitangent === -1)
    //   console.warn('[Ground] Failed to get attribute location for bitangent');

    this.vertTexCoords = gl.getAttribLocation(this.program, 'textureCoords');
    if (this.vertTexCoords === -1)
      console.warn('[Ground] Failed to get attribute location for textureCoords');

    // Position
    this.vertPosLoc = gl.createBuffer();
    this.bindAndSetBuffer(quad.positions, this.vertPosLoc, gl.ARRAY_BUFFER, gl.STATIC_DRAW);

    // Texture
    this.vertTexCoordsLoc = gl.createBuffer();
    this.bindAndSetBuffer(quad.textureCoords, this.vertTexCoordsLoc, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
    
    // Normal
    this.vertNormalLoc = gl.createBuffer();
    this.bindAndSetBuffer(quad.normals, this.vertNormalLoc, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
    console.log('[Ground] Normals:', quad.normals);
    
    // Tangent
    this.vertTangentLoc = gl.createBuffer();
    this.bindAndSetBuffer(quad.tangents, this.vertTangentLoc, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
    console.log('[Ground] Tangents:', quad.tangents);
   
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
    // const bitangentArray = new Float32Array(normals.length);
    // for (let i = 0; i < normals.length; i += 3) {
    //     const n = [normals[i], normals[i+1], normals[i+2]];
    //     const t = [tangents[i], tangents[i+1], tangents[i+2]];
        
    //     let b = TextureUtils.crossProduct(n, t);
        
    //     // Normalizza il vettore bitangente
    //     const len = Math.sqrt(b[0]*b[0] + b[1]*b[1] + b[2]*b[2]);
    //     if (len > 0) {
    //         bitangentArray[i] = b[0] / len;
    //         bitangentArray[i+1] = b[1] / len;
    //         bitangentArray[i+2] = b[2] / len;
    //     } else {
    //         // Fallback se il cross product dà un vettore zero (caso raro)
    //         bitangentArray[i] = 0;
    //         bitangentArray[i+1] = 0;
    //         bitangentArray[i+2] = 1;
    //     }
    // }
    // console.log('Bitangents:', bitangentArray);

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
    this.onPreDraw(modelMatrix, proj, view, lights, this.uniforms);

    if (this.texturesLoaded)
      TextureUtils.bindTexture(this);

    if (this.vertPos !== -1 && this.vertPosLoc)
      this.bindAndEnableBuffers(this.vertPos, this.vertPosLoc, 3);
    
    if (this.vertNormal !== -1 && this.vertNormalLoc)
      this.bindAndEnableBuffers(this.vertNormal, this.vertNormalLoc, 3);
    
    if (this.vertTexCoords !== -1 && this.vertTexCoordsLoc)
      this.bindAndEnableBuffers(this.vertTexCoords, this.vertTexCoordsLoc, 2);
    
    if (this.vertTangent !== -1 && this.vertTangentLoc)
      this.bindAndEnableBuffers(this.vertTangent, this.vertTangentLoc, 3);
    
    // if (this.vertBitangent !== -1 && this.vertBitangentLoc)
    //   this.bindAndEnableBuffers(this.vertBitangent, this.vertBitangentLoc, 3);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(gl.TRIANGLES, this.groundIndexCount, gl.UNSIGNED_SHORT, 0);

    return this.groundIndexCount / 3;
  }

}
