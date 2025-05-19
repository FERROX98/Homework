attribute vec3 pos;
attribute vec3 normal;
attribute vec2 textureCoords;

uniform mat4 matrixMVP;
uniform mat4 matrixMV;
uniform mat3 invTranspMV;
uniform bool flgSwap; 

varying vec2 texCoords;
varying vec3 normalMVP;
varying vec3 viewVector;



void main()
{
    vec3 newPos = pos;

    if (flgSwap)
    {
        newPos = vec3(pos.x, pos.z, pos.y);
        // from world space to camera space

    } 

    texCoords = textureCoords;
    // invTranspMV * normal
    normalMVP = invTranspMV * normal; 
    // MV * pos
    viewVector = vec3( matrixMV * vec4(newPos, 1.0));

    gl_Position = matrixMVP * vec4(newPos, 1.0);


}