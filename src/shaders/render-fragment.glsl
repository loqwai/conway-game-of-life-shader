#version 300 es
precision mediump float;

in float vAlive;

out vec4 outColor;

void main() {
  outColor = vec4(vAlive, vAlive, vAlive, 1.0);
}