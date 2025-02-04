"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const LocationTracker = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Handle panning and rotating
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI / 2; // Limit to top-down view

    const ambientLight = new THREE.AmbientLight(0xffffff, 1); // Adjust intensity
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Load 3D model
    const loader = new GLTFLoader();
    loader.load("/Billboard/test1.glb", (gltf) => {
      const model = gltf.scene;
      model.position.set(-10, 0, 0); // Adjust position based on your scene
      scene.add(model);

      // Iterate through model's children
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const worldPos = new THREE.Vector3();
          child.getWorldPosition(worldPos);
          console.log(
            `Building position: ${worldPos.x}, ${worldPos.y}, ${worldPos.z}`
          );
        }
      });
    });

    loader.load("/Floor/test1.glb", (gltf) => {
      const model = gltf.scene;
      model.position.set(0, 0, 10); // Adjust position based on your scene
      scene.add(model);

      // Iterate through model's children
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const worldPos = new THREE.Vector3();
          child.getWorldPosition(worldPos);
          console.log(
            `Building position: ${worldPos.x}, ${worldPos.y}, ${worldPos.z}`
          );
        }
      });
    });

    loader.load("/Building/test1.glb", (gltf) => {
      const model = gltf.scene;
      model.position.set(0, 0, 0);
      scene.add(model);

      // Iterate through model's children
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const worldPos = new THREE.Vector3();
          child.getWorldPosition(worldPos);
          console.log(
            `Building position: ${worldPos.x}, ${worldPos.y}, ${worldPos.z}`
          );
        }
      });
    });

    // Add a grid
    const size = 30;
    const divisions = 20;
    const gridHelper = new THREE.GridHelper(size, divisions);
    gridHelper.position.y = 0.1;
    scene.add(gridHelper);

    // Camera position
    camera.position.set(0, 50, 100);
    camera.lookAt(0, 0, 0);

    // Render loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    let currentIntersected: THREE.Object3D | null = null;
    const originalColor = new THREE.Color();

    const onMouseMove = (event: MouseEvent) => {
      // Calculate mouse position in normalized device coordinates
      const canvasBounds = mountRef.current?.getBoundingClientRect();
      if (!canvasBounds) return;

      mouse.x =
        ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
      mouse.y =
        -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;
      // mouse.z = 100;

      // Update the raycaster with the camera and mouse position
      raycaster.setFromCamera(mouse, camera);

      // Calculate objects intersecting the raycaster
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (
        intersects.length > 0 &&
        intersects[intersects.length - 1].object.name === "Floor"
      ) {
        const intersectedObject = intersects[intersects.length - 1].object;

        if (currentIntersected !== intersectedObject) {
          if (currentIntersected) {
            // Reset the color of the previously intersected object
            const previousMaterial = (currentIntersected as THREE.Mesh)
              .material as THREE.MeshLambertMaterial;
            previousMaterial.color.copy(originalColor);
          }

          // Store the original color of the new intersected object
          const newMaterial = (intersectedObject as THREE.Mesh)
            .material as THREE.MeshLambertMaterial;
          originalColor.copy(newMaterial.color);

          // Change the color of the new intersected object
          newMaterial.color.set("red");

          currentIntersected = intersectedObject;
        }
      } else {
        if (currentIntersected) {
          // Reset the color of the previously intersected object
          const previousMaterial = (currentIntersected as THREE.Mesh)
            .material as THREE.MeshLambertMaterial;
          previousMaterial.color.copy(originalColor);
          currentIntersected = null;
        }
      }
    };

    window.addEventListener("mousemove", onMouseMove);

    // Cleanup function
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default LocationTracker;
