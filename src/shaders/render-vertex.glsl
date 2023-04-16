#version 300 es
precision highp float;

in vec2 inPosition;
in vec2 inTexCoord;

out vec2 vTexCoord;

void main() {
  gl_PointSize = 10.0;
  gl_Position = vec4(inPosition, 0.0, 1.0);

  vTexCoord = inTexCoord;
}
