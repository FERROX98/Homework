
import { vec3, mat3, mat4, vec4 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';
const debug = false;

export class BaseModel {
    constructor(gl) {
        this.gl = gl;
    }
    
    // shader selected
    toggleTextures(enable) {
        const gl = this.gl;
        gl.useProgram(this.program);
        gl.uniform1i(
            gl.getUniformLocation(this.program, 'isTextureEnabled'),
            enable ? 1 : 0);
    }

    // no shader selection
    bindAndSetBuffer(data, buffer, typeElement = this.gl.ARRAY_BUFFER, typeDraw = this.gl.STATIC_DRAW) {
        // buffers are global WebGL state no need to recall gl.useProgram
        const gl = this.gl;
        gl.useProgram(this.program);
        if (!buffer || !data)
            return; 
        // select the buffer
        gl.bindBuffer(typeElement, buffer);
        // insert data into buffer
        gl.bufferData(typeElement, data, typeDraw);
    }

    // shader selected 
    bindAndEnableBuffers(location, buffer, size, type = this.gl.FLOAT) {
        const gl = this.gl;
        gl.useProgram(this.program);

        if (buffer && location !== -1) {
            // select 
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            // set butter at this location shader
            gl.vertexAttribPointer(location, size, type, false, 0, 0);
            // activate
            gl.enableVertexAttribArray(location);
        } else if (location === -1) {
            if (debug) console.warn('Trying bind buffer to invalid src', this.name);
        }
    }
    
    // shader selected
    onPreDraw(modelMatrix, proj, view, lights, uniforms) {
        const gl = this.gl;
        gl.useProgram(this.program);
        
        // vertex
        gl.uniformMatrix4fv(uniforms.projection, false, proj);
        gl.uniformMatrix4fv(uniforms.view, false, view);
        gl.uniformMatrix4fv(uniforms.model, false, modelMatrix);
        
        // from world to view space
        const lightDirWorldSpace = vec4.fromValues(lights.dirLightDir[0], lights.dirLightDir[1],
                        lights.dirLightDir[2], 0.0);
        const lightDirViewSpace = lightDirWorldSpace;
        vec4.transformMat4(lightDirViewSpace, lightDirViewSpace, view);
        vec4.normalize(lightDirViewSpace, lightDirViewSpace);

        // from world to view space
        const lightPosition = lights.lightPosition;
        // TODO check la luce in world space per il terreno (per avere ombre fisse) ? 
        const lightPositionViewSpace = vec4.fromValues(lightPosition[0], lightPosition[1], lightPosition[2], 1.0);
        vec4.transformMat4(lightPositionViewSpace, lightPositionViewSpace, view);
        
        // fragment uniforms
        gl.uniform4fv(uniforms.dirLightDir, lightDirViewSpace);
        gl.uniform4fv(uniforms.dirLightColor, lights.dirLightColor);
        gl.uniform4fv(uniforms.ambientLight, lights.ambientLight);
        gl.uniform1f(uniforms.ambientIntensity, lights.ambientIntensity);
        gl.uniform3fv(uniforms.lightPosition, vec3.fromValues(lightPositionViewSpace[0], lightPositionViewSpace[1], lightPositionViewSpace[2]));

        // from local to view space
        const modelViewMatrix = mat4.create();
        mat4.multiply(modelViewMatrix, modelMatrix, view);

        const normalMatrix = mat3.create();
        mat3.fromMat4(normalMatrix, modelViewMatrix);
        mat3.invert(normalMatrix, normalMatrix);
        mat3.transpose(normalMatrix, normalMatrix);
        
        gl.uniformMatrix3fv(uniforms.normalMatrix, false, normalMatrix);
    }

    initUniformsLocations() {
        const gl = this.gl;
        const program = this.program;
        this.uniforms = {
          projection: gl.getUniformLocation(program, 'projection'),
          view: gl.getUniformLocation(program, 'view'),
          model: gl.getUniformLocation(program, 'model'),
          
          ambientLight: gl.getUniformLocation(program, 'ambientLight'),
          ambientIntensity: gl.getUniformLocation(program, 'ambientIntensity'),
          dirLightDir: gl.getUniformLocation(program, 'dirLightDir'),
          dirLightColor: gl.getUniformLocation(program, 'dirLightColor'),
          lightPosition: gl.getUniformLocation(program, 'lightPosition'),
          pointLightCount: gl.getUniformLocation(program, 'pointLightCount'),

          normalMatrix: gl.getUniformLocation(program, 'normalMatrix'),
          isTextureEnabled: gl.getUniformLocation(program, 'isTextureEnabled'),
        };
    }


    
}