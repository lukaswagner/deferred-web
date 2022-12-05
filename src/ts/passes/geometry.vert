precision mediump float;

in vec3 a_basePosition;
in vec3 a_baseNormal;
in vec3 a_baseColor;
in mat4 a_instanceMatrix;
in vec3 a_instanceColor;

uniform mat4 u_viewProjection;

out vec3 v_position;
out vec3 v_normal;
out vec3 v_color;

void main()
{
    v_position = a_basePosition;
    v_normal = a_baseNormal;
    v_color = a_baseColor + a_instanceColor;

    gl_Position = u_viewProjection * a_instanceMatrix * vec4(v_position, 1.0);
}
