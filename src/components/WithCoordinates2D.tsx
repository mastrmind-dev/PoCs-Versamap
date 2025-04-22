"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const WithCoordinates2D = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previousIntersectedRef = useRef<THREE.Mesh>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const boundingBoxRef = useRef<THREE.Box3 | null>(null);
  const cellSizeRef = useRef<number | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const planeRef = useRef<THREE.Mesh | null>(null);
  const textureLoaderRef = useRef<THREE.TextureLoader | null>(null);
  const planeArrayRef = useRef<THREE.Mesh[]>([]);

  const [shouldLogoLayerRemove, setShouldLogoLayerRemove] =
    useState<boolean>(false);

  type LogoCoordinatesType = {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    logoPath: string;
  };

  const [minX, setMinX] = useState<number | null>(null);
  const [maxX, setMaxX] = useState<number | null>(null);
  const [minZ, setMinZ] = useState<number | null>(null);
  const [maxZ, setMaxZ] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const scene = new THREE.Scene();

  useEffect(() => {
    textureLoaderRef.current = new THREE.TextureLoader();
  }, []);

  useEffect(() => {
    const camera = new THREE.PerspectiveCamera(
      100,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
    renderer.setSize(window.innerWidth - 100, window.innerHeight);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const neutralEnvironment = pmremGenerator.fromScene(
      new RoomEnvironment()
    ).texture;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight1.position.set(5, 10, 5);
    directionalLight1.castShadow = true;
    scene.add(directionalLight1);

    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.maxPolarAngle = Math.PI / 2;
    orbitControls.enableRotate = false;

    orbitControls.addEventListener("change", () => {
      const zoomDistance = camera.position.distanceTo(orbitControls.target);
      if (zoomDistance < 7 && !shouldLogoLayerRemove) {
        setShouldLogoLayerRemove(true);
      }
      if (zoomDistance >= 7 && shouldLogoLayerRemove) {
        setShouldLogoLayerRemove(false);
      }
    });

    const movementSpeed = 0.01;
    const velocity = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const move = { forward: false, backward: false, left: false, right: false };

    const textureLoader = new THREE.TextureLoader();
    const floorTexture = textureLoader.load("/Ocean.jpg");
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;

    const manager = new THREE.LoadingManager();
    manager.onStart = function (url, itemsLoaded, itemsTotal) {
      console.log(
        "Started loading file: " +
          url +
          ".\nLoaded " +
          itemsLoaded +
          " of " +
          itemsTotal +
          " files."
      );
      setIsLoading(true);
    };

    manager.onLoad = function () {
      console.log("Loading complete!");
      setIsLoading(false);
    };

    manager.onProgress = function (url, itemsLoaded, itemsTotal) {
      console.log(
        "Loading file: " +
          url +
          ".\nLoaded " +
          itemsLoaded +
          " of " +
          itemsTotal +
          " files."
      );
    };

    manager.onError = function (url) {
      console.log("There was an error loading " + url);
    };

    const loader = new GLTFLoader(manager);
    loader.load("/TopViewV2.glb", (gltf) => {
      const model = gltf.scene;
      model.scale.set(3, 3, 3);

      scene.background = floorTexture;
      scene.add(model);

      const boundingBox = new THREE.Box3().setFromObject(model);
      boundingBoxRef.current = boundingBox;
      const size = new THREE.Vector3();
      boundingBox.getSize(size);
      const center = new THREE.Vector3();
      boundingBox.getCenter(center);

      // Calculate grid size based on the scaled model
      const gridSize = Math.max(size.x, size.z);
      const gridDivisions = 400; // Keep this constant regardless of model scale
      cellSizeRef.current = gridSize / gridDivisions;

      // Create and add grid helper
      const gridHelper = new THREE.GridHelper(gridSize, gridDivisions);
      gridHelper.position.set(center.x, boundingBox.min.y + 0.3, center.z);
      gridHelper.material.opacity = 0.2;
      gridHelper.material.transparent = true;
      gridRef.current = gridHelper;
      scene.add(gridHelper);

      const createLogoPlanes = (coordinatesArr: LogoCoordinatesType[]) => {
        if (
          !textureLoaderRef.current ||
          !cellSizeRef.current ||
          !boundingBoxRef.current
        )
          return;

        const gridCellSize = cellSizeRef.current;

        for (const coordinates of coordinatesArr) {
          const { minX, maxX, minZ, maxZ, logoPath } = coordinates;
          const texture = textureLoaderRef.current.load(logoPath);

          // Calculate dimensions in world units
          const planeWidth = Math.abs(maxX - minX) * gridCellSize;
          const planeHeight = Math.abs(maxZ - minZ) * gridCellSize;

          const planeGeometry = new THREE.PlaneGeometry(
            planeWidth,
            planeHeight
          );
          const planeMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7, // Changed from 0.8 to 0.7 (70% opacity)
          });

          const plane = new THREE.Mesh(planeGeometry, planeMaterial);
          plane.rotation.x = -Math.PI / 2; // Make horizontal

          // Calculate world position based on grid coordinates
          const planeCenterX =
            center.x + (minX + (maxX - minX) / 2) * gridCellSize;
          const planeCenterZ =
            center.z + (minZ + (maxZ - minZ) / 2) * gridCellSize;

          plane.position.set(
            planeCenterX,
            boundingBoxRef.current.min.y + 1.5,
            planeCenterZ
          );

          scene.add(plane);
          planeArrayRef.current.push(plane);
        }
      };

      // Add logo planes with adjusted coordinates
      createLogoPlanes([
        { minX: -78, maxX: -70, minZ: 70, maxZ: 78, logoPath: "/facebook.jpg" },
        { minX: -20, maxX: -12, minZ: 12, maxZ: 20, logoPath: "/google.jpg" },
        { minX: -10, maxX: -4, minZ: 70, maxZ: 80, logoPath: "/apple.jpg" },
        { minX: 32, maxX: 40, minZ: 50, maxZ: 60, logoPath: "/microsoft.jpeg" },
      ]);

      camera.position.set(0, 100, 0);

      const animate = () => {
        requestAnimationFrame(animate);
        orbitControls.update();
        renderer.render(scene, camera);
      };
      animate();
    });

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("click", onMouseClick);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("click", onMouseClick);
      renderer.dispose();
      scene.clear();
    };
  }, []);

  useEffect(() => {
    if (shouldLogoLayerRemove) {
      scene.remove(gridRef.current);
      planeArrayRef.current.forEach((plane) => {
        scene.remove(plane);
      });
    } else {
      if (gridRef.current) {
        scene.add(gridRef.current);
      }
      planeArrayRef.current.forEach((plane) => {
        scene.add(plane);
      });
    }
  }, [shouldLogoLayerRemove]);

  const onMouseMove = (event) => {
    if (!canvasRef.current) return;
    const canvasBounds = canvasRef.current.getBoundingClientRect();
    if (!canvasBounds) return;

    mouse.x =
      ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
    mouse.y =
      -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;

    raycaster.setFromCamera(mouse, cameraRef.current);

    const intersects = raycaster.intersectObjects(scene.children, true);
    const intersectedObject = intersects
      .map((intersect) => intersect.object)
      .find((object) => object instanceof THREE.Mesh);

    const isLogoPlane = planeArrayRef.current.includes(intersectedObject);
    const floorNames = [
      "polySurface4456_1",
      "polySurface4435_1",
      "polySurface4442_1",
      "polySurface4449_1",
    ];

    // Always reset previous highlighted object if it exists and we're not hovering over it
    if (
      previousIntersectedRef.current &&
      previousIntersectedRef.current !== intersectedObject
    ) {
      if (planeArrayRef.current.includes(previousIntersectedRef.current)) {
        // Reset logo opacity to 70%
        (previousIntersectedRef.current.material as THREE.MeshBasicMaterial).opacity = 0.7;
      } else {
        // Reset building material
        (previousIntersectedRef.current.material as THREE.MeshStandardMaterial)
          .color.copy(previousIntersectedRef.current.userData.originalColor);
        (previousIntersectedRef.current.material as THREE.MeshStandardMaterial)
          .emissive.set(0x000000);
      }
      previousIntersectedRef.current = null;
    }

    if (intersectedObject) {
      if (isLogoPlane) {
        // Handle logo hover
        (intersectedObject.material as THREE.MeshBasicMaterial).opacity = 1;
        previousIntersectedRef.current = intersectedObject;
      } else if (!floorNames.includes(intersectedObject?.name)) {
        // Store original color if not already stored
        if (!intersectedObject.userData.originalColor) {
          intersectedObject.userData.originalColor =
            intersectedObject.material.color.clone();
        }

        // Handle building hover
        intersectedObject.material = intersectedObject.material.clone();
        intersectedObject.material.emissive.set(0xff0000);
        intersectedObject.material.emissiveIntensity = 1;
        intersectedObject.material.color.set(0x0000ff);
        intersectedObject.material.transparent = false;
        intersectedObject.material.opacity = 1;
        intersectedObject.material.needsUpdate = true;

        previousIntersectedRef.current = intersectedObject;
      }
    }
  };

  const onMouseClick = (event) => {
    const canvasBounds = canvasRef.current.getBoundingClientRect();
    if (!canvasBounds) return;

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
      const coordinates = getCoordinates(intersectedObject);
    }
  };

  const getCoordinates = (intersectedObject: THREE.Mesh) => {
    if (!boundingBoxRef.current || !cellSizeRef.current) return;

    const cellSize = cellSizeRef.current;

    const box = new THREE.Box3().setFromObject(intersectedObject);
    const minX = Math.round(box.min.x / cellSize);
    const maxX = Math.round(box.max.x / cellSize);
    const maxZ = -Math.round(box.min.z / cellSize);
    const minZ = -Math.round(box.max.z / cellSize);

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
    <div
      style={{
        borderRadius: "10px",
        padding: "20px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "row", gap: "20px" }}>
        <h3 style={{ fontSize: "20px" }}>
          CLICK ON A BUILDING TO GET GRID COORDINATES
        </h3>
        <p style={{ fontSize: "20px" }}>MinX: {minX}</p>
        <p style={{ fontSize: "20px" }}>MaxX: {maxX}</p>
        <p style={{ fontSize: "20px" }}>MinZ: {minZ}</p>
        <p style={{ fontSize: "20px" }}>MaxZ: {maxZ}</p>
      </div>
      <div style={{ position: "relative" }}>
        {isLoading && (
          <>
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "20px",
                background: "white",
                borderRadius: "8px",
              }}
            >
              <div
                className="spinner"
                style={{
                  width: "40px",
                  height: "40px",
                  border: "4px solid rgba(0, 0, 0, 0.3)",
                  borderTop: "4px solid black",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  marginBottom: "10px",
                }}
              ></div>
              Loading...
            </div>
            <style>
              {`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}
            </style>
          </>
        )}
        <canvas ref={canvasRef} style={{ opacity: isLoading ? 0.5 : 1 }} />
      </div>
    </div>
  );
};

export default WithCoordinates2D;
