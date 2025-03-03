"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const TestWithImage = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    const aspect = window.innerWidth / window.innerHeight;
    // const d = 400;
    // const camera = new THREE.OrthographicCamera(
    //   -d * aspect,
    //   d * aspect,
    //   d,
    //   -d,
    //   0.1,
    //   1000
    // );
    const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.position.z = 200;

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableRotate = false;

    // Load the map texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load("/Render_R3_5.png", (texture) => {
      const geometry = new THREE.PlaneGeometry(400, 400, 400, 400);
      const material = new THREE.MeshBasicMaterial({ map: texture });
      const plane = new THREE.Mesh(geometry, material);

      const boundingBox = new THREE.Box3().setFromObject(plane);
      const size = new THREE.Vector3();
      boundingBox.getSize(size);
      const center = new THREE.Vector3();
      boundingBox.getCenter(center);

      scene.add(plane);

      const gridSize = Math.max(size.x, size.y);

      //   add grid helper
      const gridHelper = new THREE.GridHelper(
        gridSize,
        400,
        0x000000,
        0x000000
      );
      gridHelper.rotation.x = Math.PI / 2;
      scene.add(gridHelper);
    });

    // Define land plots (manually setting coordinates)
    const plots = [
      { id: "Plot1", x: -180, y: -28, width: 8, height: 9 },
      { id: "Plot1", x: -33, y: 55, width: 8, height: 9 },
      { id: "Plot1", x: -75, y: 76, width: 8, height: 8 },
      { id: "Plot2", x: -0.2, y: 1, width: 12.5, height: 12 },
    ];

    const plotMeshes = [];
    plots.forEach((plot) => {
      const plotGeo = new THREE.PlaneGeometry(plot.width, plot.height);
      const plotMat = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0,
      });
      const plotMesh = new THREE.Mesh(plotGeo, plotMat);
      plotMesh.position.set(plot.x, plot.y, 0);
      plotMesh.userData.id = plot.id;
      scene.add(plotMesh);
      plotMeshes.push(plotMesh);
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function onClick(event) {
      const canvasBounds = mountRef.current.getBoundingClientRect();
      if (!canvasBounds) return;

      pointer.x =
        ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
      pointer.y =
        -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(plotMeshes);

      if (intersects.length > 0) {
        console.log("Selected Plot:", intersects[0].object.userData.id);
        (intersects[0].object as any).material.opacity = 0.5; // Highlight the selected plot
      }
    }

    window.addEventListener("click", onClick);

    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      mountRef.current.removeChild(renderer.domElement);
      window.removeEventListener("click", onClick);
    };
  }, []);

  return <div ref={mountRef} />;
};

export default TestWithImage;
