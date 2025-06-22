precision mediump float;
varying vec2 vpos;

void main() {
  vec3 topColor = vec3(0.43, 0.58, 0.65);
  vec3 bottomColor = vec3(0.36, 0.53, 0.78);

  vec3 color = mix(bottomColor, topColor, vpos.y);
  gl_FragColor = vec4(color, 1.0);
}
