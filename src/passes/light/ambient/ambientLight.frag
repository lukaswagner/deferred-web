#version 300 es
precision mediump float;

layout(location = 0) out vec4 fragColor;

const uint c_dataSize = DATA_SIZEu;

uniform data {
    vec4 color[c_dataSize];
} u_data;

in vec2 v_uv;

void main()
{
#if ENABLED
    vec3 light;
    for(uint i = 0u; i < c_dataSize; ++i) {
        light += u_data.color[i].rgb * u_data.color[i].a;
    }

    fragColor = vec4(light, 1);
#else
    fragColor = vec4(0);
#endif
}
