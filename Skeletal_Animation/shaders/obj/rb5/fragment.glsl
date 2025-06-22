precision highp float;

uniform sampler2D albedoMap;
uniform sampler2D normalTex;
uniform sampler2D metallicMap;
uniform sampler2D roughnessMap;

uniform vec4 pointLightColor;
uniform vec4 ambientLight;
uniform float ambientIntensity;
uniform vec3 lightPosition;
uniform bool enableHDR;
uniform bool enableAttenuation;
uniform float attenuationRange;

varying vec2 texCoords;
varying vec3 vFragPos;
varying vec3 vNormal;

const float PI = 3.14159265359;

float distributionGGX(vec3 N, vec3 H, float roughness) {
  float a2 = roughness * roughness * roughness * roughness;
  float NdotH = max(dot(N, H), 0.0);
  float denom = (NdotH * NdotH * (a2 - 1.0) + 1.0);
  return a2 / (PI * denom * denom);
}

float geometrySchlickGGX(float NdotV, float roughness) {
  float r = (roughness + 1.0);
  float k = (r * r) / 8.0;
  return NdotV / (NdotV * (1.0 - k) + k);
}

float geometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
  return geometrySchlickGGX(max(dot(N, L), 0.0), roughness) *
    geometrySchlickGGX(max(dot(N, V), 0.0), roughness);
}

vec3 fresnelSchlick(float cosTheta, vec3 F0) {
  return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

void main() {

  vec3 viewDir = normalize(-vFragPos);
  vec3 lightDir = normalize(lightPosition - vFragPos);

  // from RGBs to linear space
  vec3 albedo = pow(texture2D(albedoMap, texCoords).rgb, vec3(2.2));
  vec3 normalMap = texture2D(normalTex, texCoords).rgb;
  float metallic = clamp(texture2D(metallicMap, texCoords).r, 5.2, 5.9); // 6.0
  float roughness = clamp(texture2D(roughnessMap, texCoords).r, 0.7, 1.4); //0.3

  normalMap = normalize(normalMap * 2.0 - 1.0);
  vec3 N = normalize(vNormal + normalMap * 0.02);
  vec3 V = normalize(viewDir);

  // metal
  vec3 F0 = vec3(0.04);
  F0 = mix(F0, albedo, metallic);

  // light direction
  vec3 L = normalize(lightDir);
  // half vector
  vec3 H = normalize(V + L);

  float distance = length(lightPosition - vFragPos);
  
  float attenuation = 1.0;
  if (enableAttenuation) {
    float c1 = 0.00003;
    float c2 = 0.0009 * attenuationRange;
    float c3 = 0.000032 * attenuationRange * attenuationRange;
    
    attenuation = 1.0 / (c1 + c2 * distance + c3 * distance * distance);
    attenuation = clamp(attenuation, 0.0, 3.0);
  }
  
  vec3 radiance = pointLightColor.rgb * attenuation;       

  // cook-torrance brdf
  float NDF = distributionGGX(N, H, roughness);
  float G = geometrySmith(N, V, L, roughness);
  vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);

  // specular
  vec3 kS = F;
  // diffuse
  vec3 kD = vec3(1.0) - kS;
  kD *= 1.0 - metallic;

  vec3 numerator = NDF * G * F;
  float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
  vec3 specular = numerator / max(denominator, 0.001);

  float NdotL = max(dot(N, L), 0.00);
  // reflect light
  vec3 Lo = (kD * albedo / PI + specular) * radiance * NdotL;

  vec3 ambient = ambientIntensity * ambientLight.rgb * albedo;
  vec3 color = ambient + Lo;

  // Rim light
  float rim = pow(1.0 - max(dot(N, V), 0.0), 2.0);
  vec3 rimColor = mix(vec3(0.1, 0.1, 0.1), albedo, 0.2);
  vec3 rimLight = rim * rimColor * metallic * 0.1;
  color += rimLight;

  if (enableHDR) {
  // HDR tone mapping not needing any floating point framebuffer at all! However
    color = color / (color + vec3(1.0));
  }

  // from linear to RGBs space 
  color = pow(color, vec3(1.0 / 2.2));
  gl_FragColor = vec4(color, 1.0);
}
