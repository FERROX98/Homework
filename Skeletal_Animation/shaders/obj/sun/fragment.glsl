precision highp float;
uniform sampler2D colorTex;
uniform bool isTextureEnabled;
varying vec2 texCoords;


void main() {
  if (!isTextureEnabled) {
     gl_FragColor = vec4(0.69, 0.77, 0.09, 1.0);
  }
    
  vec3 baseColor = texture2D(colorTex, texCoords).rgb;
  vec3 color =  baseColor;
  gl_FragColor = vec4(color, 1.0);
}