precision highp float;

varying vec2 texCoords;
varying vec3 worldPos;

uniform sampler2D colorTex;
uniform sampler2D normalTex;
uniform sampler2D metalRoughTex;
uniform sampler2D emissionTex;
uniform bool isTextureEnabled;

// Basic lighting uniforms
uniform vec3 lightPos;
uniform vec3 lightColor;
uniform vec3 dirLightDir;
uniform vec3 dirLightColor;

void main() {
    if (!isTextureEnabled) {
        // Natural ground color if textures are disabled
        gl_FragColor = vec4(0.4, 0.3, 0.2, 1.0); // Brown dirt color
        return;
    }

    // Sample base color texture
    vec3 baseColor = texture2D(colorTex, texCoords).rgb;
    
    // Check if texture loaded correctly (avoid pure black which might indicate loading failure)
    if (length(baseColor) < 0.01) {
        // Use natural ground color as fallback
        baseColor = vec3(0.4, 0.3, 0.2); // Brown dirt color
    }
    
    // Simple lighting calculation
    vec3 normal = vec3(0.0, 1.0, 0.0); // Ground normal points up
    
    // Directional light (sun)
    vec3 dirLight = normalize(-dirLightDir);
    float diffDir = max(dot(normal, dirLight), 0.0);
    vec3 diffuseDir = diffDir * dirLightColor;

    // Add ambient lighting
    vec3 ambient = vec3(0.3) * baseColor;
    vec3 lighting = ambient + diffuseDir * baseColor * 0.7;

    gl_FragColor = vec4(lighting, 1.0);
}