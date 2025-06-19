precision highp float;
attribute vec3 position;
attribute vec2 textureCoords;
attribute vec3 normal; 
attribute vec3 tangent;
attribute vec3 bitangent;

uniform mat4 projection, view, model;
uniform mat3 normalMatrix;
uniform vec3 lightPosition; // La luce in world space!

varying vec2 texCoords;
varying vec3 vFragPos;
varying vec3 TangentLightPos;
varying vec3 TangentViewPos;
varying vec3 TangentFragPos;
varying vec3 WorldFragPos;

void main() {
    // Calcolo posizioni in diversi sistemi di coordinate
    vec4 worldPos = model * vec4(position, 1.0);
    vec3 worldPosition = vec3(worldPos); // Posizione in world space
    WorldFragPos = worldPosition; // Passa la posizione world al fragment
    
    // Vettori base in world space
    vec3 N = normalize(mat3(model) * normal);
    vec3 T = normalize(mat3(model) * tangent);
    
    // Ortogonalizzazione di Gram-Schmidt
    T = normalize(T - dot(T, N) * N);
    vec3 B = cross(N, T);
    
    // Matrice TBN world->tangent (T, B, N come righe)
    // Questo è il trasposto della matrice TBN standard (che ha T, B, N come colonne)
    mat3 TBN = mat3(
        vec3(T.x, B.x, N.x),
        vec3(T.y, B.y, N.y),
        vec3(T.z, B.z, N.z)
    );
    
    // Trasformazione della luce da world space a tangent space
    // Questo manterrà la luce fissa rispetto al mondo
    TangentLightPos = TBN * lightPosition;
    
    // Posizione del frammento in tangent space
    TangentFragPos = TBN * worldPosition;
    
    // TangentViewPos sarà calcolato nel fragment shader
    // perché non possiamo facilmente determinare la posizione dell'osservatore
    // in world space in WebGL 1 (senza inverse)
    
    texCoords = textureCoords;
    vFragPos = vec3(view * worldPos); // Per compatibilità con altro codice
    
    gl_Position = projection * view * worldPos;
}
