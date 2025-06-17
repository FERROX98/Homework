precision highp float;
uniform sampler2D colorTex;
uniform sampler2D normalTex;
uniform sampler2D metalRoughTex;
uniform bool isTextureEnabled;

uniform vec3 dirLightDir;
uniform vec4 dirLightColor;
uniform vec4 ambientLight;
uniform float ambientIntensity;

varying vec3 vNormal;
varying vec2 texCoords;
varying vec3 vFragPos;

void main() {
  if (!isTextureEnabled) {
      gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
  }
  
  
vec3 baseColor = pow(texture2D(colorTex, texCoords).rgb, vec3(2.2));
  //baseColor.a = 1.0;
  vec3 metalRough = texture2D(metalRoughTex, texCoords).rgb;
  vec3 normalMap = texture2D(normalTex, texCoords).rgb * 2.0 - 1.0;
  vec3 normal = normalize(vNormal + normalMap * 0.4);

  // GLTF standard PBR material
  float metal = metalRough.b;
  float rough = metalRough.g;

  vec3 dirLight = normalize(dirLightDir);
//vec3 dirLight = normalize(vec3(0.5, 1.0, 0.3)); 

  vec3 viewDir = normalize(-vFragPos);
  vec3 halfDir = normalize(dirLight + viewDir);

float cosTheta = max(dot(normal, dirLight), 0.05); // soft floor
  // Diffuse term
  vec3 diffuseTerm =  baseColor.rgb * cosTheta; 
  
  float cosPhi =  max(0.0,dot(halfDir, normal));


  float shininess =  clamp(16.0 * (1.0 - rough), 1.0, 64.0);
  vec3 F0 = mix(vec3(0.04), baseColor.rgb, metal);
  // Specular term
  vec3 specularTerm = pow(cosPhi, shininess) * dirLightColor.rgb * F0;
  
  //vec3 specularTerm = pow(cosPhi, shininess) * dirLightColor.rgb; 
  // Ambient term
  vec4 ambientTerm = ambientLight* ambientIntensity;
  gl_FragColor = ambientTerm + vec4(diffuseTerm,1.0) + vec4(specularTerm,1.0);

}