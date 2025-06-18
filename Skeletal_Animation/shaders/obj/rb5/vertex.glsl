precision highp float;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 textureCoords;
attribute vec4 weights;
attribute vec4 joints;

uniform mat4 jointMatrices[100];
uniform mat4 projection, view, model;
uniform mat3 normalMatrix;


varying vec2 texCoords;
varying vec3 vFragPos;
varying vec3 vNormal;


void main() {
    float total = weights.x + weights.y + weights.z + weights.w;

    float normWeights = 1.0 / total; 

    mat4 skinMatrix =
        normWeights * weights.x  *jointMatrices[int(joints.x)] +
        normWeights * weights.y  *jointMatrices[int(joints.y)] + 
        normWeights * weights.z  * jointMatrices[int(joints.z)]+
        normWeights * weights.w  *jointMatrices[int(joints.w)];

    // joint space 
    vec4 skinnedPosition = skinMatrix * vec4(position, 1.0);

    texCoords = textureCoords;

    vec4 vFragPosWorldSpace = model * skinnedPosition;
    vec4 vFragPosViewSpace = view * vFragPosWorldSpace;
    vFragPos = vFragPosViewSpace.xyz;  
    vNormal = normalize(normalMatrix * normalize(skinMatrix * vec4(normal, 0.0)).xyz); 
    gl_Position = projection * vFragPosViewSpace;  

}
