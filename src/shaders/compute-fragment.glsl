#version 300 es
precision highp float;

out vec4 outColor;
in vec2 vPosition;

void main() {
  outColor = vec4(vPosition.x, vPosition.y, 1.0, 1.0);
}