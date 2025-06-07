import * as utils from '../shaders/shader_utils.js';
import { mat4, mat3 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';

class Model {
  constructor(gl, modelPath) {
    this.gl = gl;
    this.modelPath = modelPath;
    this.name = modelPath.split('/').pop().split('.')[0];

    this.buffers = {};
    this.textures = { color: null, normal: null, metalRough: null, emission: null };
    this.program = null;
    this.isLoaded = false;

    const vsPath = `shaders/obj/${this.name}/vertex.glsl`;
    const fsPath = `shaders/obj/${this.name}/fragment.glsl`;

    utils.initShader(gl, vsPath, fsPath).then(program => {
      if (!program) {
        console.error('Shader failed to load for model:', this.name);
        return;
      }
      this.program = program;
      this.loadGLTF(this.gl, `models/assets/${modelPath}`).then((texture) => {
        console.log(`Model ${this.name} loaded with textures:`, texture);
        this.isLoaded = true;
        console.log(`${this.name} model loaded and ready`);
      });
    });
  }
  toggleTextures(enable) {
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.uniform1i(gl.getUniformLocation(this.program, 'isTextureEnabled'), enable ? 1 : 0);
    console.log(`Textures ${enable ? 'enabled' : 'disabled'} for model:`, this.name);
  }

  async loadGLTF(gl, url) {
    
      const res = await fetch(url);
      const json = await res.json();
      const bin = await fetch(json.buffers[0].uri).then(r => r.arrayBuffer());

      const mesh = json.meshes[0].primitives[0];
      const access = json.accessors;
      const views = json.bufferViews;

      const getData = (attr) => {
        const acc = access[mesh.attributes[attr]];
        const view = views[acc.bufferView];
        const offset = (view.byteOffset || 0) + (acc.byteOffset || 0);
        //return new Float32Array(bin, offset, acc.count * (attr === 'TEXCOORD_0' ? 2 : 3));
          return new Float32Array(bin, offset, acc.count * (attr === 'TEXCOORD_0' ? 2 : 3));

      };

      this.buffers.position = getData('POSITION');
      this.buffers.normal = getData('NORMAL');
      this.buffers.texcoord = getData('TEXCOORD_0');

      const indexAcc = access[mesh.indices];
      const indexView = views[indexAcc.bufferView];
      const indexOffset = (indexView.byteOffset || 0) + (indexAcc.byteOffset || 0);
      this.buffers.indices = new Uint16Array(bin, indexOffset, indexAcc.count);
      this.buffers.indexCount = indexAcc.count;

      this.createGLBuffers(gl);

      await this.loadTextures(gl, json);

      gl.useProgram(this.program);
      if (this.textures.color) {
        console.log('Color texture loaded:', this.textures.color);
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, this.textures.color);
          gl.uniform1i(gl.getUniformLocation(this.program, 'colorTex'), 0);
      }

      if (this.textures.metalRough) {
        console.log('Metal/Rough texture loaded:', this.textures.metalRough);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.textures.metalRough);
        gl.uniform1i(gl.getUniformLocation(this.program, 'metalRoughTex'), 1);
      }
      if (this.textures.emission) {
        console.log('Emission texture loaded:', this.textures.emission);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.textures.emission);
        gl.uniform1i(gl.getUniformLocation(this.program, 'emissionTex'), 2);
      }

      if (this.textures.normal) {
        console.log('Normal texture loaded:', this.textures.normal);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, this.textures.normal);
        gl.uniform1i(gl.getUniformLocation(this.program, 'normalTex'), 3);
      }
      return await [
        this.textures.color,
        this.textures.normal,
        this.textures.metalRough,
        this.textures.emission
      ];
   
  }

  createGLBuffers(gl) {
    this.vertPosLoc = gl.getAttribLocation(this.program, 'position');
    if (this.buffers.position && this.vertPosLoc !== -1) {
      this.vertPosBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertPosBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.buffers.position, gl.STATIC_DRAW);
    }

    // NORMAL
    this.normalLoc = gl.getAttribLocation(this.program, 'normal');
    if (this.buffers.normal && this.normalLoc !== -1) {
      this.normalBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.buffers.normal, gl.STATIC_DRAW);
    }

    // TEXCOORD
    this.texCoordLoc = gl.getAttribLocation(this.program, 'textureCoords');
    if (this.buffers.texcoord && this.texCoordLoc !== -1) {
      this.texCoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.buffers.texcoord, gl.STATIC_DRAW);
    }

    // INDICES
    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices, gl.STATIC_DRAW);

    this.indexCount = this.buffers.indices.length;

  }

  createBuffer(gl, data, attrName, size) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(this.program, attrName);
    if (loc !== -1) {
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(loc);
    }
  }

   async loadTextures(gl, json) {
    gl.useProgram(this.program);

    gl.uniform1i(gl.getUniformLocation(this.program, 'isTextureEnabled'), 1);
    // === Load multiple textures automatically ===
    const basePath = `models/assets/textures/${this.name}/`;
    if (json.materials && json.materials.length > 0) {
      const mat = json.materials[0];
      // Base color
      if (mat.pbrMetallicRoughness && mat.pbrMetallicRoughness.baseColorTexture) {
        const idx = mat.pbrMetallicRoughness.baseColorTexture.index;
        const tex = json.textures[idx];
        const img = json.images[tex.source];
        let uri =basePath + img.uri;
        
        this.textures.color =  await this.loadTextureImage(gl, uri);
      }
      // Normal map
      if (mat.normalTexture) {
        const idx = mat.normalTexture.index;
        const tex = json.textures[idx];
        const img = json.images[tex.source];
        let uri = basePath +img.uri;
      
        this.textures.normal =  await this.loadTextureImage(gl, uri);
      }
      // Metal/roughness
      if (mat.pbrMetallicRoughness && mat.pbrMetallicRoughness.metallicRoughnessTexture) {
        const idx = mat.pbrMetallicRoughness.metallicRoughnessTexture.index;
        const tex = json.textures[idx];
        const img = json.images[tex.source];
        let uri = basePath + img.uri;
        
        this.textures.metalRough =  await this.loadTextureImage(gl, uri);
      }
      // Emission
      if (mat.emissiveTexture) {
        const idx = mat.emissiveTexture.index;
        const tex = json.textures[idx];
        const img = json.images[tex.source];
        let uri = basePath + img.uri;
        this.textures.emission =  await this.loadTextureImage(gl, uri);
      }
    }
    // Fallback: always load color if not found
    if (!this.textures.color) {
      console.warn('No color texture found, using fallback.');
      this.textures.color =  await this.loadTextureImage(gl, 'textures/Intergalactic Spaceship_color_4.jpg');
    }


    console.log('Textures loaded:', this.textures);

    return await this.textures;
  }


   async loadTextureImage(gl, url) {
      gl.useProgram(this.program);
      const tex = gl.createTexture();
      const img = new window.Image();
      img.crossOrigin = '';
      img.onload = () => {
		    gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
      };
      img.src = await url;
      return await tex;
    }

  render(proj, view, lights) {
    if (!this.isLoaded) return;

    const gl = this.gl;
    gl.useProgram(this.program);

    const modelMatrix = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 2.0, 0, 1  // translate +1.0 in Y
    ]);
    const normalMatrix = mat3.create();
    mat3.fromMat4(normalMatrix, modelMatrix);
    mat3.invert(normalMatrix, normalMatrix);
    mat3.transpose(normalMatrix, normalMatrix);
    gl.uniformMatrix3fv(gl.getUniformLocation(this.program, 'normalMatrix'), false, normalMatrix);

    gl.uniformMatrix4fv(gl.getUniformLocation(this.program, 'projection'), false, proj);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.program, 'view'), false, view);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.program, 'model'), false, modelMatrix);
    
    //Indices
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertPosBuffer);
    gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.vertPosLoc);

    if (this.normalBuffer) {
     // console.log('Binding normal buffer');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
      gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(this.normalLoc);
    }else {
      console.warn('No normal buffer found for model:', this.name);
    }
    if (this.texCoordBuffer) {
     // console.log('Binding texture coordinates buffer');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
      gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(this.texCoordLoc);
    } else {
      console.warn('No texture coordinates buffer found for model:', this.name);
    }

    gl.uniform3fv(gl.getUniformLocation(this.program, 'lightPos'), lights.lightPos);
    gl.uniform3fv(gl.getUniformLocation(this.program, 'lightColor'), lights.lightColor);
    gl.uniform3fv(gl.getUniformLocation(this.program, 'dirLightDir'), lights.dirLightDir);
    gl.uniform3fv(gl.getUniformLocation(this.program, 'dirLightColor'), lights.dirLightColor);


    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

    gl.drawElements(gl.TRIANGLES, this.buffers.indexCount, gl.UNSIGNED_SHORT, 0);

    return this.buffers.indexCount / 3; 
  }
}

export { Model };
