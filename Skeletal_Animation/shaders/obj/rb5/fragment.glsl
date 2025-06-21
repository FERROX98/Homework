precision highp float;

uniform sampler2D albedoMap;
uniform sampler2D normalTex;
uniform sampler2D metallicMap;
uniform sampler2D roughnessMap;
uniform sampler2D dispTex;
uniform sampler2D aoMap;

uniform vec4 dirLightColor;
uniform vec4 ambientLight;
uniform float ambientIntensity;
const float PI = 3.14159265359;

varying vec2 texCoords;
varying vec3 TangentLightPos;
varying vec3 TangentViewPos;
varying vec3 TangentFragPos;

const float minLayers = 10.0;
const float maxLayers = 10.0;
const float height_scale = 0.00001;

float rimEffect(vec3 normal, vec3 viewDir) {
  float rimDot = 1.0 - max(dot(viewDir, normal), 0.0);
  return pow(rimDot, 3.0);
}

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

  vec3 viewDir = vec3(TangentViewPos - TangentFragPos);
  vec3 lightDir = normalize(TangentLightPos - TangentFragPos);

  vec2 texCoordsDisp = texCoords; //ParallaxMapping(texCoords, viewDir);
  // if(texCoordsDisp.x > 1.0 || texCoordsDisp.y > 1.0 || texCoordsDisp.x < 0.0 || texCoordsDisp.y < 0.0) {
  //   gl_FragColor = vec4(0.0);
  //   return;
  // }

  vec3 albedo;
  vec3 normalMap;
  float metallic = 0.0; // metallic is not used in this shader
  float roughness;
  float ao = 1.0;

  // from RGBs to linear space
  //albedo = pow(texture2D(albedoMap, texCoordsDisp).rgb, vec3(2.2));
    albedo = pow(texture2D(albedoMap, texCoordsDisp).rgb, vec3(2.2));

  normalMap = texture2D(normalTex, texCoordsDisp).rgb;
  //metallic = texture2D(metallicMap, texCoordsDisp).r;
  roughness =  0.05527864098548889; //texture2D(roughnessMap, texCoordsDisp).r;
  //ao = texture2D(aoMap, texCoordsDisp).r; 

  normalMap = normalize(normalMap * 2.0 - 1.0);
  vec3 N = normalize(normalMap);
  vec3 V = normalize(viewDir);

  // metal
  vec3 F0 = vec3(0.04); 
  F0 = mix(F0, albedo, metallic);

  // Calcolo illuminazione
  vec3 Lo = vec3(0.0);

  // light direction
  vec3 L = normalize(lightDir);
  // half vector
  vec3 H = normalize(V + L);

  // constan (sun light)
  vec3 radiance = dirLightColor.rgb;        

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

  // soft shadow
  float NdotL = max(dot(N, L), 0.01);
  Lo += (kD * albedo / PI + specular) * radiance * NdotL;

  vec3 ambient = ambientIntensity * ambientLight.rgb * albedo * ao;
  vec3 color = ambient + Lo;

  // HDR tone mapping not needing any floating point framebuffer at all! However
  color = color / (color + vec3(1.0));

  // from linear to RGBs space 
  color = pow(color, vec3(1.0 / 2.2));

  // color *= 1.2;

  gl_FragColor = vec4(color, 1.0);
}
