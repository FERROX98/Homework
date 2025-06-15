export class BaseModel {
    constructor(gl, modelPath, animated = false, visible = true) {
        this.gl = gl;
        this.modelPath = modelPath;
        this.name = modelPath.split('/').pop().split('.')[0];
        this.isVisible = visible;
    }
    // TODO move in base_model
    toggleTextures(enable) {
        const gl = this.gl;
        gl.useProgram(this.program);
        gl.uniform1i(
            gl.getUniformLocation(this.program, 'isTextureEnabled'),
            enable ? 1 : 0);
    }

    // TODO move in base_model
    bindAndSetBuffer(data, buffer, typeElement = this.gl.ARRAY_BUFFER, typeDraw = this.gl.STATIC_DRAW) {
        const gl = this.gl;
        // select the buffer
        gl.bindBuffer(typeElement, buffer);
        // insert buffers.position into the buffers.vertPosBuffer
        gl.bufferData(typeElement, data, typeDraw);

    }

    // TODO move in base_model
    bindAndEnableBuffers(location, buffer, size, type = this.gl.FLOAT) {
        const gl = this.gl;
        gl.useProgram(this.program);
        if (buffer) {
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.vertexAttribPointer(location, size, type, false, 0, 0);
            gl.enableVertexAttribArray(location);
        }
    }
}