precision highp float;
attribute vec3 position;
attribute vec3 normal;
attribute vec2 textureCoords;
uniform mat4 projection, view, model;
varying vec2 texCoords;
varying vec3 worldPos;
varying vec3 worldNormal;

void main() {
    vec4 world_space = model * vec4(position, 1.0);
    worldPos = world_space.xyz;
    
    // Transform normal to world space
    worldNormal = normalize((model * vec4(normal, 0.0)).xyz);
    
    // Use provided texture coordinates for better control over wall appearance
    texCoords = textureCoords * 2.0; // Scale for tiling
    
    gl_Position = projection * view * world_space;
} 