// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as THREE from "three";
import createText, { type TextGeometry } from "three-bmfont-text";

import type { Renderer } from "../../Renderer";
import { rgbToThreeColor } from "../../color";
import { Marker } from "../../ros";
import { RenderableMarker } from "./RenderableMarker";

export class RenderableTextViewFacing extends RenderableMarker {
  textGeometry: TextGeometry;
  textMaterial: THREE.MeshBasicMaterial;
  text: THREE.Mesh;

  constructor(topic: string, marker: Marker, receiveTime: bigint | undefined, renderer: Renderer) {
    super(topic, marker, receiveTime, renderer);

    this.textGeometry = createText({ flipY: true, font: renderer.fontData });
    this.textMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      map: renderer.fontTexture,
    });
    this.text = new THREE.Mesh(this.textGeometry, this.textMaterial);

    this.add(this.text);
    this.update(marker, receiveTime);
  }

  override dispose(): void {
    // this.renderer.labels.removeById(this.name);
    // this.text.dispose();
    this.textGeometry.dispose();
    this.textMaterial.dispose();
  }

  override update(marker: Marker, receiveTime: bigint | undefined): void {
    super.update(marker, receiveTime);
    this.textGeometry.update({ text: marker.text });

    const scale = marker.scale.z / this.renderer.fontData.common.lineHeight;
    this.text.scale.set(scale, -scale, 1);

    rgbToThreeColor(this.textMaterial.color, marker.color);
    const transparent = marker.color.a < 1;
    this.textMaterial.transparent = transparent;
    this.textMaterial.depthWrite = !transparent;

    // const prevMarker = this.userData.marker;
    this.text.userData.pose = marker.pose;

    // troika-three-text
    // this.text.text = marker.text;
    // this.text.color = rgbToThreeColor(this.color, marker.color);
    // this.text.userData.pose = marker.pose;
    // this.text.fontSize = 1;
    // this.text.sync(() => {
    //   this.renderer.queueAnimationFrame();
    // });

    // // Check if any relevant fields have changed
    // if (
    //   this.label == undefined ||
    //   marker.text !== prevMarker.text ||
    //   marker.header.frame_id !== prevMarker.header.frame_id ||
    //   marker.frame_locked !== prevMarker.frame_locked ||
    //   (!marker.frame_locked && !areEqual(marker.header.stamp, prevMarker.header.stamp)) ||
    //   !rgbaEqual(marker.color, prevMarker.color)
    // ) {
    //   if (this.label) {
    //     this.remove(this.label);
    //   }

    //   // A field that affects the label appearance has changed, rebuild the label
    //   this.label = this.renderer.labels.setLabel(this.name, {
    //     text: marker.text,
    //     color: marker.color,
    //   });
    //   this.add(this.label);
    // } else if (!poseApproxEq(marker.pose, prevMarker.pose)) {
    //   // Just update the label pose
    //   this.label.userData.pose.position = marker.pose.position;
    // } else {
    //   // No change
    // }
  }
}
