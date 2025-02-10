import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const My3DMap = () => {
  const canvasRef = useRef(null);
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const [boundingBox, setBoundingBox] = useState<THREE.Box3 | null>(null);
  const [gridSize, setGridSize] = useState<number | undefined>(undefined);
  const [gridDivisions, setGridDivisions] = useState<number | undefined>(
    undefined
  );
  const [tooltip, setTooltip] = useState<HTMLDivElement | null>(null);
  const [occupiedCells, setOccupiedCells] = useState();

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1); // Adjust intensity
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

    // Handle panning and rotating
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI / 2; // Limit to top-down view

    const loader = new GLTFLoader();
    loader.load("/TestFBX/Mesh_all.glb", (gltf) => {
      scene.add(gltf.scene);

      // Compute bounding box for the entire model
      const boundingBox = new THREE.Box3().setFromObject(gltf.scene);
      setBoundingBox(boundingBox);
      const size = new THREE.Vector3();
      boundingBox.getSize(size);
      const center = new THREE.Vector3();
      boundingBox.getCenter(center);

      // Create grid covering the entire bounding box
      const gridSize = Math.max(size.x, size.z); // Use the largest dimension
      setGridSize(gridSize);
      const gridDivisions = 10; // Number of grid cells (adjust as needed)
      setGridDivisions(gridDivisions);
      const gridHelper = new THREE.GridHelper(gridSize, gridDivisions);
      gridHelper.position.set(center.x, boundingBox.min.y, center.z); // Align to the bottom of the model
      scene.add(gridHelper);

      // Find which grid cells contain meshes
      const occupiedCells = findOccupiedGridCells(
        gltf.scene,
        boundingBox,
        gridSize,
        gridDivisions
      );
    });

    // Position the camera
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 0, 0);

    const animate = function () {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    animate();

    let previousIntersected = null; // Keep track of the last hovered mesh

    const onMouseMove = (event) => {
      // Calculate mouse position in normalized device coordinates
      const canvasBounds = canvasRef.current?.getBoundingClientRect();
      if (!canvasBounds) return;

      mouse.x =
        ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
      mouse.y =
        -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      const intersectedObject = intersects
        .map((intersect) => intersect.object)
        .find((object) => object instanceof THREE.Mesh);

      if (intersectedObject) {
        // Restore previous mesh's color if it's different from the current one
        if (previousIntersected && previousIntersected !== intersectedObject) {
          previousIntersected.material.color.copy(
            previousIntersected.userData.originalColor
          );
          previousIntersected.material.needsUpdate = true;
        }

        // Store original color only once
        if (!intersectedObject.userData.originalColor) {
          intersectedObject.userData.originalColor =
            intersectedObject.material.color.clone();
        }

        // Apply new color
        intersectedObject.material = intersectedObject.material.clone();
        intersectedObject.material.color.set(0xff0000);
        intersectedObject.material.needsUpdate = true;

        // Create a tooltip element
        const tooltip = createTooltip(intersectedObject);

        canvasRef.current.addEventListener("mousemove", (event) =>
          onMouseMoveTooltip(event, tooltip)
        );

        // Update previousIntersected
        previousIntersected = intersectedObject;
      } else {
        // Reset the color if no object is hovered
        if (previousIntersected) {
          previousIntersected.material.color.copy(
            previousIntersected.userData.originalColor
          );
          previousIntersected.material.needsUpdate = true;
          previousIntersected = null; // Reset tracking
        }

        // Remove tooltip if no object is hovered
        if (tooltip && tooltip.parentNode) {
          tooltip.parentNode.removeChild(tooltip);
        }
      }
    };

    document.body.addEventListener("mousemove", onMouseMove);

    return () => {
      scene.clear();
      document.body.removeChild(renderer.domElement);
    };
  }, []);

  const createTooltip = (intersectedObject) => {
    const tooltip = document.createElement("div");
    tooltip.style.position = "absolute";
    tooltip.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    tooltip.style.color = "white";
    tooltip.style.padding = "5px";
    tooltip.style.borderRadius = "3px";
    tooltip.style.pointerEvents = "none";
    tooltip.style.zIndex = "1000";
    tooltip.innerHTML = `Mesh: ${intersectedObject.name || "Unnamed"}`;

    const tooltipTemp = tooltip;

    setTooltip(tooltipTemp);

    return tooltip;
  };

  const onMouseMoveTooltip = (event, tooltip) => {
    document.body.appendChild(tooltip);
    tooltip.style.left = `${event.clientX + 10}px`;
    tooltip.style.top = `${event.clientY + 10}px`;
  };

  // Function to check which grid cells contain meshes
  function findOccupiedGridCells(model, boundingBox, gridSize, gridDivisions) {
    const occupiedCells = [];
    const cellSize = gridSize / gridDivisions;

    model.traverse((child) => {
      if (child.isMesh) {
        const box = new THREE.Box3().setFromObject(child);
        const minX = Math.floor((box.min.x - boundingBox.min.x) / cellSize);
        const maxX = Math.ceil((box.max.x - boundingBox.min.x) / cellSize);
        const minZ = Math.floor((box.min.z - boundingBox.min.z) / cellSize);
        const maxZ = Math.ceil((box.max.z - boundingBox.min.z) / cellSize);

        occupiedCells.push({
          minX,
          maxX,
          minZ,
          maxZ,
        });
      }
    });

    return Array.from(occupiedCells);
  }

  return <canvas ref={canvasRef} />;
};

export default My3DMap;
