
precision highp float;
varying vec2 texCoords;
uniform sampler2D textureSampler;
//out vec4 fragColor;
uniform bool isTextureEnabled;

void main() {

  if (!isTextureEnabled) {
      gl_FragColor = vec4(0.8, 0.57, 0.57, 1.0);
      return;
  }
    gl_FragColor =  texture2D(textureSampler, texCoords);
}