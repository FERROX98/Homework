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
  if (!isTextureEnabled) {
    vec3 wallColor = vec3(0.6, 0.6, 0.65);
    gl_FragColor = vec4(wallColor,1.0);
    return;
  }

  vec3 baseColor = texture2D(colorTex, texCoords).rgb;
  vec3 normalMap = texture2D(normalTex, texCoords).rgb * 2.0 - 1.0;
  vec3 metalRough = texture2D(metalRoughTex, texCoords).rgb;
  vec3 emission = texture2D(emissionTex, texCoords).rgb;

  // GLTF standard PBR material
  float metal = metalRough.b;
  float rough = metalRough.g;

  vec3 normal = normalize(vNormal + normalMap * 0.2);

  vec3 dirLight = normalize(-dirLightDir);
  float cosTheta = max(dot(normal, dirLight), 0.0);
  vec3 diffuseDir = cosTheta * dirLightColor;

  vec3 ambient = ambientLight * ambientIntensity; 
  vec3 lighting = ambient + diffuseDir * baseColor;

  vec3 viewDir = normalize( - vFragPos);
  vec3 halfDir = normalize(dirLight + viewDir);
  float cosPhi =  max(dot(normal, halfDir), 0.0);

  float spec = pow(cosPhi, 16.0 * (1.0 - rough));
  
  // Materiali dielettrici
  vec3 specular = spec * mix(vec3(0.04), baseColor, metal) * dirLightColor;

  vec3 color = lighting + specular + emission;

  gl_FragColor = vec4(color, 1.0); 
}