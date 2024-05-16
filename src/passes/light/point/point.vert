#version 300 es
precision mediump float;

in vec2 a_basePosition;
in vec4 a_instancePosition;
in vec4 a_instanceColor;

uniform mat4 u_viewProjection;
uniform mat4 u_viewInverse;
uniform vec2 u_ndcOffset;
uniform vec2 u_resolutionInverse;

out vec2 v_pos;
out vec4 v_color;

void main()
{
    vec4 pos = vec4(a_instancePosition.xyz, 1);

    vec3 up = normalize(u_viewInverse[0].xyz);
    vec3 upOffset = mix(-up, up, a_basePosition.y) * 0.5;
    vec3 right = normalize(u_viewInverse[1].xyz);
    vec3 rightOffset = mix(-right, right, a_basePosition.x) * 0.5;
    pos.xyz += (rightOffset + upOffset) * a_instancePosition.w;

    pos = u_viewProjection * pos;

    pos /= pos.w;
    pos.xy += u_ndcOffset * u_resolutionInverse * 2.;
    gl_Position = pos;

    v_pos = a_basePosition * 2. - 1.;
    v_color = a_instanceColor;
}
