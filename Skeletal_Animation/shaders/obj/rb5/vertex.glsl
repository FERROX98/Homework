precision highp float;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 textureCoords;
attribute vec4 weights;
attribute vec4 joints;

uniform mat4 jointMatrices[100];
uniform mat4 projection, view, model;
uniform mat3 normalMatrix;

varying vec3 vNormal;
varying vec2 texCoords;
varying vec3 vFragPos;


void main() {
    float total = weights.x + weights.y + weights.z + weights.w;

    float normWeights = 1.0 / total; 

    mat4 skinMatrix =
        normWeights * weights.x * jointMatrices[int(joints.x)] +
        normWeights * weights.y * jointMatrices[int(joints.y)] + 
        normWeights * weights.z * jointMatrices[int(joints.z)] +
        normWeights * weights.w * jointMatrices[int(joints.w)];

    vec4 skinnedPosition = skinMatrix * vec4(position, 1.0);

    vFragPos = vec3(view * model * skinnedPosition);  

    vNormal = normalize(normalMatrix * normal);
    texCoords = textureCoords;

    gl_Position = projection * view * model * skinnedPosition;  
}
