// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as base64 from "@protobufjs/base64";
import Lato from "bmfont-lato";
import LatoDataURI from "bmfont-lato/image-uri";
import * as THREE from "three";
// import { Text } from "troika-three-text";
import createText from "three-bmfont-text";

import { areEqual } from "@foxglove/rostime";

import { LabelRenderable } from "../../Labels";
import type { Renderer } from "../../Renderer";
import { rgbaEqual, rgbToThreeColor } from "../../color";
import { Marker } from "../../ros";
import { poseApproxEq } from "../../transforms";
import { RenderableMarker } from "./RenderableMarker";

const pp = new Promise((r) => {
  new THREE.TextureLoader().load(
    // resource URL
    LatoDataURI,

    // onLoad callback
    (texture) => {
      // in this example we create the material when the texture is loaded
      r(texture);
    },
  );
});

export class RenderableTextViewFacing extends RenderableMarker {
  label: LabelRenderable | undefined;
  textGeometry = createText({ font: Lato });
  textMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    color: 0xff0000,
    side: THREE.DoubleSide,
  });
  text = new THREE.Mesh(this.textGeometry, this.textMaterial);
  // text = new Text();
  // color = new THREE.Color();

  constructor(topic: string, marker: Marker, receiveTime: bigint | undefined, renderer: Renderer) {
    super(topic, marker, receiveTime, renderer);

    // new THREE.texture
    // this.textMaterial.map = THREE.ImageUtils.loadTexture(LatoDataURI);
    // const str = base64.encode(
    //   new Uint8Array(
    //     Lato.images[0]!.data.buffer,
    //     Lato.images[0]!.data.byteOffset,
    //     Lato.images[0]!.data.byteLength,
    //   ),
    //   0,
    //   Lato.images[0]!.data.byteLength,
    // );
    // console.log("enc:", str);
    this.textMaterial.map = new THREE.DataTexture(
      Lato.images[0]!.data,
      Lato.images[0]!.shape[0],
      Lato.images[0]!.shape[1],
      // THREE.RGBAFormat,
      // THREE.UnsignedByteType,
    );
    this.textMaterial.map.flipY = true;
    this.textMaterial.map.needsUpdate = true;
    // console.log(Lato);
    // debugger;
    // pp.then((tex) => (this.textMaterial.map = tex));
    this.add(this.text);
    this.update(marker, receiveTime);
  }

  override dispose(): void {
    // this.renderer.labels.removeById(this.name);
    // this.text.dispose();
  }

  override update(marker: Marker, receiveTime: bigint | undefined): void {
    super.update(marker, receiveTime);
    this.textGeometry.update({ text: marker.text, lineHeight: marker.scale.x });
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
