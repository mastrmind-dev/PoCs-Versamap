// components/GridOverlay.tsx
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const GridOverlay = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [modelPositions, setModelPositions] = useState<
    {
      x: number;
      y: number;
      z: number;
    }[]
  >([
    {
      x: 0,
      y: 0,
      z: 0,
    },
  ]);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000000
    );
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (canvasRef.current) {
      canvasRef.current.appendChild(renderer.domElement);
    }

    // Create a grid
    const gridHelper = new THREE.GridHelper(1000, 100, 0x880808, 0x0000ff);
    gridHelper.position.y = 0.08;
    scene.add(gridHelper);

    // Load the 3D model
    const loader = new GLTFLoader();
    loader.load("/Floor/test1.glb", (gltf) => {
      scene.add(gltf.scene);

      // Optionally set the model's initial position if needed
      gltf.scene.position.set(0, 0, 0); // Adjust position based on your scene

      // Update model position in state
      const updatePosition = () => {
        const position = gltf.scene.position;
        setModelPositions((prev) => {
          return [
            ...prev,
            {
              x: position.x,
              y: position.y,
              z: position.z,
            },
          ];
        });
      };

      // Initially set the position
      updatePosition();

      // Optionally, if the model moves dynamically, update its position periodically
      // For example, use requestAnimationFrame or any other update loop if your model moves
    });

    loader.load("/Building/test1.glb", (gltf) => {
      scene.add(gltf.scene);

      // Optionally set the model's initial position if needed
      gltf.scene.position.set(10, 0, 0); // Adjust position based on your scene

      // Update model position in state
      const updatePosition = () => {
        const position = gltf.scene.position;
        setModelPositions((prev) => {
          return [
            ...prev,
            {
              x: position.x,
              y: position.y,
              z: position.z,
            },
          ];
        });
      };

      // Initially set the position
      updatePosition();

      // Optionally, if the model moves dynamically, update its position periodically
      // For example, use requestAnimationFrame or any other update loop if your model moves
    });

    loader.load("/Billboard/test1.glb", (gltf) => {
      scene.add(gltf.scene);

      // Optionally set the model's initial position if needed
      gltf.scene.position.set(-10, 0, 0); // Adjust position based on your scene

      // Update model position in state
      const updatePosition = () => {
        const position = gltf.scene.position;
        setModelPositions((prev) => {
          return [
            ...prev,
            {
              x: position.x,
              y: position.y,
              z: position.z,
            },
          ];
        });
      };

      // Initially set the position
      updatePosition();

      // Optionally, if the model moves dynamically, update its position periodically
      // For example, use requestAnimationFrame or any other update loop if your model moves
    });

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1); // Adjust intensity
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Set up camera position
    camera.position.z = 50;

    // Handle panning and rotating
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI / 2; // Limit to top-down view

    const animate = () => {
      requestAnimationFrame(animate);

      renderer.render(scene, camera);
    };

    animate();

    // Handle resizing
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Function to display the model's coordinates based on the grid
  const displayGridCoordinates = () => {
    modelPositions.forEach((modelPosition) => {
      const { x, y, z } = modelPosition;
      console.log(`Model coordinates on the grid: X: ${x}, Y: ${y}, Z: ${z}`);
    });
  };

  return (
    <div>
      <div ref={canvasRef} />
      <button onClick={displayGridCoordinates}>Log Model Coordinates</button>
      <p>
        Open the browser console to view the model's coordinates based on the
        grid.
      </p>
    </div>
  );
};

export default GridOverlay;
