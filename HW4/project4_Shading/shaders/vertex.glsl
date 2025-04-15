attribute vec3 pos;
attribute vec4 clr;
attribute vec2 textureCoords;


uniform mat4 matrixMVP;

uniform bool flgSwap; 
varying vec2 texCoords;

void main()
{
    if (flgSwap)
    {
        vec3 newPos = vec3(pos.x, pos.z, pos.y);
        gl_Position = matrixMVP * vec4(newPos, 1.0);

    } else {
        gl_Position = matrixMVP * vec4(pos, 1.0);

    }

    texCoords = textureCoords;

}