precision highp float;

attribute vec3 position;
attribute vec2 textureCoords;
attribute vec3 normal; // ADD THIS

uniform mat4 projection, view, model;
uniform mat3 normalMatrix;

varying vec2 texCoords;
varying vec3 vNormal; // ADD THIS

void main() {
    vec4 world_space = model * vec4(position, 1.0);
    texCoords = textureCoords;

    // Transform normal to world space (approx. using model matrix, ignoring scale/skew)
    vNormal = normalize(normalMatrix * normal);

    gl_Position = projection * view * world_space;
}
