import { mat3, mat4, vec3 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';

import * as utils from '../shaders/shader_utils.js';
import { AnimationUtils } from './utils/animation_utils.js';
import { GLTFUtils } from './utils/gltf_utils.js';
import { TextureUtils } from './utils/texture_utils.js';
import { BaseModel } from './base_model.js';

const debug = false;

export class Model extends BaseModel {

  constructor(gl, modelPath, animated = false, visible = true) {
    super(gl);
    this.modelPath = modelPath;
    this.name = modelPath.split('/').pop().split('.')[0];
    this.isVisible = visible;
    this.texturesLoaded = false;

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

        GLTFUtils.loadGLTF(this, `models/assets/${modelPath}`).then(() => {
          this.createBuffers();

          if (this.animated)
            this.initAnimation();

          this.initTextures();
          this.isLoaded = true;
          console.warn(`[${this.name}] model loaded successfully.`);

        });
      });
    });
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
      console.warn(`[${this.name}] Invalid animation index: ${index}`);
      return;
    }
    this.startTime = performance.now();
    this.animationIndexSelected = index;
  }

  // shader selected
  createBuffers() {
    const gl = this.gl;
    gl.useProgram(this.program);

    for (const buffers of this.buffersList) {

      // Pointer in the shader
      buffers.vertPosLoc = gl.getAttribLocation(this.program, 'position');
      if (buffers.vertPosLoc === -1) 
        console.error(`[${this.name}] No position attribute found in shader.`);  
      
      buffers.vertPosBuffer = gl.createBuffer();
      // set data into global buffer 
      this.bindAndSetBuffer(buffers.position, buffers.vertPosBuffer);
      
      buffers.normalLoc = gl.getAttribLocation(this.program, 'normal');
      if (buffers.normalLoc !== -1 && buffers.normals != null) {
        buffers.normalBuffer = gl.createBuffer();
        this.bindAndSetBuffer(buffers.normals, buffers.normalBuffer);
      }
      buffers.tangentLoc = gl.getAttribLocation(this.program, 'tangent');
      if (buffers.tangentLoc !== -1  && buffers.tangents != null) {
        buffers.tangentBuffer = gl.createBuffer();
        this.bindAndSetBuffer(buffers.tangents, buffers.tangentBuffer);
      }
      
      // // check (blender export tangent)
      // buffers.bitangentLoc = gl.getAttribLocation(this.program, 'bitangent');
      // if (buffers.bitangentLoc !== -1  && buffers.bitangents != null) {
      //   buffers.bitangentBuffer = gl.createBuffer();
      //   this.bindAndSetBuffer(buffers.bitangents, buffers.bitangentBuffer);
      // }
      
      buffers.texCoordLoc = gl.getAttribLocation(this.program, 'textureCoords');
      const texCoordData = buffers.texCoords;
      if (buffers.texCoordLoc === -1 && texCoordData) {      
        buffers.texCoordBuffer = gl.createBuffer();
        this.bindAndSetBuffer(texCoordData, buffers.texCoordBuffer);
      }

      buffers.jointLoc = gl.getAttribLocation(this.program, 'joints');
      if (buffers.joints &&  buffers.jointLoc !== -1) {
        buffers.jointBuffer = gl.createBuffer();
        this.bindAndSetBuffer(buffers.joints, buffers.jointBuffer);
      }

      buffers.weightLoc = gl.getAttribLocation(this.program, 'weights');
      if (buffers.weights && buffers.weightLoc !== -1) {
        buffers.weightBuffer = gl.createBuffer();
        this.bindAndSetBuffer(buffers.weights, buffers.weightBuffer);
      }
      
      // Triangles 
      buffers.indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, buffers.indices, gl.STATIC_DRAW);
    }
  }

  handleAnimation() {
    if (this.animated && this.jointNodes
      && this.jointNodes.length > 0
      && this.animationIndexSelected !== null
      && this.animationTracks.size > 0) {

      if (debug) console.warn(`[${this.name}] Updating animation...`);

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

  // shader selected
  render(proj, view, lights, transform = null) {
    if (!this.isLoaded)
      return 0;

    const gl = this.gl;
    gl.useProgram(this.program);

    const modelMatrix = transform || this.modelMatrix;
  
    // uniform setup
    this.onPreDraw(modelMatrix, proj, view, lights, this.uniforms);
  
    let triangleCount = 0;
    this.handleAnimation();

    for (const buffers of this.buffersList) {
      if (this.texturesLoaded)
        TextureUtils.bindTexture(this, buffers.textures);

      this.bindAndEnableBuffers(buffers.vertPosLoc, buffers.vertPosBuffer, 3);

      // normal 
      this.bindAndEnableBuffers(buffers.normalLoc, buffers.normalBuffer, 3);
      if (buffers.tangentLoc !== -1 && buffers.tangentBuffer) {
        this.bindAndEnableBuffers(buffers.tangentLoc, buffers.tangentBuffer, 3);
       // this.bindAndEnableBuffers(buffers.bitangentLoc, buffers.bitangentBuffer, 3);
      }
      
      this.bindAndEnableBuffers(buffers.texCoordLoc, buffers.texCoordBuffer, 2);

      if (buffers.jointLoc !== -1 && buffers.jointBuffer) {
        this.bindAndEnableBuffers(buffers.jointLoc, buffers.jointBuffer, 4);
      }
      if (buffers.weightLoc !== -1 && buffers.weightBuffer) {
        this.bindAndEnableBuffers(buffers.weightLoc, buffers.weightBuffer, 4);
      }

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
}
