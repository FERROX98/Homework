precision highp float;
attribute vec3 position;
attribute vec3 normal;
attribute vec2 textureCoords;

uniform mat4 projection, view, model ;
uniform mat3 normalMatrix;

varying vec2 texCoords;
varying vec3 vFragPos;
varying vec3 vNormal;

void main() {
    vec4 world_space = model * vec4(position, 1.0);

    // camera centered at origin 
    vFragPos = vec3(view * world_space);

    // invTranspMV * normal
    vNormal = normalize(normalMatrix * normal);
    
    texCoords = textureCoords; 
    
    gl_Position = projection * view * world_space; 
} 