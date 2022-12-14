precision mediump float;

layout(location = 0) out vec4 fragColor;

uniform vec3 u_data;
uniform sampler2D u_position;
uniform sampler2D u_normal;
uniform sampler2D u_color;

in vec2 v_uv;

void main()
{
    vec3 normal = normalize(texture(u_normal, v_uv).xyz);
    vec3 light = normalize(-u_data);

    float diffuse = max(dot(light, normal), 0.0);

    fragColor = vec4(diffuse * texture(u_color, v_uv).rgb, 1);
}
