precision mediump float;

uniform bool flgShowTexture;
uniform sampler2D textureSampler;
uniform vec3 lightDirection;
uniform float shininess;


varying vec2 texCoords;
varying vec3 viewVector;
varying vec3 normalMVP;


void main()
{
    float lightIntensity = 1.0;
    float ambientLightIntensity = 0.25;

    vec4 lightColor = vec4(1.0);
    vec4 clr = vec4(1,1,1,1);

    if (flgShowTexture)
    {
        clr = texture2D(textureSampler, texCoords); 
    }
    else {    
        clr = vec4(1,gl_FragCoord.z*gl_FragCoord.z,0,1);
    }

    vec3 normalNormalized = normalize(normalMVP);
    vec3 lightDirectionNormalized = normalize(lightDirection);
    vec3 viewVectorNormalized = normalize(-viewVector);

    vec3 h = normalize(lightDirectionNormalized + viewVectorNormalized);

    // dot product between two vectors will return the cosine of the angle statement is only true for unit vectors
    // compute Geometry term
    float cosTheta =  max(0.0,dot(normalNormalized, lightDirectionNormalized));
    // Diffuse term
    vec4 diffuseTerm = lightIntensity * clr * cosTheta;
    
    float cosPhi =  max(0.0,dot(h, normalNormalized));
    // Specular term
    vec4 specularTerm = lightIntensity * pow(cosPhi, shininess) * lightColor;

    // Ambient term
    vec4 ambientTerm = lightIntensity * lightColor *  ambientLightIntensity;
    
    gl_FragColor = ambientTerm + diffuseTerm + specularTerm;
    
}

