precision highp float;
attribute vec3 position;
attribute vec2 textureCoords;

uniform mat4 projection, view, model;

varying vec2 texCoords;
varying vec3 vFragPos;

void main() {
    vec4 world_space = model * vec4(position, 1.0);

    // camera centered at origin 
    vFragPos = vec3(view * world_space);
    
    
    texCoords = textureCoords;
    
    gl_Position = projection * view * world_space;
} 