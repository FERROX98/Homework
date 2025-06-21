precision highp float;
uniform sampler2D albedoMap;
uniform bool isTextureEnabled;
varying vec2 texCoords;

void main() {
  vec3 baseColor = texture2D(albedoMap, texCoords).rgb;  
  gl_FragColor = vec4(baseColor, 1.0);
}