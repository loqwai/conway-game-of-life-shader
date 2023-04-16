#version 300 es
precision highp float;

in vec2 inPosition;

out vec2 vPosition;

void main() {
    vPosition = inPosition;
    gl_Position = vec4(inPosition, 0.0, 1.0);
}
