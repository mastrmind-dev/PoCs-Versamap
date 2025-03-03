import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader";

const SingleMeshDifferentMaterials: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const scene = new THREE.Scene();

  useEffect(() => {
    if (!canvasRef.current) return;

    // Setup Scene, Camera, and Renderer
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 10;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    canvasRef.current.appendChild(renderer.domElement);

    // Load and Parse SVG File
    const loader = new SVGLoader();
    loader.load("/TopViewGroupedV2.svg", (data) => {
      const firstGroup = data.xml.getElementsByTagName("g")[1];
      console.log("firstGroup:::", firstGroup);
    });

    // Add Lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(2, 2, 5);
    scene.add(light);

    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      canvasRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={canvasRef} />;
};

export default SingleMeshDifferentMaterials;
