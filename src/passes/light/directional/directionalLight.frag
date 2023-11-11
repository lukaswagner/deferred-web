#version 300 es
precision mediump float;

layout(location = 0) out vec4 fragColor;

const uint c_dataSize = DATA_SIZEu;

uniform data {
    vec4 dir[c_dataSize];
    vec4 color[c_dataSize];
} u_data;

uniform sampler2D u_position;
uniform sampler2D u_normal;
uniform sampler2D u_color;

in vec2 v_uv;

void main()
{
    vec3 normal = normalize(texture(u_normal, v_uv).xyz);

    vec3 light;
    for(uint i = 0u; i < c_dataSize; ++i) {
        vec3 dir = normalize(-u_data.dir[i].xyz);
        float diffuse = max(dot(dir, normal), 0.0);
        light += diffuse * u_data.color[i].rgb;
    }

    fragColor = vec4(light * texture(u_color, v_uv).rgb, 1);
}
