precision mediump float;

layout(location = WORLD_POSITION_LOCATION) out vec4 f_worldPosition;
layout(location = WORLD_NORMAL_LOCATION) out vec4 f_worldNormal;
layout(location = COLOR_LOCATION) out vec4 f_color;

in vec3 v_position;
in vec3 v_normal;
in vec3 v_color;

void main(void)
{
    f_worldPosition = vec4(v_position, 1.0);
    f_worldNormal = vec4(v_normal, 1.0);
    f_color = vec4(v_color, 1.0);
}
