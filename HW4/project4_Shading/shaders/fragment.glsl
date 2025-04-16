precision mediump float;

uniform bool flgShowTexture;
uniform sampler2D textureSampler;
uniform vec3 lightDirection;
uniform float shininess;


varying vec2 texCoords;
varying vec4 viewVector;
varying vec3 normalMVP;


void main()
{
    vec4 clr = vec4(1,1,1,1);
    if (flgShowTexture)
    {
        // compute shading interpolating normal (phong shading) then add reflection and shining 
        clr = texture2D(textureSampler, texCoords); 

    }
    else {    
        clr = vec4(1,gl_FragCoord.z*gl_FragCoord.z,0,1);
    }

    vec3 normalNormalized = normalize(normalMVP);
    vec3 lightDirectionNormalized = normalize(-lightDirection);
    vec3 viewVectorNormalized = normalize(vec3(viewVector));


    float lightIntensity = 1.0;
    vec4 lightColor = vec4(1.0);

    vec3 r = normalize(2.0 * dot(lightDirectionNormalized, normalNormalized) * normalNormalized - lightDirectionNormalized);

    vec3 h = normalize(lightDirectionNormalized + viewVectorNormalized);

    // dot product between two vectors will return the cosine of the angle statement is only true for unit vectors
    float cosTheta =  max(0.0,dot(normalNormalized, lightDirectionNormalized));
        
    // TODO check if phi should be calculate differently wrt the slide
     // compute phi  
    float cosPhi =  max(0.0,dot(h, normalNormalized));

    // Debugging: print values by encoding them into the color output
    // Note: This is a common trick in GLSL since you can't directly print values.
    // Uncomment the line below to visualize cosTheta or cosPhi for debugging.
     //gl_FragColor = vec4(vec3(cosTheta), 1.0); // Visualize cosTheta
    //gl_FragColor = vec4(vec3(cosPhi), 1.0);   // Visualize cosPhi
    gl_FragColor = lightIntensity*((clr * cosTheta) + pow(cosPhi,shininess) * lightColor); 
    
}

