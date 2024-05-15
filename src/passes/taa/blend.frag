#version 300 es
precision mediump float;

#define COLOR_LOCATION 0

layout(location = COLOR_LOCATION) out vec4 f_color;

in vec2 v_uv;

uniform sampler2D u_input;
uniform float u_alpha;

void main(void)
{
    f_color = texture(u_input, v_uv);
    f_color.a *= u_alpha;
}
