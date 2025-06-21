precision highp float;
attribute vec3 position;
attribute vec2 textureCoords;
attribute vec3 normal; 
attribute vec3 tangent;
//attribute vec3 bitangent;

uniform mat4 projection, view, model;
uniform mat3 normalMatrix;
uniform vec3 lightPosition;

varying vec2 texCoords;
varying vec3 TangentLightPos;
varying vec3 TangentViewPos;
varying vec3 TangentFragPos;
attribute vec4 weights;
// for each vertes the index of which bones influence it
attribute vec4 joints; 


uniform mat4 jointMatrices[100];


void main() {
    float total = max(0.001, weights.x + weights.y + weights.z + weights.w);
    float normWeights = 1.0 / total; 

    mat4 skinMatrix = 
            normWeights * weights.x * jointMatrices[int(joints.x)] +
            normWeights * weights.y * jointMatrices[int(joints.y)] + 
            normWeights * weights.z * jointMatrices[int(joints.z)] +
            normWeights * weights.w * jointMatrices[int(joints.w)];
    

    texCoords = textureCoords;
    
    // from model to joint space
    vec4 skinnedPosition = skinMatrix * vec4(position, 1.0);

    // from joint to world space 
    vec4 vFragPosWorldSpace = model * skinnedPosition;

    // from world to view space
    vec3 vFragPosViewSpace = vec3(view * vFragPosWorldSpace);

    // from local to joint space
    vec4 skinnedNormal = normalize(skinMatrix * vec4(normal, 0.0));
    vec4 skinnedTangent = normalize(skinMatrix * vec4(tangent, 0.0));

    // from joint to view space
    vec3 N = normalize(normalMatrix * vec3(skinnedNormal));
    vec3 T = normalize(normalMatrix *vec3(skinnedTangent));
    
    T = normalize(T - dot(T, N) * N);
    vec3 B = normalize(cross(N, T));
    
    mat3 TBN = mat3(
        vec3(T.x, B.x, N.x),
        vec3(T.y, B.y, N.y),
        vec3(T.z, B.z, N.z)
    );
    
    // from view to tangent space
    TangentLightPos = TBN * lightPosition;
    
    // from view to tangent space
    TangentFragPos = TBN * vFragPosViewSpace;

    // in view space the camera is at origin
    TangentViewPos = TBN * vec3(0.0, 0.0, 0.0); 
    
    // from view to canonical view volume
    gl_Position = projection * view * vFragPosWorldSpace ;
}
 