precision highp float;
uniform sampler2D colorTex;
uniform sampler2D normalTex;
uniform sampler2D metalRoughTex;
uniform bool isTextureEnabled;

uniform vec4 dirLightDir;
uniform vec4 dirLightColor;
uniform vec4 ambientLight;
uniform float ambientIntensity;
uniform vec3 lightPosition;

varying vec3 vNormal;
varying vec2 texCoords;
varying vec3 vFragPos;

void main() {
  if (!isTextureEnabled) {
      gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
  }
   
  // RGBS  
  vec3 baseColor = texture2D(colorTex, texCoords).rgb; 
  //  no SRGB 
  vec3 metalRough = texture2D(metalRoughTex, texCoords).rgb;
  
  // TODO compute tangent and bitangent to brign texture into view 
  //vec3 normalMap =  texture2D(normalTex, texCoords).rgb* 2.0 - 1.0;
  //vec3 normal = normalize(vNormal + normalMap * 0.4);
  vec3 to_light = normalize(lightPosition - vFragPos);
  float d = length(to_light);
  float attenuation = 1.0 / (1.0+ 0.19 * d + 0.032 * d * d);

  vec3 normal = normalize(vNormal);
  // GLTF standard PBR material
  float metal = metalRough.b;
  float rough = metalRough.g;

  vec3 dirLight = normalize(-dirLightDir.xyz);

  vec3 viewDir = normalize(-vFragPos);
  vec3 halfDir = normalize(dirLight + viewDir);

  float cosTheta = max(dot(normal, dirLight), 0.1);
  
  // Diffuse term
  vec3 diffuseTerm =  baseColor.rgb * cosTheta; 

  float cosPhi =  max(0.0,dot(halfDir, normal));

  float shininess =  clamp(2.0 * (1.0 - rough), 1.0, 64.0);
  
  // metal indica quanto è metallo 
  // 0.04 per materiali non metallici
  vec3 F0 = mix(vec3(0.04), baseColor.rgb, metal);
 
  // Specular term
  vec3 specularTerm = pow(cosPhi, shininess) * dirLightColor.rgb * F0;
  
  vec4 ambientTerm = ambientLight* ambientIntensity; 
  gl_FragColor = attenuation * (ambientTerm + vec4(diffuseTerm,1.0) + vec4(specularTerm,1.0));

}