#version 300 es
precision mediump float;

in vec2 a_basePosition;

out vec2 v_uv;

void main()
{
    gl_Position = vec4(a_basePosition * 2. - 1., 0.0, 1.0);
    v_uv = a_basePosition;
}
