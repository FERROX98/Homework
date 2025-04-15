precision mediump float;

uniform bool flgShowTexture;

uniform sampler2D textureSampler;

varying vec2 texCoords;

uniform vec3 normalMV;

uniform vec3 normals;


void main()
{

    if (flgShowTexture)
    {
        // compute shading interpolating normal (phong shading) then add reflection and shining 
        gl_FragColor = texture2D(textureSampler, texCoords);
        
    }
    else
    {
        // kd = vec3(1,1,1);
        gl_FragColor = vec4(1,gl_FragCoord.z*gl_FragCoord.z,0,1);
    }
}

