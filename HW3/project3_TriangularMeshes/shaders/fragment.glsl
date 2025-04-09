precision mediump float;

varying vec4 vcolor; 

uniform bool flgShowTexture;

void main()
{

    if (flgShowTexture)
    {
        gl_FragColor = vcolor;
    }
    else
    {
        gl_FragColor = vec4(1,gl_FragCoord.z*gl_FragCoord.z,0,1);
    }
}

