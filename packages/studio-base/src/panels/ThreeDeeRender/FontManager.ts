// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import TinySDF from "@mapbox/tiny-sdf";
import * as THREE from "three";

class FontManager {
  private alphabet: string;

  texture: THREE.DataTexture;

  constructor() {
    this.texture = new THREE.DataTexture();
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;

    const start = " ".charCodeAt(0);
    const end = "}".charCodeAt(0);
    let initialAlphabet = "";
    for (let i = start; i <= end; i++) {
      initialAlphabet += String.fromCodePoint(i);
    }
    this.update(initialAlphabet);
  }

  update(newChars: string) {
    let needsUpdate = false;
    for (const char of newChars) {
      if (!this.alphabet.includes(char)) {
        this.alphabet += char;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      const tinysdf = new TinySDF({ fontSize: 24 });
      for (const char of this.alphabet) {
        const { data } = tinysdf.draw(char);
      }
    }
  }
}
