
import { vec3, mat3, mat4, vec4 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';
const debug = false;

export class BaseModel {
    constructor(gl) {
        this.gl = gl;
    }
    
    toggleTextures(enable) {
        const gl = this.gl;
        gl.useProgram(this.program);
        gl.uniform1i(
            gl.getUniformLocation(this.program, 'isTextureEnabled'),
            enable ? 1 : 0);
    }

    bindAndSetBuffer(data, buffer, typeElement = this.gl.ARRAY_BUFFER, typeDraw = this.gl.STATIC_DRAW) {
        const gl = this.gl;
        // select the buffer
        gl.bindBuffer(typeElement, buffer);
        // insert buffers.position into the buffers.vertPosBuffer
        gl.bufferData(typeElement, data, typeDraw);

    }

    bindAndEnableBuffers(location, buffer, size, type = this.gl.FLOAT) {
        const gl = this.gl;
        gl.useProgram(this.program);
        if (buffer && location !== -1) {
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.vertexAttribPointer(location, size, type, false, 0, 0);
            gl.enableVertexAttribArray(location);
        } else if (location === -1) {
            if (debug) console.warn('Trying to bind buffer to invalid attribute location (-1)', this.name);
        }
    }

    onPreDraw(modelMatrix, proj, view, lights, uniforms) {
        const gl = this.gl;
        gl.useProgram(this.program);
        // vertex
        gl.uniformMatrix4fv(uniforms.projection, false, proj);
        gl.uniformMatrix4fv(uniforms.view, false, view);
        gl.uniformMatrix4fv(uniforms.model, false, modelMatrix);
        
        // direction light vector 
        const lightDirViewSpace = vec4.fromValues( lights.dirLightDir[0], lights.dirLightDir[1], 
                        lights.dirLightDir[2], 0.0);
        vec4.transformMat4(lightDirViewSpace, lightDirViewSpace, view);
        vec4.normalize(lightDirViewSpace, lightDirViewSpace);
        
        // fragment
        gl.uniform4fv(uniforms.dirLightDir, lightDirViewSpace);
        gl.uniform4fv(uniforms.dirLightColor, lights.dirLightColor);
        gl.uniform4fv(uniforms.ambientLight, lights.ambientLight);
        gl.uniform1f(uniforms.ambientIntensity, lights.ambientIntensity);
        gl.uniform3fv(uniforms.lightPosition, lights.lightPosition);

        const modelViewMatrix = mat4.create();
        mat4.multiply(modelViewMatrix, view, modelMatrix);

        const normalMatrix = mat3.create();
        mat3.fromMat4(normalMatrix, modelViewMatrix);
        mat3.invert(normalMatrix, normalMatrix);
        mat3.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix3fv(uniforms.normalMatrix, false, normalMatrix);
    }
}