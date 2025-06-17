precision highp float;
uniform sampler2D colorTex;
uniform sampler2D normalTex;
uniform sampler2D metalRoughTex;
uniform sampler2D emissionTex;
uniform bool isTextureEnabled;

uniform vec3 dirLightDir;
uniform vec3 dirLightColor;
uniform vec3 ambientLight;
uniform float ambientIntensity;

varying vec3 vNormal;
varying vec2 texCoords;
varying vec3 vFragPos;

void main() {
  vec3 baseColor = vec3(0.7, 0.7, 0.75); // Colore di default grigio chiaro
  vec3 normal = normalize(vNormal);
  float roughness = 0.6;
  float metallic = 0.0;
  
  // Prova a caricare le texture se disponibili
  if (isTextureEnabled) {
    vec4 colorSample = texture2D(colorTex, texCoords);
    if (colorSample.a > 0.0) { // Verifica che la texture sia valida
      baseColor = colorSample.rgb;
      
      // Normal map solo se la texture è valida
      vec3 normalSample = texture2D(normalTex, texCoords).rgb;
      if (length(normalSample) > 0.1) {
        vec3 normalMap = normalSample * 2.0 - 1.0;
        normal = normalize(vNormal + normalMap * 0.3);
      }
      
      // Roughness dalla texture se disponibile
      vec3 roughSample = texture2D(metalRoughTex, texCoords).rgb;
      if (length(roughSample) > 0.1) {
        roughness = roughSample.r; // Usa canale rosso per roughness
      }
    }
  }

  // Lighting semplificato e robusto con ombre più morbide
  vec3 dirLight = normalize(-dirLightDir);
  float diffFactor = max(dot(normal, dirLight), 0.0);
  
  // Wrapped lighting per ombre più naturali
  float wrappedDiff = max((dot(normal, dirLight) + 0.5) / 1.5, 0.2);
  
  // Luce diffusa più morbida
  vec3 diffuseDir = wrappedDiff * dirLightColor * baseColor * 0.7;
  
  // Luce ambientale più forte
  vec3 ambientTerm = ambientLight * ambientIntensity * baseColor * 0.9;
  
  // Aggiungi un termine di fill light
  vec3 fillLight = vec3(0.4, 0.45, 0.5) * 0.2 * baseColor;

  // Specular semplificato
  vec3 viewDir = normalize(-vFragPos);
  vec3 halfDir = normalize(dirLight + viewDir);
  float specAngle = max(dot(normal, halfDir), 0.0);
  float shininess = 8.0 * (1.0 - roughness);
  
  vec3 specular = pow(specAngle, shininess) * dirLightColor * 0.1;

  vec3 finalColor = ambientTerm + diffuseDir + fillLight + specular;
  
  // Clamp per evitare valori troppo alti
  finalColor = clamp(finalColor, 0.0, 1.0);
  
  gl_FragColor = vec4(finalColor, 1.0);
}