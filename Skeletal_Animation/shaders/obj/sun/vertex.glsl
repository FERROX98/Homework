precision highp float;
attribute vec3 position;
attribute vec2 textureCoords;

uniform mat4 projection, view, model;

varying vec2 texCoords;
varying vec3 vFragPos;

void main() {
    vec4 worldPos = model * vec4(position, 1.0);

    // camera centered at origin 
    vFragPos = vec3(view * worldPos);
    
    texCoords = textureCoords;
    
    gl_Position = projection * view * worldPos;
} 