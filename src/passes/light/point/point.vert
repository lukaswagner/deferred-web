#version 300 es
precision mediump float;

in vec3 a_basePosition;

uniform mat4 u_view;
uniform mat4 u_projection;
uniform vec2 u_ndcOffset;
uniform vec2 u_resolutionInverse;

out vec2 v_uv;

void main()
{
    vec4 pos = u_projection * u_view * vec4(a_basePosition, 1);
    pos /= pos.w;
    vec2 offset = u_ndcOffset * u_resolutionInverse * 2.;
    gl_Position = pos + vec4(offset, 0, 0);

    v_uv = a_basePosition.xy;
}
