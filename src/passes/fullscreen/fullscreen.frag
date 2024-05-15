#version 300 es
precision mediump float;

#define COLOR_LOCATION 0

layout(location = COLOR_LOCATION) out vec4 f_color;

in vec2 v_uv;

void main(void)
{
    f_color = vec4(v_uv, 0.0, 1.0);
}
