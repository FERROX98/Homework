precision highp float;
attribute vec3 position;
attribute vec2 textureCoords;
attribute vec3 normal; 
attribute vec3 tangent;
// for each vertes the index of which bones influence it
attribute vec4 joints; 
uniform mat4 jointMatrices[100];

uniform mat4 projection, view, model;
uniform mat3 normalMatrix;

varying vec2 texCoords;
varying vec3 vFragPos;
varying vec3 vNormal;
attribute vec4 weights;

void main() {
    float total = max(0.001, weights.x + weights.y + weights.z + weights.w);
    float normWeights = 1.0 / total; 

    mat4 skinMatrix = 
            normWeights * weights.x * jointMatrices[int(joints.x)] +
            normWeights * weights.y * jointMatrices[int(joints.y)] + 
            normWeights * weights.z * jointMatrices[int(joints.z)] +
            normWeights * weights.w * jointMatrices[int(joints.w)];

    texCoords = textureCoords;

    // from local to view space
    vNormal = normalize(normalMatrix * vec3(skinMatrix * vec4(normal, 0.0)));

    // from model to joint space
    vec4 skinnedPosition = skinMatrix * vec4(position, 1.0);
    // from joint to world space 
    vec4 vFragPosWorldSpace = model * skinnedPosition;
    // from world to view space
    vFragPos = vec3(view * vFragPosWorldSpace);
     
    // from view to canonical view volume
    gl_Position = projection * view * vFragPosWorldSpace;
}
