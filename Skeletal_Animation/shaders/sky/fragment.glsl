precision mediump float;
varying vec2 v_uv;

void main() {
  vec3 topColor = vec3(0.62, 0.76, 0.82);   // sky blue
  vec3 bottomColor = vec3(0.42, 0.61, 0.9);  // slightly darker

  vec3 color = mix(bottomColor, topColor, v_uv.y);
  gl_FragColor = vec4(color, 1.0);
}
