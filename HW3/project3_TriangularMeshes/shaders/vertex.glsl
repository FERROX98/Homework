attribute vec3 pos;
attribute vec4 clr;

uniform mat4 trans;

varying vec4 vcolor;

uniform bool flgSwap; 

void main()
{
    if (flgSwap)
    {
        vec3 newPos = vec3(pos.x, pos.z, pos.y);
        gl_Position = trans * vec4(newPos, 1.0);

    } else {
        gl_Position = trans * vec4(pos, 1.0);

    }

    vcolor = clr;
}