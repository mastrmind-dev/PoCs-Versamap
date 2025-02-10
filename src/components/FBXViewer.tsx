"use client"; // Necessary for Next.js 13+ with app router

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";

const FBXViewer = () => {
  const mountRef = useRef(null);
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      5,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

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

    const loader = new FBXLoader();
    loader.load("/TestFBX/Mesh_all.fbx", (fbx) => {
      fbx.scale.set(0.01, 0.01, 0.01); // Adjust scale if needed
      scene.add(fbx);

      const sunlight = new THREE.DirectionalLight(0xffffff, 1);
      sunlight.position.set(10, 20, 10);
      sunlight.castShadow = true;
      sunlight.shadow.mapSize.width = 2048;
      sunlight.shadow.mapSize.height = 2048;
      sunlight.shadow.camera.near = 0.5;
      sunlight.shadow.camera.far = 500;
      scene.add(sunlight);
      fbx.add(sunlight);

      const textureLoader = new THREE.TextureLoader();
      const baseColorTexture = textureLoader.load(
        "/TestFBX/Mesh_all_Building_BaseColor.png"
      );
      const metallicTexture = textureLoader.load(
        "/TestFBX/Mesh_all_Building_Metallic.png"
      );
      const normalTexture = textureLoader.load(
        "/TestFBX/Mesh_all_Building_Normal.png"
      );
      const roughnessTexture = textureLoader.load(
        "/TestFBX/Mesh_all_Building_Roughness.png"
      );
      const heightTexture = textureLoader.load(
        "/TestFBX/Mesh_all_Building_Height.png"
      );

      let previousIntersected = null; // Keep track of the last hovered mesh

      const onMouseMove = (event) => {
        // Calculate mouse position in normalized device coordinates
        const canvasBounds = mountRef.current?.getBoundingClientRect();
        if (!canvasBounds) return;

        mouse.x =
          ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
        mouse.y =
          -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;
        mouse.x =
          ((event.clientX - canvasBounds.left - 20) / canvasBounds.width) * 2 -
          1; // Adjusted to move pointer slightly to the left

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        if (intersects.length > 0) {
          const intersectedObject = intersects[0].object;

          if (intersectedObject instanceof THREE.Mesh) {
            // Restore previous mesh's color if it's different from the current one
            if (
              previousIntersected &&
              previousIntersected !== intersectedObject
            ) {
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

            // Update previousIntersected
            previousIntersected = intersectedObject;
          }
        } else {
          // Reset the color if no object is hovered
          if (previousIntersected) {
            previousIntersected.material.color.copy(
              previousIntersected.userData.originalColor
            );
            previousIntersected.material.needsUpdate = true;
            previousIntersected = null; // Reset tracking
          }
        }
      };

      window.addEventListener("mousemove", onMouseMove);

      fbx.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          //   console.log("child material:::", child.material);

          //   if (child.name === "B5") {
          //     const size = 5;
          //     const divisions = 500;
          //     const gridHelper = new THREE.GridHelper(size, divisions);
          //     gridHelper.scale.set(0.1, 1, 0.1); // Set fixed width
          //     gridHelper.position.copy(child.position);

          //     scene.add(gridHelper);
          //   }
          // Make sure the material supports displacement
          child.material = new THREE.MeshStandardMaterial({
            map: baseColorTexture, // Base color texture
            displacementMap: heightTexture, // Height map
            displacementScale: 0, // Adjust this value for the desired depth effect
            displacementBias: 0, // Adjust if needed
            metalnessMap: metallicTexture,
            normalMap: normalTexture,
            roughnessMap: roughnessTexture,
          });
          child.material.needsUpdate = true;
        }
      });

      //   traverse the model
      fbx.traverse((child) => {
        // console.log("child:::", child);
        if (child instanceof THREE.Mesh) {
          //   console.log(child);
        }
      });

      fbx.traverse((child) => {
        if (child instanceof THREE.Mesh && child.name === "B5") {
          child.traverse((grandChild) => {
            if (grandChild instanceof THREE.Mesh) {
              //   console.log("grandChild:::", grandChild);
            }
          });
        }
      });
    });

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    animate();

    return () => mountRef.current.removeChild(renderer.domElement);
  }, []);

  return <div ref={mountRef} />;
};

export default FBXViewer;
