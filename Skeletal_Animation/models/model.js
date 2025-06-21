import { mat3, mat4, vec3 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';

import * as utils from '../shaders/shader_utils.js';
import { AnimationUtils } from './utils/animation_utils.js';
import { GLTFUtils } from './utils/gltf_utils.js';
import { TextureUtils , TextureType } from './utils/texture_utils.js';
import { BaseModel } from './base_model.js';
const basePath = 'models/assets/';

const debug = false;

export class Model extends BaseModel {

  constructor(gl, modelPath, animated = false, visible = true, loadTexFromGlTF = false) {
    super(gl);
    this.modelPath = modelPath;
    this.name = modelPath.split('/').pop().split('.')[0];
    this.isVisible = visible;
    this.texturesLoaded = false;
    this.loadTexFromGlTF = loadTexFromGlTF;
    this.textureMode = TextureType.mod1; 

    this.program = null;
    this.isLoaded = false;

    this.buffersList = [];

    this.modelMatrix = mat4.create();
    this.animated = animated;

    // joint data
    this.animPreproc = [];
    this.jointMatrices = [];
    this.nodeParents = [];
    this.inverseBindMatrices = [];

    // Animation data 
    this.animations = [];

    this.animationSpeed = 0.4;
    this.animationIndexSelected = null;
    this.currentAnimationTime = 0;

    utils.resolveShaderPaths(this.name).then((shadersPath) => {
      // shader 
      console.log(`[${this.name}] Resolved shaders:`, shadersPath);
      utils.initShader(gl, shadersPath.vs, shadersPath.fs).then((program) => {
        if (!program) {
          console.error('Shader failed to load for model:', this.name);
          return;
        }

        this.program = program;

        this.initUniformsLocations();

        GLTFUtils.loadGLTF(this, `models/assets/obj/${modelPath}`).then(() => {
          this.createBuffers();

          if (this.animated)
            this.initAnimation();

          this.initTextures();
         
          this.isLoaded = true;
      
          this.onLoaded();

        });
      });
    });
  }

  onLoaded() {
      console.warn(`[${this.name}] model loaded successfully.`);
  }

  get animationTracks() {
    return this.animPreproc[this.animationIndexSelected].animationTracks;
  }

  get animationReversedTracks() {
    return this.animReversedPreproc[this.animationIndexSelected].animationTracks;
  }

  get animationLength() {
    if (this.animations && this.animations.length > 0) {
      return this.animPreproc[this.animationIndexSelected].animationLength;
    }
    return 0;
  }

  get animation() {
    return this.animations[this.animationIndexSelected];
  }

  switchAnimation() {
    // repeat last animation in loop
    return false;
  }

  initTextures() {
    for (const buffers of this.buffersList) {
      if (buffers.textures) {
        TextureUtils.bindTexture(this, buffers.textures, true);
      } else {
        console.warn(`[${this.name}] No textures found for buffers.`);
      }
    }
    this.toggleTextures(true);
    this.texturesLoaded = true;
  }

  selectAnimation(index) {
    if (index < 0 || index >= this.animations.length) {
      console.warn(`[${this.name}] Invalid animation ${this.animations.length }, index: ${index}`);
      return;
    }
    this.startTime = performance.now();
    this.animationIndexSelected = index;
  }


  createBuffers() {
    const gl = this.gl;
    gl.useProgram(this.program);
    
    //const attributes = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
    // for (let i = 0; i < attributes; i++) {
    //   const attribute = gl.getActiveAttrib(this.program, i);
    //   console.log(`[${this.name}] Attribute ${i}:`, attribute.name, attribute.type);
    // }

    for (const buffers of this.buffersList) {
      this.initBuffer(buffers, buffers);

    }
  }

  handleAnimation() {
    if (this.animated && this.jointNodes
      && this.jointNodes.length > 0
      && this.animationIndexSelected !== null
      && this.animationTracks.size > 0) {



      if (!this.startTime) {
        this.startTime = performance.now();
      }

      let now = performance.now();
      let elapsedSeconds = (now - this.startTime) / 1000;
      let animTime = elapsedSeconds * this.getAnimationSpeed();

      AnimationUtils.updateAnimation(animTime, this)
    }
  }

  getAnimationSpeed() {
    return this.animationSpeed;
  }

  render(proj, view, lights, transform = null) {
    if (!this.isLoaded)
      return 0;

    const gl = this.gl;
    gl.useProgram(this.program);

    const modelMatrix = transform || this.modelMatrix;

    this.onPreDraw(modelMatrix, proj, view, lights, this.uniforms);

    
    let triangleCount = 0;
    if (this.animated)
      this.handleAnimation();

    for (const buffers of this.buffersList) {
      if (this.texturesLoaded)
        TextureUtils.bindTexture(this, buffers.textures);

      this.onDraw(buffers);


      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);
      gl.drawElements(gl.TRIANGLES, buffers.indexCount, gl.UNSIGNED_SHORT, 0);
      triangleCount += buffers.indexCount / 3;
    }

    return triangleCount;
  }

  initAnimation() {
    if (!this.animations || this.animations.length === 0) {
      return;
    }

    if (this.jointNodes && this.jointNodes.length > 0) {
      this.jointMatrices = this.jointNodes.map(() => {
        const mat = mat4.create();
        return mat;
      });
    } else {
      this.jointMatrices = [];
    }

    AnimationUtils.updateJointMatrices(this);
  }
  updateTextureMode(mode) {
    if (this.textureMode === mode) {
      return;
    }

    // take the first buffer 
    const firstBuffer = this.buffersList[0];
    this.textureMode = mode;
    firstBuffer.texture = TextureUtils.loadTextures(this, basePath+`texture/${this.modelPath}/`, mode);
    TextureUtils.bindTexture(this,firstBuffer.textures, true);
  }

}
