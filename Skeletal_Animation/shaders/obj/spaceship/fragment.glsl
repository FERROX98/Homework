precision highp float;

varying vec3 vNormal;
varying vec2 texCoords;

uniform sampler2D colorTex;
uniform sampler2D normalTex;
uniform sampler2D metalRoughTex;
uniform sampler2D emissionTex;
uniform bool isTextureEnabled;

uniform vec3 lightPos;
uniform vec3 lightColor;
uniform vec3 dirLightDir;
uniform vec3 dirLightColor;

void main() {
  if (!isTextureEnabled) {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    return;
  }

  vec3 baseColor = texture2D(colorTex, texCoords).rgb;
  vec3 normalMap = texture2D(normalTex, texCoords).rgb * 2.0 - 1.0;
  vec3 metalRough = texture2D(metalRoughTex, texCoords).rgb;
  vec3 emission = texture2D(emissionTex, texCoords).rgb;

  float metal = metalRough.b;
  float rough = metalRough.g;

  vec3 normal = normalize(vNormal); // View space or world space normal

  // Point light
  vec3 fragPos = vec3(0.0); // if you have vFragPos, use it
  vec3 lightDir = normalize(lightPos - fragPos);
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = diff * lightColor;

  // Directional light
  vec3 dirLight = normalize(-dirLightDir);
  float diffDir = max(dot(normal, dirLight), 0.0);
  vec3 diffuseDir = diffDir * dirLightColor;

  // Combine
  vec3 lighting = (diffuse + diffuseDir) * baseColor;

  // Optional: fake specular
  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(normal, halfDir), 0.0), 32.0 * (1.0 - rough));
  vec3 specular = spec * mix(vec3(0.04), baseColor, metal);

  vec3 color = lighting + specular + emission;

  gl_FragColor = vec4(color, 1.0);
}
