#version 300 es
precision mediump float;

in vec2 inPosition;
in float inAlive;

out float outAlive;

void main() {
    outAlive = inAlive + inPosition.x;
}
