"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const TwoDEnhancement = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const skyRef = useRef<THREE.Object3D | null>(null);

  const [shouldSkyRemove, setShouldSkyRemove] = useState(false);

  useEffect(() => {
    sceneRef.current = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current?.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const neutralEnvironment = pmremGenerator.fromScene(
      new RoomEnvironment()
    ).texture;

    // Lighting
    const light = new THREE.AmbientLight(0xffffff, 1);
    sceneRef.current.add(light);

    // Load GLB Files
    const loader = new GLTFLoader();

    let land: THREE.Object3D | null = null;

    loader.load("/2d_enhancement/top.glb", (gltf) => {
      skyRef.current = gltf.scene;
      skyRef.current.position.set(0, -5, 0); // Place sky high above
      sceneRef.current.add(skyRef.current);
    });

    loader.load("/2d_enhancement/bottom.glb", (gltf) => {
      land = gltf.scene;
      land.position.set(0, 0, 0); // Place land at base
      sceneRef.current.add(land);
    });

    // scene.environment = neutralEnvironment;

    camera.position.set(0, 120, 0); // Start above sky

    // Orbit Controls Setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = false;
    controls.update();

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(sceneRef.current, camera);
    }

    animate();

    // Add event listener to check zoom level
    controls.addEventListener("change", () => {
      console.log("camera position:", camera.position.z);
      if (camera.position.z < 0.00005 && !shouldSkyRemove) {
        setShouldSkyRemove(true);
      }
      if (camera.position.z >= 0.00005) {
        console.log("sky added");
        setShouldSkyRemove(false);
      }
    });

    return () => {
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (shouldSkyRemove) {
      sceneRef.current?.remove(skyRef.current);
    } else if (!shouldSkyRemove) {
      console.log("sky added");
      sceneRef.current?.add(skyRef.current);
    }
  }, [shouldSkyRemove]);

  return <div ref={mountRef} style={{ width: "100vw", height: "100vh" }} />;
};

export default TwoDEnhancement;
