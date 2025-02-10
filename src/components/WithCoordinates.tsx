"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const WithCoordinates = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previousIntersectedRef = useRef<THREE.Mesh>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const boundingBoxRef = useRef<THREE.Box3 | null>(null);
  const cellSizeRef = useRef<number | null>(null);

  const [minX, setMinX] = useState<number | null>(null);
  const [maxX, setMaxX] = useState<number | null>(null);
  const [minZ, setMinZ] = useState<number | null>(null);
  const [maxZ, setMaxZ] = useState<number | null>(null);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const scene = new THREE.Scene();

  useEffect(() => {
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(10, 20, 10);
    scene.add(pointLight);

    const spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(-10, 20, -10);
    spotLight.angle = Math.PI / 6;
    scene.add(spotLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI / 2;

    const loader = new GLTFLoader();
    loader.load("/TestFBX/Mesh_all.glb", (gltf) => {
      const model = gltf.scene;
      scene.add(model);
      const boundingBox = new THREE.Box3().setFromObject(model);
      boundingBoxRef.current = boundingBox;
      console.log("boundingbox:::", boundingBox);
      const size = new THREE.Vector3();
      boundingBox.getSize(size);
      const center = new THREE.Vector3();
      boundingBox.getCenter(center);

      const gridSize = Math.max(size.x, size.z);
      const gridDivistions = 10; // number of grid cells, adjust as needed
      cellSizeRef.current = gridSize / gridDivistions;
      const gridHelper = new THREE.GridHelper(gridSize, gridDivistions);
      gridHelper.position.set(center.x, boundingBox.min.y, center.z); // Align to bottom of model (y-axis)
      scene.add(gridHelper);

      camera.position.set(0, 10, 20);
      camera.lookAt(0, 0, 0);

      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();
    });

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("click", onMouseClick);

    return () => {
      renderer.dispose();
      scene.clear();
    };
  }, []);

  const onMouseMove = (event) => {
    const canvasBounds = canvasRef.current.getBoundingClientRect();
    if (!canvasBounds) return;

    // Calculate mouse position in normalized device coordinates
    mouse.x =
      ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
    mouse.y =
      -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;

    raycaster.setFromCamera(mouse, cameraRef.current);

    const intersects = raycaster.intersectObjects(scene.children, true);
    const intersectedObject = intersects
      .map((intersect) => {
        return intersect.object;
      })
      .find((object) => {
        return object instanceof THREE.Mesh;
      });

    if (intersectedObject) {
      if (
        previousIntersectedRef.current &&
        previousIntersectedRef.current !== intersectedObject
      ) {
        (
          previousIntersectedRef.current.material as THREE.MeshStandardMaterial
        ).color.copy(previousIntersectedRef.current.userData.originalColor);
        // previousIntersectedRef.current.meterial.needsUpdate = true;
      }

      //   store original color if it is not inluded as userData
      if (!intersectedObject.userData.originalColor) {
        intersectedObject.userData.originalColor =
          intersectedObject.material.color.clone();
      }

      //   clone material to itself for avoiding updating the meshes which use the same material
      intersectedObject.material = intersectedObject.material.clone();
      intersectedObject.material.color.set(0xff0000);
      intersectedObject.material.needsUpdate = true;

      previousIntersectedRef.current = intersectedObject;
    } else {
      if (previousIntersectedRef.current) {
        (
          previousIntersectedRef.current.material as THREE.MeshStandardMaterial
        ).color.copy(previousIntersectedRef.current.userData.originalColor);
        // previousIntersectedRef.current.material.needsUpdate = true;
        previousIntersectedRef.current = null;
      }
    }
  };

  const onMouseClick = (event) => {
    const canvasBounds = canvasRef.current.getBoundingClientRect();
    if (!canvasBounds) return;

    // Calculate mouse position in normalized device coordinates
    mouse.x =
      ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
    mouse.y =
      -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;

    raycaster.setFromCamera(mouse, cameraRef.current);

    const intersects = raycaster.intersectObjects(scene.children, true);
    const intersectedObject = intersects
      .map((intersect) => {
        return intersect.object;
      })
      .find((object) => {
        return object instanceof THREE.Mesh;
      });

    if (intersectedObject) {
      //   get the intersected object's coordinates
      const coordinates = getCoordinates(intersectedObject);
    }
  };

  const getCoordinates = (intersectedObject: THREE.Mesh) => {
    if (!boundingBoxRef.current || !cellSizeRef.current) return;

    const cellSize = cellSizeRef.current;

    const box = new THREE.Box3().setFromObject(intersectedObject);
    const minX = Math.round(box.min.x / cellSize);
    const maxX = Math.round(box.max.x / cellSize);
    const minZ = Math.round(box.min.z / cellSize);
    const maxZ = Math.round(box.max.z / cellSize);

    setMinX(minX);
    setMaxX(maxX);
    setMinZ(minZ);
    setMaxZ(maxZ);

    return {
      x: { min: minX, max: maxX },
      z: { min: minZ, max: maxZ },
    };
  };

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "row", gap: "20px" }}>
        <h3 style={{ fontSize: "20px" }}>GRID COORDINATES</h3>
        <p style={{ fontSize: "20px" }}>MinX: {minX}</p>
        <p style={{ fontSize: "20px" }}>MaxX: {maxX}</p>
        <p style={{ fontSize: "20px" }}>MinZ: {minZ}</p>
        <p style={{ fontSize: "20px" }}>MaxZ: {maxZ}</p>
      </div>
      <canvas ref={canvasRef} />
    </div>
  );
};

export default WithCoordinates;
