precision mediump float;
varying vec2 vpos;

void main() {
  vec3 topColor = vec3(0.62, 0.76, 0.82);
  vec3 bottomColor = vec3(0.42, 0.61, 0.9);

  vec3 color = mix(bottomColor, topColor, vpos.y);
  gl_FragColor = vec4(color, 1.0);
}
