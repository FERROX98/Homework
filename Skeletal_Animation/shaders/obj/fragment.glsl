#version 300 es
precision highp float;
in vec3 vNormal;
in vec2 vUv;
in vec3 vFragPos;
uniform sampler2D colorTex;
uniform sampler2D normalTex;
uniform sampler2D metalRoughTex;
uniform sampler2D emissionTex;
uniform vec3 lightPos;
uniform vec3 lightColor;
uniform vec3 dirLightDir; // directional light direction
uniform vec3 dirLightColor; // directional light color
out vec4 fragColor;
void main() {
    vec3 baseColor = texture(colorTex, vUv).rgb;
    vec3 normalMap = texture(normalTex, vUv).rgb * 2.0f - 1.0f;
    float metal = texture(metalRoughTex, vUv).b;
    float rough = texture(metalRoughTex, vUv).g;
    vec3 emission = texture(emissionTex, vUv).rgb;
    vec3 n = normalize(vNormal + normalMap * 0.5f);
        // Point light
    vec3 fragPosition = vFragPos;
    vec3 lightDir = normalize(lightPos - fragPosition);
    float distance = length(lightPos - fragPosition);
    float attenuation = 1.0f / (1.0f + 0.09f * distance + 0.032f * distance * distance);
    float diffPoint = max(dot(n, lightDir), 0.0f);
    vec3 pointLight = baseColor * diffPoint * (1.0f - metal) * lightColor * attenuation;
        // Directional light
    float diffDir = max(dot(n, normalize(-dirLightDir)), 0.0f);
    vec3 dirLight = baseColor * diffDir * (1.0f - metal) * dirLightColor;
    vec3 color = pointLight + dirLight + emission;
    color = mix(color, vec3(0.04f), metal); // simple metalness
      //  color = mix(color, vec3(1.0), 0.15); // subtle ambient
        //color = pow(color, vec3(1.0/2.2)); // gamma correction
    fragColor = vec4(color, 1.0f);
}