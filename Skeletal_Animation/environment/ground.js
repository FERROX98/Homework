import * as utils from '../shaders/shader_utils.js';

const vsPath = 'shaders/ground/vertex.glsl';
const fsPath = 'shaders/ground/fragment.glsl';

class Ground {
  constructor(gl) {

    this.gl = gl;
    this.isLoad = false;

    utils.initShader(gl, vsPath, fsPath).then(program => {
    if (program) {
        console.log('Ground shader program initialized:', program);
        this.groundProgram = program;
        this.isLoad = true;
        this.initGeometry(100);
        this.initTexture(true);
      } else {
        console.error('Failed to initialize ground shader program');
      }
    });
  }


  initGeometry(size) {
    const gl = this.gl;
  
    const quad = this.createGroundQuad(size);
    this.vertPos = gl.getAttribLocation(this.groundProgram, 'position');

    const vertbuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quad.vertices, gl.STATIC_DRAW);

    const linebuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, linebuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, quad.indices, gl.STATIC_DRAW);
    
    this.groundIndexCount = quad.indices.length;
    this.vertbuffer = vertbuffer;
    this.linebuffer = linebuffer;

    gl.bindVertexArray(null);
  }

  initTexture(flag) {
    const gl = this.gl;
    gl.useProgram(this.groundProgram);

    // 2x2 checkerboard: green and white
    const texData = new Uint8Array([
      34, 139, 34, 255, 255, 255, 255, 255,
      255, 255, 255, 255, 34, 139, 34, 255
    ]);

    this.groundTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0); 
    gl.bindTexture(gl.TEXTURE_2D, this.groundTexture);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, texData
    );
    gl.generateMipmap(gl.TEXTURE_2D);
    this.textureSampler = gl.getUniformLocation(this.groundProgram, 'textureSampler');
    this.flagTexture = gl.getUniformLocation(this.groundProgram, 'flagTexture');
    gl.uniform1i(this.flagTexture, flag ? 1 : 0);

    gl.uniform1i(this.textureSampler, 0);

  }

  createGroundQuad(size = 100) {
   // let floor = new Floor(2000,100);
    //return {vertices: floor.vertices, indices: floor.indices};
    const vertices = new Float32Array([
      -size, 0, -size,
       size, 0, -size,
       size, 0,  size,
      -size, 0,  size
    ]);

    // Indices for two triangles forming the quad
    const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
    return { vertices, indices };
  }

  render(proj, view, lights) {
      
      if (!this.isLoad) {
        console.warn('Env program not initialized yet');
        return;
      }

      this.gl.useProgram(this.groundProgram);
   
      let model = new Float32Array([ 1, 0, 0, 0,  
                    0, 1, 0, 0,   
                    0, 0, 1, 0,  
                    0, 0, 0, 1   
                  ]);

      //mat4.translate(model, model, [0, -2, shipZ % 2]);
      this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.groundProgram, 'projection'), false, proj);
      this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.groundProgram, 'view'), false, view);
      this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.groundProgram, 'model'), false, model);
  
      // Bind the vertex array object
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertbuffer);    
      this.gl.vertexAttribPointer(this.vertPos, 3, this.gl.FLOAT, false, 0, 0);
      this.gl.enableVertexAttribArray(this.vertPos);

      // Bind the line buffer
      this.gl.bindBuffer( this.gl.ELEMENT_ARRAY_BUFFER, this.linebuffer );

      this.gl.drawElements( this.gl.TRIANGLES, this.groundIndexCount ,  this.gl.UNSIGNED_SHORT, 0); 

      //this.gl.bindVertexArray(null);
      return this.groundIndexCount /3;
    }

}

export { Ground };
