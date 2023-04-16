#version 300 es
precision mediump float;

in vec2 inPosition;
in float inAlive;

out float vAlive;

uniform float uPointSize;

void main() {
  // pass the inAlive value to the fragment shader
  vAlive = inAlive;

  gl_PointSize = uPointSize;
  gl_Position = vec4(inPosition, 0.0, 1.0);
}
