// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as THREE from "three";

import { FontManager } from "./FontManager";

class LabelMaterial extends THREE.RawShaderMaterial {
  constructor(atlasTexture: THREE.Texture) {
    const picking = false; //FIXME
    super({
      vertexShader: `\
#version 300 es
precision highp float;
precision highp int;
uniform mat4 projectionMatrix, modelViewMatrix, modelMatrix;

uniform float uScale;
uniform vec2 uCenter;
uniform vec2 uTextureSize;

in vec2 uv;
in vec2 position;
in vec2 instancePosition;
in vec2 instanceUvPosition;
in vec2 instanceSize;
out mediump vec2 vUv;
void main() {
  vUv = (instanceUvPosition + uv * instanceSize) / uTextureSize;
  vec2 vertexPos = (instancePosition + position * instanceSize) / uTextureSize * uScale;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPos, 0.0, 1.0);

  return;

  // Adapted from THREE.ShaderLib.sprite

  float rotation = 0.0;

  vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
  vec2 scale;
  scale.x = length(modelMatrix[0].xyz);
  scale.y = length(modelMatrix[1].xyz);
  // #ifndef USE_SIZEATTENUATION
  //   bool isPerspective = isPerspectiveMatrix( projectionMatrix );
  //   if ( isPerspective ) scale *= - mvPosition.z;
  // #endif
  vec2 alignedPosition = ( position.xy - ( uCenter - vec2( 0.5 ) ) ) * scale;
  vec2 rotatedPosition;
  rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
  rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
  mvPosition.xy += rotatedPosition;
  gl_Position = projectionMatrix * mvPosition;
}
`,
      fragmentShader: `\
#version 300 es
#ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
#else
  precision mediump float;
#endif
uniform sampler2D uMap;
uniform float uOpacity;
${picking ? "uniform vec4 objectId;" : ""}
uniform mediump vec3 uColor, uBackgroundColor;
in mediump vec2 vUv;
out vec4 outColor;

${THREE.ShaderChunk.encodings_pars_fragment /* for LinearTosRGB() */}

// From https://github.com/Jam3/three-bmfont-text/blob/e17efbe4e9392a83d4c5ee35c67eca5a11a13395/shaders/sdf.js
float aastep(float value) {
  float afwidth = length(vec2(dFdx(value), dFdy(value))) * 0.70710678118654757;
  return smoothstep(0.5 - afwidth, 0.5 + afwidth, value);
}

void main() {
  vec4 texColor = texture(uMap, vUv);
  vec4 color = vec4(uBackgroundColor.rgb * (1.0 - texColor.a) + uColor * texColor.a, uOpacity);
  outColor = LinearTosRGB(color);

  float alpha = aastep(texColor.a);
  outColor = LinearTosRGB(vec4(uColor, uOpacity * alpha));
  if (uOpacity * alpha < 0.001) {
    discard;
  }

  // outColor = vec4(1.0, 0.0, 0.0, 1.0);
  // outColor = texColor;

  ${picking ? "outColor = objectId;" : ""}
}
`,
      uniforms: {
        uCenter: { value: [0, 0] },
        uScale: { value: 5 },
        uTextureSize: { value: [atlasTexture.image.width, atlasTexture.image.height] },
        uMap: { value: atlasTexture },
        uOpacity: { value: 1 },
        uColor: { value: [1, 0, 0.5] },
        uBackgroundColor: { value: [0, 0, 0] },
      },

      side: THREE.DoubleSide,
    });
  }
}

export class Label extends THREE.Object3D {
  text = "";
  mesh: THREE.InstancedMesh;
  geometry: THREE.InstancedBufferGeometry;
  material: LabelMaterial;

  instanceAttributeData: Float32Array;
  instanceAttributeBuffer: THREE.InstancedInterleavedBuffer;

  constructor(public labelPool: LabelPool) {
    super();

    this.geometry = new THREE.InstancedBufferGeometry();
    this.geometry.index = new THREE.BufferAttribute(new Uint8Array([0, 1, 2, 2, 1, 3]), 1);

    //FIXME: share these with all labels in LabelPool?
    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array([0, 0, 0, 1, 1, 0, 1, 1]), 2),
    );
    this.geometry.setAttribute(
      "uv",
      new THREE.BufferAttribute(new Float32Array([0, 1, 0, 0, 1, 1, 1, 0]), 2),
    );

    this.instanceAttributeData = new Float32Array();
    this.instanceAttributeBuffer = new THREE.InstancedInterleavedBuffer(
      this.instanceAttributeData,
      6,
      1,
    );
    this.geometry.setAttribute(
      "instancePosition",
      new THREE.InterleavedBufferAttribute(this.instanceAttributeBuffer, 2, 0),
    );
    this.geometry.setAttribute(
      "instanceUvPosition",
      new THREE.InterleavedBufferAttribute(this.instanceAttributeBuffer, 2, 2),
    );
    this.geometry.setAttribute(
      "instanceSize",
      new THREE.InterleavedBufferAttribute(this.instanceAttributeBuffer, 2, 4),
    );

    this.material = new LabelMaterial(labelPool.atlasTexture);

    //FIXME: don't need InstancedMesh?
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, 0);

    this.add(this.mesh);
  }

  update(text?: string): void {
    if (text != undefined) {
      this.text = text;
      this.labelPool.update(text);
      this.material.uniforms.uTextureSize!.value[0] = this.labelPool.atlasTexture.image.width;
      this.material.uniforms.uTextureSize!.value[1] = this.labelPool.atlasTexture.image.height;
    }

    const layoutInfo = this.labelPool.fontManager.layout(this.text);

    this.geometry.instanceCount = this.mesh.count = layoutInfo.chars.length;

    const requiredLength = layoutInfo.chars.length * 6 * Float32Array.BYTES_PER_ELEMENT;
    if (this.instanceAttributeData.byteLength < requiredLength) {
      this.instanceAttributeBuffer.array = this.instanceAttributeData = new Float32Array(
        requiredLength,
      );
    }
    let i = 0;
    for (const char of layoutInfo.chars) {
      this.instanceAttributeData[i++] = char.x;
      this.instanceAttributeData[i++] = layoutInfo.height - char.y - char.height;
      this.instanceAttributeData[i++] = char.atlasX;
      this.instanceAttributeData[i++] = char.atlasY;
      this.instanceAttributeData[i++] = char.width;
      this.instanceAttributeData[i++] = char.height;
    }
    this.instanceAttributeBuffer.needsUpdate = true;
  }
}

export class LabelPool {
  atlasTexture: THREE.DataTexture;
  constructor(public fontManager: FontManager) {
    this.atlasTexture = new THREE.DataTexture(
      new Uint8ClampedArray(),
      0,
      0,
      THREE.RGBAFormat,
      THREE.UnsignedByteType,
      THREE.UVMapping,
      THREE.ClampToEdgeWrapping,
      THREE.ClampToEdgeWrapping,
      THREE.LinearFilter,
      THREE.LinearFilter,
    );
  }

  update(text: string): void {
    this.fontManager.update(text);

    //FIXME: THREE.AlphaFormat not working? :(
    const data = new Uint8ClampedArray(this.fontManager.atlasData.data.length * 4);
    for (let i = 0; i < this.fontManager.atlasData.data.length; i++) {
      data[i * 4 + 0] = data[i * 4 + 1] = data[i * 4 + 2] = 1;
      data[i * 4 + 3] = this.fontManager.atlasData.data[i]!;
    }

    this.atlasTexture.image = {
      data,
      width: this.fontManager.atlasData.width,
      height: this.fontManager.atlasData.height,
    };
    this.atlasTexture.needsUpdate = true;
  }

  acquire(): Label {
    return new Label(this);
  }
}
