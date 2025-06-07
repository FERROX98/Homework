#version 300 es
precision highp float;
precision highp int;
in vec3 position;
in vec3 normal;
in vec2 texcoord;
in vec4 weights;
in uvec4 joints;
uniform mat4 jointMatrices[100];
uniform mat4 projection, view, model;
out vec3 vNormal;
out vec2 vUv;
out vec3 vFragPos;

void main() {
    mat4 skin = weights.x * jointMatrices[joints.x] +
        weights.y * jointMatrices[joints.y] +
        weights.z * jointMatrices[joints.z] +
        weights.w * jointMatrices[joints.w];
    mat4 mvp = projection * view * model * skin;
    gl_Position = mvp * vec4(position, 1.0f);
    vNormal = mat3(transpose(inverse(model * skin))) * normal;
    vUv = texcoord;
    vFragPos = (model * skin * vec4(position, 1.0f)).xyz;
}