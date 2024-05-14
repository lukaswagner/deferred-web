#version 300 es
precision mediump float;

layout(location = 0) out vec4 fragColor;

const uint c_dataSize = DATA_SIZEu;

uniform data {
    vec4 color[c_dataSize];
} u_data;

uniform sampler2D u_position;
uniform sampler2D u_normal;
uniform sampler2D u_color;

in vec2 v_uv;

void main()
{
#if ENABLED
    vec3 light;
    for(uint i = 0u; i < c_dataSize; ++i) {
        light += u_data.color[i].rgb * u_data.color[i].a;
    }

    fragColor = vec4(light * texture(u_color, v_uv).rgb, 1);
#else
    fragColor = vec4(0);
#endif
}
