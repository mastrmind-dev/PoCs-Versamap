"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

type LogoCoordinatesType = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  logoPath: string;
};

const LogoLayer = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const planeRef = useRef<THREE.Mesh | null>(null);
  const flatMapRef = useRef<THREE.Object3D | null>(null);
  const textureLoaderRef = useRef<THREE.TextureLoader | null>(null);
  const planeArrayRef = useRef<THREE.Mesh[]>([]);

  const [shouldLogoLayerRemove, setShouldLogoLayerRemove] =
    useState<boolean>(false);

  useEffect(() => {
    textureLoaderRef.current = new THREE.TextureLoader();
  }, []);

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

    // Lighting
    const light = new THREE.AmbientLight(0xffffff, 1);
    sceneRef.current.add(light);

    // Load GLB File
    let size = new THREE.Vector3();
    const loader = new GLTFLoader();

    // Load the file
    loader.load("/TopViewV2.glb", (gltf) => {
      flatMapRef.current = gltf.scene;
      flatMapRef.current.position.set(0, 0, 0);
      sceneRef.current?.add(flatMapRef.current);

      const box = new THREE.Box3().setFromObject(flatMapRef.current);
      box.getSize(size);

      // Create the grid
      gridRef.current = new THREE.GridHelper(
        size.x,
        400, // 156 cells to each side
        0x0000ff,
        0x808080
      ); // Grid size matches model's width and height
      gridRef.current.material.transparent = true;
      gridRef.current.material.opacity = 0.2; // Set transparency level
      gridRef.current.position.set(0, flatMapRef.current.position.y + 0.9, 0);
      sceneRef.current.add(gridRef.current);

      createPlane([
        { minX: -78, maxX: -70, minZ: 70, maxZ: 78, logoPath: "/facebook.jpg" },
        { minX: -20, maxX: -12, minZ: 12, maxZ: 20, logoPath: "/google.jpg" },
        { minX: -10, maxX: -4, minZ: 70, maxZ: 80, logoPath: "/apple.jpg" },
        { minX: 32, maxX: 40, minZ: 50, maxZ: 60, logoPath: "/microsoft.jpeg" },
      ]);
    });

    const createPlane = (coordinatesArr: LogoCoordinatesType[]) => {
      //   Add planes
      for (const coordinates of coordinatesArr) {
        const { minX, maxX, minZ, maxZ, logoPath } = coordinates;
        // Load texture
        const texture = textureLoaderRef.current.load(logoPath);
        // Create a solid plane
        const gridSize = size.x / 400;
        const planeWidth = gridSize * (maxX - minX);
        const planeHeight = gridSize * (maxZ - minZ);
        const planeGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
        const planeMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          // color: 0x00ff00, // Green color
          side: THREE.DoubleSide, // Render both sides of the plane
        });
        planeRef.current = new THREE.Mesh(planeGeometry, planeMaterial);
        planeRef.current.rotation.x = -Math.PI / 2; // Rotate to make it horizontal
        // Calculate the plane's position based on grid coordinates
        const planeCenterX = (maxX + minX) / 2; // Center of x: -70 to -78
        const planeCenterZ = (maxZ + minZ) / 2; // Center of z: 70 to 78
        planeRef.current.position.set(
          planeCenterX * gridSize,
          flatMapRef.current.position.y + 0.9,
          planeCenterZ * gridSize
        );
        sceneRef.current.add(planeRef.current);

        planeArrayRef.current.push(planeRef.current);
      }
    };

    camera.position.set(0, 100, 0); // Position the camera

    // Orbit Controls Setup
    const controls = new OrbitControls(camera, renderer.domElement);
    // controls.enableRotate = false;
    controls.enablePan = true; // Enable panning
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.PAN, // Set left mouse button to pan
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE,
    };
    controls.update();

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(sceneRef.current, camera);
    }

    animate();

    controls.addEventListener("change", () => {
      const zoomDistance = camera.position.distanceTo(controls.target); // Calculate zoom distance
      console.log("zoom distance:", zoomDistance);
      console.log("camera position:", camera.position.z);
      if (zoomDistance < 7 && !shouldLogoLayerRemove) {
        setShouldLogoLayerRemove(true);
      }
      if (zoomDistance >= 7) {
        console.log("sky added");
        setShouldLogoLayerRemove(false);
      }
    });

    return () => {
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (shouldLogoLayerRemove) {
      sceneRef.current?.remove(gridRef.current);
      planeArrayRef.current.forEach((plane) => {
        sceneRef.current?.remove(plane);
      });
    } else if (!shouldLogoLayerRemove) {
      console.log("Grid added");
      sceneRef.current?.add(gridRef.current);
      planeArrayRef.current.forEach((plane) => {
        sceneRef.current?.add(plane);
      });
    }
  }, [shouldLogoLayerRemove]);

  return <div ref={mountRef} style={{ width: "100vw", height: "100vh" }} />;
};

export default LogoLayer;
