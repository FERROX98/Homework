import { mat3, mat4, quat, vec3, } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';

import * as utils from '../shaders/shader_utils.js';
import { AnimationUtils } from './animation_utils.js';
import { GLTFUtils } from './gltf_utils.js';
import { TextureUtils } from './texture_utils.js';

export class Model {
  //ok
  constructor(gl, modelPath) {
    this.gl = gl;
    this.modelPath = modelPath;
    
    this.name = modelPath.split('/').pop().split('.')[0];
    this.isVisible = true;
    this.texturesLoaded = false;

    this.program = null;
    this.isLoaded = false;

    this.buffersList = [];
    this.modelMatrix = mat4.create();

    // joint data
    this.jointMatrices = [];
    this.nodeParents = [];
    this.inverseBindMatrices = [];

    // Animation data
    this.animations = [];
    this.animationTracks = new Map();
    this.animationSpeed = 0.5; 
    this.animationLength = 0;
    this.animationIndexSelected = 0;

    utils.resolveShaderPaths(this.name).then((shadersPath) => {
      // shader 
      console.log(`[${this.name}] Resolved shaders:`, shadersPath);
      utils.initShader(gl, shadersPath.vs, shadersPath.fs).then((program) => {
        if (!program) {
          console.error('Shader failed to load for model:', this.name);
          return;
        }

        this.program = program;

        this.uniforms = {
          projection: gl.getUniformLocation(program, 'projection'),
          view: gl.getUniformLocation(program, 'view'),
          model: gl.getUniformLocation(program, 'model'),
          lightPos: gl.getUniformLocation(program, 'lightPos'),
          lightColor: gl.getUniformLocation(program, 'lightColor'),
          dirLightDir: gl.getUniformLocation(program, 'dirLightDir'),
          dirLightColor: gl.getUniformLocation(program, 'dirLightColor'),
          normalMatrix: gl.getUniformLocation(program, 'normalMatrix'),
          isTextureEnabled: gl.getUniformLocation(program, 'isTextureEnabled'),
        };

        GLTFUtils.loadGLTF(this, `models/assets/${modelPath}`).then(() => {
          this.createBuffers();

          // Initialize joint pose nodes and other stuff 
          this.initAnimation();
          this.initTextures();
          this.isLoaded = true;
          console.log(`[${this.name}] model loaded successfully.`);

        });
      });
    });
  }

  //ok
  initTextures() {
    for (const buffers of this.buffersList) {
      if (buffers.textures) {
        TextureUtils.initUniforms(this, buffers.textures);
      } else {
        console.warn(`[${this.name}] No textures found for buffers.`);
      }
    }
    this.toggleTextures(true);
    this.texturesLoaded = true;
  }

  get animation() {
    return this.animations[this.animationIndexSelected];
  }

  // TODO to be modified 
  selectAnimation(index) {
    if (index < 0 || index >= this.animations.length) {
      console.warn(`[${this.name}] Invalid animation index: ${index}`); 
      return;
    }
    this.animationIndexSelected = index;
  }

  // ok
  toggleTextures(enable) {
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.uniform1i(
      gl.getUniformLocation(this.program, 'isTextureEnabled'),
        enable ? 1 : 0);
  }

  // ok at init time
  createBuffers() {
    const gl = this.gl;
    for (const buffers of this.buffersList) {
      // Pointer in the shader
      buffers.vertPosLoc = gl.getAttribLocation(this.program, 'position');
      if (buffers.position && buffers.vertPosLoc !== -1) {
        // buffer of vertex
        buffers.vertPosBuffer = gl.createBuffer();
        this.bindAndSetBuffer(buffers.position, buffers.vertPosBuffer);
      }
      
      buffers.normalLoc = gl.getAttribLocation(this.program, 'normal');
      if (buffers.normal && buffers.normalLoc !== -1) {
        buffers.normalBuffer = gl.createBuffer();
        this.bindAndSetBuffer(buffers.normal, buffers.normalBuffer);
      }

      buffers.texCoordLoc = gl.getAttribLocation(this.program, 'textureCoords');
      const texCoordData = buffers.texcoord || buffers.textureCoords;
      if (texCoordData && buffers.texCoordLoc !== -1) {
        buffers.texCoordBuffer = gl.createBuffer();
        this.bindAndSetBuffer(texCoordData, buffers.texCoordBuffer);
      }

      buffers.jointLoc = gl.getAttribLocation(this.program, 'joints');
      if (buffers.joints && buffers.jointLoc !== -1) {
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

  // ok at init time 
  bindAndSetBuffer(data, buffer, typeElement=this.gl.ARRAY_BUFFER, typeDraw = this.gl.STATIC_DRAW) {
    const gl = this.gl;
    // select the buffer
    gl.bindBuffer(typeElement, buffer);
    // insert buffers.position into the buffers.vertPosBuffer
    gl.bufferData(typeElement, data, typeDraw);
    
  } 

  // ok at draw time
  bindAndEnableBuffers(location, buffer, size, type = this.gl.FLOAT) {
    const gl = this.gl;
    gl.useProgram(this.program);
    if (buffer) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.vertexAttribPointer(location, size, type, false, 0, 0);
        gl.enableVertexAttribArray(location);
      }
  } 

  // ok
  render(proj, view, lights, transform = null) {
    if (!this.isLoaded) 
      return 0;

    const gl = this.gl;
    gl.useProgram(this.program);

    // Only update animation if we have joint nodes and valid animation data
    if (this.jointNodes && this.jointNodes.length > 0 && this.animationTracks.size > 0) {
     // console.warn(`[${this.name}] Updating animation...`);
      const now = performance.now();  
      const elapsedSeconds = (now - this.startTime) / 1000;
      const animTime = elapsedSeconds * this.animationSpeed;
      
      AnimationUtils.updateAnimation(animTime, this);
    }

    const modelMatrix = transform || this.modelMatrix;

    // vertex
    gl.uniformMatrix4fv(this.uniforms.projection, false, proj);
    gl.uniformMatrix4fv(this.uniforms.view, false, view);
    gl.uniformMatrix4fv(this.uniforms.model, false, modelMatrix);

    // fragment
    gl.uniform3fv(this.uniforms.lightPos, lights.lightPos);
    gl.uniform3fv(this.uniforms.lightColor, lights.lightColor);
    gl.uniform3fv(this.uniforms.dirLightDir, lights.dirLightDir);
    gl.uniform3fv(this.uniforms.dirLightColor, lights.dirLightColor);

    // TODO check normal matrix
    const normalMatrix = mat3.create();
    mat3.fromMat4(normalMatrix, modelMatrix);
    mat3.invert(normalMatrix, normalMatrix);
    mat3.transpose(normalMatrix, normalMatrix);
    gl.uniformMatrix3fv(this.uniforms.normalMatrix, false, normalMatrix);

    let triangleCount = 0;

    for (const buffers of this.buffersList) {
      if (this.texturesLoaded)
        TextureUtils.setTexture(this, buffers.textures);
      
      this.bindAndEnableBuffers(buffers.vertPosLoc, buffers.vertPosBuffer, 3);
      this.bindAndEnableBuffers(buffers.normalLoc, buffers.normalBuffer, 3);
      this.bindAndEnableBuffers(buffers.texCoordLoc, buffers.texCoordBuffer, 2);
      
      if (buffers.jointLoc !== -1 && buffers.jointBuffer) {
        this.bindAndEnableBuffers(buffers.jointLoc, buffers.jointBuffer, 4);
      }
      if (buffers.weightLoc !== -1 && buffers.weightBuffer) {
        this.bindAndEnableBuffers(buffers.weightLoc, buffers.weightBuffer, 4);
      }

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);
      gl.drawElements(gl.TRIANGLES, buffers.indexCount, gl.UNSIGNED_SHORT, 0);
      triangleCount += buffers.indexCount/3;
    }

    return triangleCount;
  }

  // ok
  initAnimation() {
 
    if (!this.animations || this.animations.length === 0) {
     // console.warn(`[${this.name}] No animations found`);
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
    
    this.startTime = performance.now();
    AnimationUtils.updateJointMatrices(this);
  }

}
