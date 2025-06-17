precision highp float;
uniform sampler2D colorTex;
uniform bool isTextureEnabled;
varying vec2 texCoords;

void main() {
  vec3 baseColor;
  
  if (isTextureEnabled) {
    baseColor = texture2D(colorTex, texCoords).rgb;
  } else {
    baseColor = vec3(1.0, 0.9, 0.3); 
  }
  
  vec3 finalColor = baseColor;
  
  gl_FragColor = vec4(finalColor, 1.0);
}