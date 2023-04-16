#version 300 es
precision highp float;

uniform sampler2D cellStates;
uniform float resolutionX;
uniform float resolutionY;

in vec2 inPosition;

out vec4 vColor;

void main() {
    vec2 texPosition = (inPosition + 1.0) / 2.0;

    float x = texPosition.x;
    float y = texPosition.y;
    float dx = resolutionX;
    float dy = resolutionY;

    float current = texture(cellStates, texPosition).r;

    float up = texture(cellStates, vec2(x, y + dy)).r;
    float down = texture(cellStates, vec2(x, y - dy)).r;
    float left = texture(cellStates, vec2(x - dx, y)).r;
    float right = texture(cellStates, vec2(x + dx, y)).r;

    float upLeft = texture(cellStates, vec2(x - dx, y + dy)).r;
    float upRight = texture(cellStates, vec2(x + dx, y + dy)).r;
    float downLeft = texture(cellStates, vec2(x - dx, y - dy)).r;
    float downRight = texture(cellStates, vec2(x + dx, y - dy)).r;

    float sum = up + down + left + right + upLeft + upRight + downLeft + downRight;

    if (current == 1.0) {
        if (sum < 2.0 || 3.0 < sum) {
            vColor = vec4(0.0);
        } else {
            vColor = vec4(1.0);
        }
    } else {
        if (sum == 3.0) {
            vColor = vec4(1.0);
        } else {
            vColor = vec4(0.0);
        }
    }


    gl_PointSize = 1.0;
    gl_Position = vec4(inPosition, 0.0, 1.0);
}
