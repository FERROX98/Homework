

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
}