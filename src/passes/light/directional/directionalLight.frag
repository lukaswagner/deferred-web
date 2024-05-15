#version 300 es
precision mediump float;

#define DATA_SIZE 1u
#define ENABLED 0

layout(location = 0) out vec4 f_color;

const uint c_dataSize = DATA_SIZE;

uniform data {
    vec4 dir[c_dataSize];
    vec4 color[c_dataSize];
} u_data;

uniform sampler2D u_normal;

in vec2 v_uv;

void main()
{
#if ENABLED
    vec3 normal = normalize(texture(u_normal, v_uv).xyz);

    vec3 light;
    for(uint i = 0u; i < c_dataSize; ++i) {
        vec3 dir = normalize(-u_data.dir[i].xyz);
        float diffuse = max(dot(dir, normal), 0.0);
        light += diffuse * u_data.color[i].rgb * u_data.color[i].a;
    }

    f_color = vec4(light, 1);
#else
    f_color = vec4(0);
#endif
}
