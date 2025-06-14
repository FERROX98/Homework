precision highp float;

varying vec2 texCoords;
varying vec3 worldPos;
varying vec3 worldNormal;

uniform sampler2D baseColorTexture;
uniform bool isTextureEnabled;

// Basic lighting uniforms
uniform vec3 lightPos;
uniform vec3 lightColor;
uniform vec3 dirLightDir;
uniform vec3 dirLightColor;

void main() {
    vec3 baseColor;
    
    if (!isTextureEnabled) {
        // Default brick color if textures are disabled
        baseColor = vec3(0.6, 0.5, 0.4); // Light brown brick color
    } else {
        // Sample base color texture
        baseColor = texture2D(baseColorTexture, texCoords).rgb;
        
        // Check if texture loaded correctly
        if (length(baseColor) < 0.01) {
            // Use brick color as fallback
            baseColor = vec3(0.6, 0.5, 0.4);
        }
    }
    
    // Normalize the normal
    vec3 normal = normalize(worldNormal);
    
    // Directional light (sun)
    vec3 dirLight = normalize(-dirLightDir);
    float diffDir = max(dot(normal, dirLight), 0.0);
    vec3 diffuseDir = diffDir * dirLightColor;

    // Point light
    vec3 lightDir = normalize(lightPos - worldPos);
    float distance = length(lightPos - worldPos);
    float attenuation = 1.0 / (1.0 + 0.01 * distance + 0.001 * distance * distance);
    float diffPoint = max(dot(normal, lightDir), 0.0);
    vec3 diffusePoint = diffPoint * lightColor * attenuation;

    // Add ambient lighting
    vec3 ambient = vec3(0.2) * baseColor;
    vec3 lighting = ambient + (diffuseDir + diffusePoint) * baseColor * 0.8;

    gl_FragColor = vec4(lighting, 1.0);
} 