
precision highp float;
attribute vec3 position;
uniform mat4 projection, view, model;
varying vec2 texCoords;
void main() {
    vec4 world_space = model * vec4(position, 1.0);

    texCoords = (position.xz + 40.0) / 80.0;
    gl_Position = projection * view * world_space;
}