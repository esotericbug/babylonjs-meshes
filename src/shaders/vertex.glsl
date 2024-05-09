attribute vec3 position;
attribute vec3 normal;

uniform mat4 worldViewProjection;

varying vec3 vWorldPos;

void main() {
    vWorldPos = (worldViewProjection * vec4(position, 1.0)).xyz;
    gl_Position = worldViewProjection * vec4(position, 1.0);
}