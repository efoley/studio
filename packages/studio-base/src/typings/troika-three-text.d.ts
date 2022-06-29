// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

declare module "troika-three-text" {
  import * as THREE from "three";

  export class Text extends THREE.Mesh {
    text: string;
    anchorX: number | string;
    anchorY: number | string;
    curveRadius: number;
    direction: string;
    font?: string;
    fontSize: number;
    letterSpacing: number;
    lineHeight: number | string;
    maxWidth: number;
    overflowWrap: "normal" | "break-word";
    textAlign: string;
    textIndent: number;
    whiteSpace: "normal" | "nowrap";
    material?: THREE.Material;
    color?: string | number | THREE.Color;
    colorRanges?: Record<string, string | number | THREE.Color>;
    outlineWidth: number | string;
    outlineColor: string | number | THREE.Color;
    outlineOpacity: number;
    outlineBlur: number | string;
    outlineOffsetX: number | string;
    outlineOffsetY: number | string;
    strokeWidth: number | string;
    strokeColor: string | number | THREE.Color;
    strokeOpacity: number;
    fillOpacity: number;
    depthOffset: number;
    clipRect?: [minX: number, minY: number, maxX: number, maxY: number];
    orientation: `${"+" | "-"}${"x" | "y" | "z"}${"+" | "-"}${"x" | "y" | "z"}`;
    glyphGeometryDetail: number;
    sdfGlyphSize?: number;
    gpuAccelerateSDF: boolean;

    sync(callback?: () => void): void;
    dispose(): void;
  }
}

declare module "bmfont-lato" {
  export default {} as { images: Array<{ data: Uint8Array; shape: [number, number, number] }> };
}

declare module "three-bmfont-text" {
  import * as THREE from "three";

  type TextGeometryOptions = {
    flipY?: boolean;
    multipage?: boolean;

    font: unknown;
    text?: string;
    width?: number;
    mode?: "pre" | "nowrap";
    align?: "left" | "center" | "right";
    letterSpacing?: number;
    lineHeight?: number;
    tabSize?: number;
    start?: number;
    end?: number;
  };
  class TextGeometry extends THREE.BufferGeometry {
    update(options: Partial<TextGeometryOptions> | string): void;
  }
  export default function createText(options: TextGeometryOptions | string): TextGeometry;
}
