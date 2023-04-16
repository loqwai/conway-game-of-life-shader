#version 300 es
precision highp float;

in vec2 inPosition;
in float inAlive;

out vec2 outPosition;
out float outAlive;

void main() {
    gl_PointSize = 30.0;
    gl_Position = vec4(inPosition, 0.0, 1.0);

    outPosition = inPosition;
    outAlive = inAlive;
}
