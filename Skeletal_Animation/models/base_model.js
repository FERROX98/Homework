
import { vec3, mat3, mat4, vec4 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';
import { TextureUtils , TextureType} from './utils/texture_utils.js';

const debug = false;

export class BaseModel {
    constructor(gl) {
        this.gl = gl;
        this.textureMode = TextureType.mod1; 
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
        gl.useProgram(this.program);
        if (!buffer || !data){
            console.error(`[${this.name}] No buffer or data to bind`,  data,buffer);
            return; 
        }
        // select the buffer
        gl.bindBuffer(typeElement, buffer);
        // insert data into buffer
        gl.bufferData(typeElement, data, typeDraw);

    }

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
            console.warn('Trying bind buffer to invalid src', this.name);
        }
    }
    
    // shader selected (dest can be this or buffer)
    onPreDraw( modelMatrix, proj, view, lights, uniforms) {
        const gl = this.gl;
        gl.useProgram(this.program);
        // vertex
        gl.uniformMatrix4fv(uniforms.projection, false, proj);
        gl.uniformMatrix4fv(uniforms.view, false, view);
        gl.uniformMatrix4fv(uniforms.model, false, modelMatrix);
        
        // from world to view space
        const lightPosition = lights.lightPosition;
        // TODO check la luce in world space per il terreno (per avere ombre fisse) ? 
        const lightPositionViewSpace = vec4.fromValues(lightPosition[0], lightPosition[1], lightPosition[2], 1.0);
        vec4.transformMat4(lightPositionViewSpace, lightPositionViewSpace, view);

        gl.uniform4fv(uniforms.pointLightColor, lights.pointLightColor);
        gl.uniform4fv(uniforms.ambientLight, lights.ambientLight);
        gl.uniform1f(uniforms.ambientIntensity, lights.ambientIntensity);
        gl.uniform3fv(uniforms.lightPosition, vec3.fromValues(lightPositionViewSpace[0], lightPositionViewSpace[1], lightPositionViewSpace[2]));
        gl.uniform1i(uniforms.enableHDR, lights.hdr ? 1 : 0);
        gl.uniform1i(uniforms.enableAttenuation, lights.attenuationEnabled ? 1 : 0);
        gl.uniform1f(uniforms.attenuationRange, lights.attenuationRange);

        // from local to view space
        const modelViewMatrix = mat4.create();
        mat4.multiply(modelViewMatrix,view, modelMatrix );

        const normalMatrix = mat3.create();
        mat3.fromMat4(normalMatrix, modelViewMatrix);
        mat3.invert(normalMatrix, normalMatrix);
        mat3.transpose(normalMatrix, normalMatrix);
        
        gl.uniformMatrix3fv(uniforms.normalMatrix, false, normalMatrix);

    }


    // shader selected
    onDraw(src){
        const gl = this.gl;
        // only loc & buffer
        gl.useProgram(this.program);

        if (this.texturesLoaded)
            TextureUtils.bindTexture(this, src.textures);

        if (src.vertLoc !== -1 && src.vertBuffer)
            this.bindAndEnableBuffers(src.vertLoc, src.vertBuffer, 3);
        else 
            console.warn(`[${this.name}] No vertex position`, src.vertLoc, src.vertBuffer);

        if (src.vertNormalLoc !== -1 && src.vertNormalBuffer)
            this.bindAndEnableBuffers(src.vertNormalLoc, src.vertNormalBuffer, 3);
        
        if (src.vertTexCoordsLoc !== -1 && src.vertTexCoordsBuffer)
            this.bindAndEnableBuffers(src.vertTexCoordsLoc, src.vertTexCoordsBuffer, 2);
     
        if (src.vertTangentLoc !== -1 && src.vertTangentBuffer)
            this.bindAndEnableBuffers(src.vertTangentLoc, src.vertTangentBuffer, 3);
     
        if (src.jointLoc !== -1 && src.jointBuffer) 
            this.bindAndEnableBuffers(src.jointLoc, src.jointBuffer, 4);
      
        if (src.weightLoc !== -1 && src.weightBuffer) 
            this.bindAndEnableBuffers(src.weightLoc, src.weightBuffer, 4);
    

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
          pointLightColor: gl.getUniformLocation(program, 'pointLightColor'),
          lightPosition: gl.getUniformLocation(program, 'lightPosition'),
          pointLightCount: gl.getUniformLocation(program, 'pointLightCount'),

          normalMatrix: gl.getUniformLocation(program, 'normalMatrix'),
          isTextureEnabled: gl.getUniformLocation(program, 'isTextureEnabled'),

          jointMatrices: gl.getUniformLocation(program, 'jointMatrices'),
          
          enableHDR: gl.getUniformLocation(program, 'enableHDR'),
          enableAttenuation: gl.getUniformLocation(program, 'enableAttenuation'),
          attenuationRange: gl.getUniformLocation(program, 'attenuationRange')
        };
    }

    // shader selected 
  initBuffer(src, dest) {
    const gl = this.gl;
    gl.useProgram(this.program);

    // loc & src & buffer
    dest.vertLoc = gl.getAttribLocation(this.program, 'position');
    if (dest.vertLoc === -1 || !src.positions)
      console.error(`[${this.name}] Failed attribute position`);
    // Position
    dest.vertBuffer = gl.createBuffer();
    this.bindAndSetBuffer(src.positions, dest.vertBuffer, gl.ARRAY_BUFFER, gl.STATIC_DRAW);

    dest.vertNormalLoc = gl.getAttribLocation(this.program, 'normal');
    if (dest.vertNormalLoc === -1 || !src.normals)
      console.error(`[${this.name}] Failed attribute normal`, src.normals, dest.vertNormalLoc);
    // Normal
    dest.vertNormalBuffer = gl.createBuffer();
    this.bindAndSetBuffer(src.normals, dest.vertNormalBuffer, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
   
    dest.vertTexCoordsLoc = gl.getAttribLocation(this.program, 'textureCoords');
    if (dest.vertTexCoordsLoc === -1 || !src.textureCoords)
      console.error(`[${this.name}] Failed attribute textureCoords`, src.textureCoords, dest.vertTexCoordsLoc);
    // Texture
    dest.vertTexCoordsBuffer = gl.createBuffer();
    this.bindAndSetBuffer(src.textureCoords, dest.vertTexCoordsBuffer, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
    
    dest.vertTangentLoc = gl.getAttribLocation(this.program, 'tangent');
    if (dest.vertTangentLoc === -1 || !src.tangents)
      console.error(`[${this.name}] Failed attribute tangent`, src.tangents, dest.vertTangentLoc);
    // Tangent
    dest.vertTangentBuffer = gl.createBuffer();
    this.bindAndSetBuffer(src.tangents, dest.vertTangentBuffer, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
    
    dest.jointLoc = gl.getAttribLocation(this.program, 'joints');
    if (src.joints && dest.jointLoc !== -1) {
        dest.jointBuffer = gl.createBuffer();
        this.bindAndSetBuffer(src.joints, dest.jointBuffer);
    } else {
        console.warn(`[${this.name}] No joint attribute `, src.joints, dest.jointLoc);
    }
    
    dest.weightLoc = gl.getAttribLocation(this.program, 'weights');
    if (src.weights && dest.weightLoc !== -1) {  
        dest.weightBuffer = gl.createBuffer();
        this.bindAndSetBuffer(src.weights, dest.weightBuffer);
    } else {
        console.warn(`[${this.name}] No weight attribute `, src.weights, dest.weightLoc);
    }
    

    dest.indexBuffer = gl.createBuffer();
    this.bindAndSetBuffer(src.indices, dest.indexBuffer, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW);

    dest.indexCount = src.indexCount;
 }

}