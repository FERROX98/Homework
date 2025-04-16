attribute vec3 pos;
attribute vec3 normal;
attribute vec2 textureCoords;

uniform mat4 matrixMVP;
uniform mat4 matrixMV;
uniform mat3 invTranspMV;
uniform bool flgSwap; 

varying vec2 texCoords;
varying vec3 normalMVP;
varying vec4 viewVector;



void main()
{
    if (flgSwap)
    {
        vec3 newPos = vec3(pos.x, pos.z, pos.y);
        // from world space to camera space
        gl_Position = matrixMVP * vec4(newPos, 1.0);

    } else {
        gl_Position = matrixMVP * vec4(pos, 1.0);

    }

    texCoords = textureCoords;
    // invTranspMV * normal
    normalMVP = invTranspMV * normal; 
    // MV * pos
    viewVector = matrixMV * vec4(pos, 0.0);

}