#version 300 es
precision mediump float;

/* DEFINES START */
#define COLOR_LOCATION 0
/* DEFINES END */

layout(location = COLOR_LOCATION) out vec4 f_color;

uniform sampler2D u_ambient;
uniform sampler2D u_directional;
uniform sampler2D u_color;

in vec2 v_uv;

void main()
{
    vec3 ambient = texture(u_ambient, v_uv).rgb;
    vec3 directional = texture(u_directional, v_uv).rgb;
    vec3 color = texture(u_color, v_uv).rgb;
    f_color = vec4((ambient + directional) * color, 1);
}
