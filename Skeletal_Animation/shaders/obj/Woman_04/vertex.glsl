precision highp float;
precision highp int;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 textureCoords;
attribute vec4 weights;
attribute vec4 joints; // se in float nel JS, va bene così

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
   // if (total < 1e-5) total = 1.0; // fallback per evitare NaN
    vec4 normWeights = total  > 0.0 ? weights / total :  weights; 

    // Skinning con pesi normalizzati
    mat4 skin = 
        normWeights.x * jointMatrices[int(joints.x)] +
        normWeights.y * jointMatrices[int(joints.y)] +
        normWeights.z * jointMatrices[int(joints.z)] +
        normWeights.w * jointMatrices[int(joints.w)];

    mat4 modelSkin = model * skin;
   // modelSkin = model; 
    vNormal = mat3(modelSkin) * normal; // già sufficiente per WebGL 1.0
    //vNormal =  normalize(mat3(model) * normal); // per WebGL 2.0, normalizzazione esplicita
    texCoords = textureCoords; 
    vFragPos = (modelSkin * vec4(position, 1.0)).xyz;
    gl_Position = projection * view * modelSkin * vec4(position, 1.0);

}
