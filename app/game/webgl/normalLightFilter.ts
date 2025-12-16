import { Filter, GlProgram, Texture } from "pixi.js";

/**
 * Pixi v8 custom filter that does basic 2D normal-map lighting on a sprite.
 *
 * Assumptions:
 * - Your normal map is in tangent space encoded as RGB in [0..1]
 * - (0.5, 0.5, 1.0) is "flat"
 * - Light is defined in the sprite's local pixel space (same units as sprite width/height)
 */
export function createNormalLightFilter(params: {
  normalMap: Texture;
  // initial values:
  lightPos?: { x: number; y: number };
  lightRadius?: number;   // pixels
  ambient?: number;       // 0..1
  diffuse?: number;       // 0..2
}) {
  const fragment = /* glsl */ `
    precision mediump float;

    in vec2 vTextureCoord;

    uniform sampler2D uTexture;      // the sprite's base texture (provided by Pixi)
    uniform sampler2D uNormalMap;    // our normal map

    // Uniform group (Pixi v8 "resources")
    uniform vec2  uLightPos;         // in local pixel space
    uniform float uLightRadius;      // pixels
    uniform float uAmbient;          // 0..1
    uniform float uDiffuse;          // 0..2
    uniform vec2  uSpriteSize;       // pixels (w,h)

    void main() {
      // base color
      vec4 base = texture2D(uTexture, vTextureCoord);

      // sample normal map and decode to [-1..1]
      vec3 n = texture2D(uNormalMap, vTextureCoord).rgb;
      n = normalize(n * 2.0 - 1.0);

      // convert UV -> local pixel coord
      vec2 fragPx = vTextureCoord * uSpriteSize;

      // light vector in plane (2D light coming “out of the screen” a bit)
      vec2 toL = uLightPos - fragPx;
      float dist = length(toL);

      // attenuation
      float att = clamp(1.0 - (dist / max(uLightRadius, 1.0)), 0.0, 1.0);
      att = att * att;

      // fake 3D light direction: (x,y, zBias)
      vec3 L = normalize(vec3(toL, uLightRadius * 0.35));

      // lambert
      float ndotl = max(dot(n, L), 0.0);

      float light = uAmbient + (uDiffuse * ndotl * att);

      vec3 lit = base.rgb * light;
      gl_FragColor = vec4(lit, base.a);
    }
  `;

  const vertex = /* glsl */ `
    precision mediump float;
    attribute vec2 aVertexPosition;
    attribute vec2 aTextureCoord;
    uniform mat3 projectionMatrix;
    out vec2 vTextureCoord;
    void main() {
      vTextureCoord = aTextureCoord;
      gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    }
  `;

  const filter = new Filter({
    glProgram: new GlProgram({ vertex, fragment }),
    resources: {
      // sampler2D binding: resource key must match shader uniform name
      uNormalMap: params.normalMap,

      // uniform group (you can name this whatever you want)
      lightUniforms: {
        uLightPos:    { value: [params.lightPos?.x ?? 0, params.lightPos?.y ?? 0], type: "vec2<f32>" },
        uLightRadius: { value: params.lightRadius ?? 220, type: "f32" },
        uAmbient:     { value: params.ambient ?? 0.35, type: "f32" },
        uDiffuse:     { value: params.diffuse ?? 1.10, type: "f32" },
        uSpriteSize:  { value: [1, 1], type: "vec2<f32>" }, // set after you know sprite size
      },
    },
  });

  return filter;
}
