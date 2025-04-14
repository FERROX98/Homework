precision mediump float;

uniform bool flgShowTexture;

uniform sampler2D textureSampler;

varying vec2 texCoords;


void main()
{

    if (flgShowTexture)
    {
        gl_FragColor = texture2D(textureSampler, texCoords);
    }
    else
    {
        gl_FragColor = vec4(1,gl_FragCoord.z*gl_FragCoord.z,0,1);
    }
}

