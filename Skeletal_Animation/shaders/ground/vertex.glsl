precision highp float;
attribute vec3 position;
uniform mat4 projection, view, model;
varying vec2 texCoords;
varying vec3 worldPos;

void main() {
    vec4 world_space = model * vec4(position, 1.0);
    worldPos = world_space.xyz;

    // Smooth texture coordinates for better tiling (repeat texture every 20 units)
    // Using smaller scale to reduce any checkerboard-like patterns
    texCoords = position.xz * 0.05;
    
    gl_Position = projection * view * world_space;
}