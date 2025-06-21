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

void main() {

    // from model to world space
    vec4 worldPos = model * vec4(position, 1.0);
    //from world to view space
    vec3 viewPos = vec3(view * worldPos);

    // from model to view space
    vec3 N = normalize(mat3(normalMatrix) * normal);
    vec3 T = normalize(mat3(normalMatrix) * tangent);
    
    T = normalize(T - dot(T, N) * N);
    vec3 B = cross(N, T);
    
    mat3 TBN = mat3(
        vec3(T.x, B.x, N.x),
        vec3(T.y, B.y, N.y),
        vec3(T.z, B.z, N.z)
    );
    
    // from view to tangent space
    TangentLightPos = TBN * lightPosition;
    
    // from view to tangent space
    TangentFragPos = TBN * viewPos;

    // in view space the camera is at origin
    TangentViewPos = TBN * vec3(0.0, 0.0, 0.0); 
    
    texCoords = textureCoords;
    
    gl_Position = projection * view * worldPos;
}
