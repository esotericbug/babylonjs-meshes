precision highp float;

uniform vec3 outlineColor;
uniform float outlineAlpha;

void main(void) {
    gl_FragColor = vec4(outlineColor, outlineAlpha);
}