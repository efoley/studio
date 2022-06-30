// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as THREE from "three";
import createText, { type BMFontTextGeometry } from "three-bmfont-text";

import type { Renderer } from "../../Renderer";
import { SRGBToLinear } from "../../color";
import { Marker } from "../../ros";
import { RenderableMarker } from "./RenderableMarker";

export class RenderableTextViewFacing extends RenderableMarker {
  textGeometry: BMFontTextGeometry;
  textMaterial: TextMaterial;
  text: THREE.Mesh;

  constructor(topic: string, marker: Marker, receiveTime: bigint | undefined, renderer: Renderer) {
    super(topic, marker, receiveTime, renderer);

    this.textGeometry = createText({ flipY: false, font: renderer.fontData });
    this.textMaterial = new TextMaterial({ map: renderer.fontTexture });
    this.text = new THREE.Mesh(this.textGeometry, this.textMaterial);

    this.add(this.text);
    this.update(marker, receiveTime);
  }

  override dispose(): void {
    this.textGeometry.dispose();
    this.textMaterial.dispose();
  }

  override update(marker: Marker, receiveTime: bigint | undefined): void {
    super.update(marker, receiveTime);

    this.textGeometry.update({ text: marker.text });
    this.textMaterial.update(
      marker,
      this.textGeometry.layout.width,
      this.textGeometry.layout.height,
    );

    const scale = marker.scale.z / this.renderer.fontData.common.lineHeight;
    this.text.scale.setScalar(scale);
    this.text.userData.pose = marker.pose;
  }
}

class TextMaterial extends THREE.RawShaderMaterial {
  private static DARK_BACKGROUND = [0, 0, 0];
  private static LIGHT_BACKGROUND = [1, 1, 1];
  constructor({ picking = false, map }: { picking?: boolean; map: THREE.Texture }) {
    super({
      vertexShader: `\
        #version 300 es
        precision highp float;
        precision highp int;
        uniform mat4 projectionMatrix, modelViewMatrix, modelMatrix;

        uniform vec2 uCenter;

        in vec2 uv;
        in vec4 position;
        out mediump vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * position;

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

        void main() {
          vec4 texColor = texture(uMap, vUv);
          vec4 color = vec4(uBackgroundColor.rgb * (1.0 - texColor.a) + uColor * texColor.a, uOpacity);
          outColor = LinearTosRGB(color);

          ${picking ? "outColor = objectId;" : ""}
        }
      `,
      side: THREE.DoubleSide,
    });
    this.uniforms = {
      uColor: { value: [0, 0, 0] },
      uCenter: { value: [0, 0] },
      uBackgroundColor: { value: [0, 0, 0] },
      uOpacity: { value: 1 },
      uMap: { value: map },
    };
    if (picking) {
      this.uniforms.objectId = { value: [NaN, NaN, NaN, NaN] };
    }
  }

  update(marker: Marker, width: number, height: number): void {
    this.uniforms.uCenter!.value[0] = width / 2;
    this.uniforms.uCenter!.value[1] = height / 2;

    this.uniforms.uColor!.value[0] = SRGBToLinear(marker.color.r);
    this.uniforms.uColor!.value[1] = SRGBToLinear(marker.color.g);
    this.uniforms.uColor!.value[2] = SRGBToLinear(marker.color.b);

    const isDark = (marker.color.r + marker.color.g + marker.color.b) / 3 < 0.5;
    this.uniforms.uBackgroundColor!.value = isDark
      ? TextMaterial.LIGHT_BACKGROUND
      : TextMaterial.DARK_BACKGROUND;
    this.uniforms.uOpacity!.value = marker.color.a;
    const transparent = marker.color.a < 1;
    this.transparent = transparent;
    this.depthWrite = !transparent;
    this.needsUpdate = true;
  }
}
