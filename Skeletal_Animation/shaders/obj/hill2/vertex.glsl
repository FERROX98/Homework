precision highp float;
attribute vec3 position;
attribute vec2 textureCoords;
attribute vec3 normal;

uniform mat4 projection, view, model;
uniform mat3 normalMatrix;

varying vec2 texCoords;
varying vec3 vNormal;
varying vec3 vFragPos;

void main() {
    vec4 world_space = model * vec4(position, 1.0);
    texCoords = textureCoords;

    // Transform normal to world space
    vNormal = normalize(normalMatrix * normal);
    
    // Fragment position in world space
    vFragPos = world_space.xyz;

    gl_Position = projection * view * world_space;
}
