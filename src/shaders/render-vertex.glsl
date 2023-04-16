#version 300 es
precision highp float;

in vec2 inPosition;

uniform float uPointSize;

void main() {
  gl_PointSize = uPointSize;
  gl_Position = vec4(inPosition, 0.0, 1.0);
}
