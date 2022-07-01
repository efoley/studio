// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import { FontManager } from "./FontManager";
import { LabelPool } from "./LabelPool";

export default {
  title: "LabelPool",
};

Atlas.parameters = { colorScheme: "dark" };
export function Atlas(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(ReactNull);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const fontManager = new FontManager();

    const labelPool = new LabelPool(fontManager);
    fontManager.update("Hello world!");

    const camera = new THREE.PerspectiveCamera(
      45,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      2000,
    );
    camera.position.set(2, 2, 2);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    const label = labelPool.acquire();
    label.update("Hello world!\nExample");
    scene.add(label);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    function render() {
      renderer.render(scene, camera);
    }

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0, 0);
    controls.update();

    controls.addEventListener("change", render);

    render();

    return () => {
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} width={400} height={400} style={{ width: 400, height: 400 }} />;
}
