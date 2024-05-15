#version 300 es
precision mediump float;

in vec2 a_basePosition;
in vec4 a_instancePosition;
in vec4 a_instanceColor;

uniform mat4 u_view;
uniform mat4 u_projection;
uniform vec2 u_ndcOffset;
uniform vec2 u_resolutionInverse;
uniform float u_aspectRatio;

out vec2 v_pos;
out vec4 v_color;

void main()
{
    vec4 pos = u_projection * u_view * vec4(a_instancePosition.xyz, 1);

    // todo - accurately calculate size
    float pointSize = a_instancePosition.w * 0.495;
    v_pos = a_basePosition * 2. - 1.;
    vec2 pointOffset = v_pos * vec2(pointSize, pointSize * u_aspectRatio) / pos.z;

    pos /= pos.w;
    pos.xy += pointOffset;
    pos.xy += u_ndcOffset * u_resolutionInverse * 2.;
    gl_Position = pos;

    v_color = a_instanceColor;
}
