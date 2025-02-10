"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader";

export default function AfricaMap() {
  const mountRef = useRef(null);
  const [selectedCountry, setSelectedCountry] = useState(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    const aspect = window.innerWidth / window.innerHeight;
    const d = 4000;
    const camera = new THREE.OrthographicCamera(
      -d * aspect,
      d * aspect,
      -d,
      d,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.enableRotate = false;

    camera.position.z = 5;

    const loader = new SVGLoader();
    loader.load("/TopView.svg", (data) => {
      const paths = data.paths;
      const group = new THREE.Group();

      //   give id attribute to all the paths (to mock id attribute, id should come from purnima)
      paths.forEach((path, index) => {
        path.userData.node.setAttribute("id", `land_${index}`);
      });

      paths.forEach((path, index) => {
        const landId = path.userData.node.getAttribute("id");
        const shapes = SVGLoader.createShapes(path);
        const material = new THREE.MeshBasicMaterial({
          color: Math.random() * 0xffffff,
          side: THREE.DoubleSide,
        });

        shapes.forEach((shape) => {
          const geometry = new THREE.ShapeGeometry(shape);
          const mesh = new THREE.Mesh(geometry, material);
          mesh.userData = { countryIndex: index, id: landId };
          group.add(mesh);
        });
      });
      scene.add(group);
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onMouseMove(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function onClick() {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      if (intersects.length > 0) {
        const selected = intersects[0].object.userData.id;
        setSelectedCountry(selected);

        // Highlight the selected country
        // (intersects[0].object.material as THREE.MeshBasicMaterial).color.set(0xff0000);
      }
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("click", onClick);

    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("click", onClick);
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div>
      <div ref={mountRef} style={{ width: "1000px" }} />
      {selectedCountry !== null && (
        <p>Selected Country Index: {selectedCountry}</p>
      )}
    </div>
  );
}
