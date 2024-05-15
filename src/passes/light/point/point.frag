#version 300 es
precision mediump float;

#define COLOR_LOCATION 0

layout(location = COLOR_LOCATION) out vec4 f_color;

in vec2 v_pos;
in vec4 v_color;

void main(void)
{
    float distSquared = dot(v_pos, v_pos);
    if(distSquared > 1.) discard;

    f_color = vec4(v_color.rgb * v_color.a, 1);
}
