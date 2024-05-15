#version 300 es
precision mediump float;

/* DEFINES START */
#define WORLD_POSITION_LOCATION 0
#define WORLD_NORMAL_LOCATION 1
#define VIEW_POSITION_LOCATION 2
#define VIEW_NORMAL_LOCATION 3
#define COLOR_LOCATION 4
/* DEFINES END */

layout(location = WORLD_POSITION_LOCATION) out vec4 f_worldPosition;
layout(location = WORLD_NORMAL_LOCATION) out vec4 f_worldNormal;
layout(location = VIEW_POSITION_LOCATION) out vec4 f_viewPosition;
layout(location = VIEW_NORMAL_LOCATION) out vec4 f_viewNormal;
layout(location = COLOR_LOCATION) out vec4 f_color;

in vec4 v_worldPosition;
in vec4 v_worldNormal;
in vec4 v_viewPosition;
in vec4 v_viewNormal;
in vec3 v_color;

void main(void)
{
    f_worldPosition = v_worldPosition;
    f_worldNormal = v_worldNormal;
    f_viewPosition = v_viewPosition;
    f_viewNormal = v_viewNormal;
    f_color = vec4(v_color, 1.0);
}
