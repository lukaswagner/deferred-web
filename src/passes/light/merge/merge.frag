#version 300 es
precision mediump float;

layout(location = 0) out vec4 fragColor;

uniform sampler2D u_ambient;
uniform sampler2D u_directional;
uniform sampler2D u_color;

in vec2 v_uv;

void main()
{
    vec3 ambient = texture(u_ambient, v_uv).rgb;
    vec3 directional = texture(u_directional, v_uv).rgb;
    vec3 color = texture(u_color, v_uv).rgb;
    fragColor = vec4((ambient + directional) * color, 1);
}
