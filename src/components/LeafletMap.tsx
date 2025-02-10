"use client"; // Necessary for Next.js 13+ with app router

import { useEffect, useRef } from "react";
import * as L from "leaflet"; // Leaflet for the map
import * as THREE from "three"; // Three.js for 3D model
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export default function LeafletWithGLB() {
  const mapRef = useRef(null);
  const threejsContainerRef = useRef(null);

  useEffect(() => {
    // Initialize the Leaflet map
    const map = L.map(mapRef.current).setView([51.505, -0.09], 13); // Example coordinates

    // Add a TileLayer to Leaflet map
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
      map
    );

    // Initialize Three.js renderer and attach to the map container
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    threejsContainerRef.current.appendChild(renderer.domElement);

    // Handle panning and rotating
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI / 2; // Limit to top-down view

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

    // Load the GLB model using Three.js GLTFLoader
    const loader = new GLTFLoader();
    loader.load("/TestFBX/Mesh_all.glb", (gltf) => {
      scene.add(gltf.scene);
      gltf.scene.scale.set(1, 1, 1); // Scale your model accordingly
      gltf.scene.position.set(0, 0, 0); // Set position
    });

    // Adjust camera position
    camera.position.z = 5;

    // Sync Three.js with the Leaflet map's rotation and position
    map.on("move", () => {
      const latLng = map.getCenter();
      const zoom = map.getZoom();

      // Convert map position to Three.js scene coordinates
      const x = latLng.lng;
      const y = latLng.lat;
      // Sync camera or model position based on zoom/latlng

      // Rotate or adjust Three.js model based on Leaflet map's view
      renderer.render(scene, camera);
    });

    // Rendering the 3D scene
    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }

    animate(); // Start rendering loop

    return () => {
      // Clean up the map and Three.js renderer on unmount
      map.remove();
      renderer.dispose();
    };
  }, []);

  return (
    <div>
      <div
        ref={mapRef}
        style={{ height: "100vh", position: "absolute", top: 0, left: 0 }}
      />
      <div
        ref={threejsContainerRef}
        style={{ position: "absolute", top: 0, left: 0 }}
      />
    </div>
  );
}
