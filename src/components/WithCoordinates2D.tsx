"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const WithCoordinates2D = () => {
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
      100,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
    // renderer.toneMapping = THREE.LinearToneMapping; // Linear tone mapping
    // renderer.toneMappingExposure = 1.0; // Exposure equivalent (image shows 0, but default is usually 1)
    renderer.setSize(window.innerWidth, window.innerHeight);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const neutralEnvironment = pmremGenerator.fromScene(
      new RoomEnvironment()
    ).texture;

    // Ambient Light - softens shadows and brightens everything
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    // const spotlight = new THREE.SpotLight(0xffffff, 1, 10, Math.PI / 6, 0.5, 2);
    // spotlight.position.set(0, 5, 0); // Position the spotlight
    // spotlight.target.position.set(10, 0, 10); // Set the target for the spotlight to focus on
    // scene.add(spotlight);
    // scene.add(spotlight.target); // Add the spotlight's target to the scene

    // Directional Light - mimics sunlight, casts shadows
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight1.position.set(5, 10, 5);
    directionalLight1.castShadow = true;
    scene.add(directionalLight1);

    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.maxPolarAngle = Math.PI / 2;
    orbitControls.enableRotate = false;

    const fpsControls = new PointerLockControls(camera, renderer.domElement);

    // Movement settings
    const movementSpeed = 0.01;
    const velocity = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const move = { forward: false, backward: false, left: false, right: false };

    // Event Listeners for First-Person Movement
    document.addEventListener("keydown", (event) => {
      switch (event.code) {
        case "KeyW":
          move.forward = true;
          break;
        case "KeyS":
          move.backward = true;
          break;
        case "KeyA":
          move.left = true;
          break;
        case "KeyD":
          move.right = true;
          break;
        case "KeyO":
          toggleControls();
          break; // Switch mode
      }
    });
    document.addEventListener("keyup", (event) => {
      switch (event.code) {
        case "KeyW":
          move.forward = false;
          break;
        case "KeyS":
          move.backward = false;
          break;
        case "KeyA":
          move.left = false;
          break;
        case "KeyD":
          move.right = false;
          break;
      }
    });

    // Toggle Between Orbit and First-Person Controls
    let usingFPSControls = false;

    function toggleControls() {
      if (usingFPSControls) {
        // Switch to Orbit Controls
        fpsControls.unlock(); // Unlock pointer lock
        orbitControls.enabled = true;
      } else {
        // Switch to First-Person Controls
        fpsControls.lock();
        orbitControls.enabled = false;
      }
      usingFPSControls = !usingFPSControls;
    }

    // Click to Enable First-Person Mode
    document.addEventListener("keydown", (event) => {
      if (event.code === "KeyO" && !usingFPSControls) {
        fpsControls.lock();
        usingFPSControls = true;
        orbitControls.enabled = false;
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.code === "KeyP" && usingFPSControls) {
        fpsControls.unlock();
        usingFPSControls = false;
        orbitControls.enabled = true;
      }
    });

    // scene.environment = neutralEnvironment;
    // scene.background = neutralEnvironment;

    const textureLoader = new THREE.TextureLoader();
    const floorTexture = textureLoader.load("/Ocean.jpg");
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    // floorTexture.repeat.set(10, 10);
    const loader = new GLTFLoader();
    loader.load("/TopViewV2.glb", (gltf) => {
      // loader.load("/TestFBX/Mesh_all.glb", (gltf) => {
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

      // add random colors to meshes
      const applyRandomColors = (object) => {
        if (object instanceof THREE.Mesh) {
          object.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0x9e311a), // Light brown color
            roughness: 0.5, // Moderate roughness for realistic surface reflection
            metalness: 0.2, // A bit of metallic look
            // color: new THREE.Color(Math.random(), Math.random(), Math.random()),
            // roughness: 0.5, // Moderate roughness for realistic surface reflection
            // metalness: 0.2, // A bit of metallic look
            // emissive: new THREE.Color(0, 0, 0), // No em
          });
        }
        // if (object.children && object.children.length > 0) {
        //   object.children.forEach((child) => applyRandomColors(child));
        // }
      };

      // applyRandomColors(model);

      // traverse though meshes
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // console.log("child:::", child);
          // child.material = new THREE.MeshBasicMaterial({ color: 0x00ffff });
          // child.castShadow = false;
          // child.receiveShadow = false;
          // applyRandomColors(child);
          //   child.material.envMap = neutralEnvironment;
          //   child.material.needsUpdate = true;
        }
      });

      const gridSize = Math.max(size.x, size.z);
      const gridDivistions = 400 * 30; // number of grid cells, adjust as needed
      cellSizeRef.current = (gridSize * 30) / gridDivistions;
      const gridHelper = new THREE.GridHelper(gridSize * 30, gridDivistions);
      gridHelper.position.set(center.x, boundingBox.min.y + 0.3, center.z); // Align to bottom of model (y-axis)
      gridHelper.material.color.set(0x00008b); // Set grid color to dark blue
      scene.add(gridHelper);

      camera.position.set(0, 100, 0);

      canvasRef.current.requestPointerLock();

      // Keyboard controls for movement (WASD)
      // let moveForward = false,
      //   moveBackward = false,
      //   strafeLeft = false,
      //   strafeRight = false;
      // document.addEventListener("keydown", (event) => {
      //   switch (event.key) {
      //     case "w":
      //       moveForward = true;
      //       break;
      //     case "s":
      //       moveBackward = true;
      //       break;
      //     case "a":
      //       strafeLeft = true;
      //       break;
      //     case "d":
      //       strafeRight = true;
      //       break;
      //   }
      // });
      // document.addEventListener("keyup", (event) => {
      //   switch (event.key) {
      //     case "w":
      //       moveForward = false;
      //       break;
      //     case "s":
      //       moveBackward = false;
      //       break;
      //     case "a":z
      //       strafeLeft = false;
      //       break;
      //     case "d":
      //       strafeRight = false;
      //       break;
      //   }
      // });

      const animate = () => {
        requestAnimationFrame(animate);
        if (usingFPSControls) {
          // First-Person Movement
          direction.z = Number(move.forward) - Number(move.backward);
          direction.x = Number(move.right) - Number(move.left);
          direction.normalize(); // Keep speed consistent

          velocity.x -= velocity.x * 0.1; // Smooth deceleration
          velocity.z -= velocity.z * 0.1;
          velocity.addScaledVector(direction, movementSpeed);

          fpsControls.moveRight(velocity.x);
          fpsControls.moveForward(velocity.z);
        } else {
          // Orbit Controls Update
          orbitControls.update();
        }
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

    // console.log("intersected obj:::", intersectedObject);

    const idsToExclude = [1072, 1073, 1074, 1075];
    // console.log("intersected id:::", intersectedObject?.id);
    if (intersectedObject && !idsToExclude.includes(intersectedObject?.id)) {
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
      intersectedObject.material.emissive.set(0xff0000); // Bright red glow
      intersectedObject.material.emissiveIntensity = 1;

      // intersectedObject.material.baseMap = 0x000000;

      intersectedObject.material.color.set(0x0000ff); // Yellow color
      intersectedObject.material.transparent = false; // Ensure transparency is disabled
      // intersectedObject.material.color.convertSRGBToLinear();
      intersectedObject.material.opacity = 1;
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
    // console.log("intersects:::", intersects);
    const intersectedObject = intersects
      .map((intersect) => {
        return intersect.object;
      })
      .find((object) => {
        return object instanceof THREE.Mesh;
      });

    console.log("object:::", intersectedObject?.material?.color);
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
    <div>
      <div style={{ display: "flex", flexDirection: "row", gap: "20px" }}>
        <h3 style={{ fontSize: "20px" }}>GRID COORDINATES</h3>
        <p style={{ fontSize: "20px" }}>MinX: {minX}</p>
        <p style={{ fontSize: "20px" }}>MaxX: {maxX}</p>
        <p style={{ fontSize: "20px" }}>MinZ: {minZ}</p>
        <p style={{ fontSize: "20px" }}>MaxZ: {maxZ}</p>
      </div>
      <canvas
        ref={canvasRef}
        style={{
          backgroundImage: "url('/Ocean.jpg')",
          backgroundSize: "cover",
        }}
      />
    </div>
  );
};

export default WithCoordinates2D;
