#version 300 es
precision mediump float;

#define COLOR_LOCATION 0

layout(location = COLOR_LOCATION) out vec4 f_color;

uniform sampler2D u_position;
uniform sampler2D u_normal;

in vec2 v_posOnSplat;
in vec4 v_color;
in vec4 v_centerRadius;
in vec2 v_uv;

// https://lisyarus.github.io/blog/posts/point-light-attenuation.html
float attenuate(float distance, float radius, float max_intensity, float falloff)
{
    float s = distance / radius;

    if (s >= 1.0)
        return 0.0;

    float s2 = s * s;
    float oms2 = 1. - s2;

    return max_intensity * oms2 * oms2 / (1. + falloff * s2);
}


void main(void)
{
    float distSquared = dot(v_posOnSplat, v_posOnSplat);
    if(distSquared > 1.) discard;

    vec4 pos = texture(u_position, v_uv);
    if(pos.w == 0.) discard;

    vec3 dir = v_centerRadius.xyz - pos.xyz;
    vec3 normal = normalize(texture(u_normal, v_uv).xyz);
    float dist = length(dir);
    float angle = max(dot(normalize(dir), normal), 0.0);
    float attenuation = attenuate(dist, v_centerRadius.w, v_color.a, 3.);

    f_color = vec4(v_color.rgb, angle * attenuation);
}
