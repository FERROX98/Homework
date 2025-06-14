precision highp float;
precision highp int;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 textureCoords;
attribute vec4 weights;
attribute vec4 joints;

uniform mat4 jointMatrices[100];
uniform mat4 projection, view, model;

varying vec3 vNormal;
varying vec2 texCoords;
varying vec3 vFragPos;

// mat4 boneTransform() {

//   mat4 ret;

//   // Weight normalization factor
//   float normfac = 1.0 / (aSWeights.x + aSWeights.y);

//   // Weight1 * Bone1 + Weight2 * Bone2
//   ret = normfac * aSWeights.y * uBones[int(aSIndices.y)]
//       + normfac * aSWeights.x * uBones[int(aSIndices.x)];

//   return ret;
// }
void main() {
    //  NORMALIZZAZIONE PESI
   float total = weights.x + weights.y + weights.z + weights.w;

    vec4 normWeights = total  > 0.0 ? weights / total :  weights; 

    mat4 skinMatrix =
        weights.x * jointMatrices[int(joints.x)] +
        weights.y * jointMatrices[int(joints.y)]
        + weights.z * jointMatrices[int(joints.z)] +
        weights.w * jointMatrices[int(joints.w)];

    vec4 skinnedPosition = skinMatrix * vec4(position, 1.0);
    gl_Position = projection * view * model * skinnedPosition;  
    vFragPos = vec3(model * skinnedPosition);   
    vNormal = normalize(mat3(model) * normal);
    texCoords = textureCoords;

}
