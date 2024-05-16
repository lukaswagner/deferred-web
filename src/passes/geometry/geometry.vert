#version 300 es
precision mediump float;

in vec3 a_basePosition;
in vec3 a_baseNormal;
in vec3 a_baseColor;
in mat4 a_instanceMatrix;
in vec3 a_instanceColor;

uniform mat4 u_model;
uniform mat4 u_viewProjection;
uniform bool u_instanced;
uniform int u_colorMode;
uniform vec2 u_ndcOffset;
uniform vec2 u_resolutionInverse;

out vec4 v_worldPosition;
out vec4 v_worldNormal;
out vec4 v_viewPosition;
out vec4 v_viewNormal;
out vec3 v_color;

void main()
{
    v_worldPosition = vec4(a_basePosition, 1.0);
    v_worldNormal = vec4(a_baseNormal, 0.0);

    v_color = a_baseColor;

    if(u_instanced)
    {
        v_worldPosition = a_instanceMatrix * v_worldPosition;
        v_worldNormal = a_instanceMatrix * v_worldNormal;

        switch(u_colorMode) {
            case 0: // BaseOnly
                break;
            case 1: // InstanceOnly
                v_color = a_instanceColor;
                break;
            case 2: // Additive
                v_color += a_instanceColor;
                break;
            case 3: // Multiplicative
                v_color *= a_instanceColor;
                break;
            default:
                v_color = vec3(1, 0, 1);
                break;
        }
    }

    v_worldPosition = u_model * v_worldPosition;
    v_worldNormal = u_model * v_worldNormal;
    v_worldNormal = normalize(v_worldNormal);

    v_viewPosition = u_viewProjection * v_worldPosition;
    v_viewNormal = u_viewProjection * v_worldNormal;
    v_viewNormal = normalize(v_viewNormal);

    vec4 pos = v_viewPosition / v_viewPosition.w;
    vec2 offset = u_ndcOffset * u_resolutionInverse * 2.;
    gl_Position = pos + vec4(offset, 0, 0);
}
