"use client"; // Ensure this runs only on the client side

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const BuildingViewer = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xf0f0f0);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight1.position.set(5, 10, 5);
    directionalLight1.castShadow = true;
    scene.add(directionalLight1);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const neutralEnvironment = pmremGenerator.fromScene(
      new RoomEnvironment()
    ).texture;

    scene.environment = neutralEnvironment;
    // scene.background = neutralEnvironment;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;

    // Load the .glb model
    const loader = new GLTFLoader();
    let model;
    loader.load(
      "/final/final.gltf",
      (gltf) => {
        model = gltf.scene;
        scene.add(model);
        setIsLoading(false);
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      (error) => {
        console.error("An error happened during model loading:", error);
      }
    );

    // Raycaster for detecting clicks
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onMouseDoubleClick(event) {
      // if (isLoading || !model) return;

      // Convert mouse position to normalized device coordinates (-1 to +1)
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // Set up raycasting
      raycaster.setFromCamera(mouse, camera);

      // Find intersections
      const intersects = raycaster.intersectObject(model, true);
      if (intersects.length > 0) {
        const intersect = intersects[0];
        const object = intersect.object as THREE.Mesh;

        if (!object.geometry || !intersect.face) return;

        const uvAttribute = object.geometry.attributes.uv;
        if (!uvAttribute) return;

        // Get the vertex indices of the face
        const a = intersect.face.a;
        const b = intersect.face.b;
        const c = intersect.face.c;

        // Get UV coordinates for each vertex
        const uvA = new THREE.Vector2(uvAttribute.getX(a), uvAttribute.getY(a));
        const uvB = new THREE.Vector2(uvAttribute.getX(b), uvAttribute.getY(b));
        const uvC = new THREE.Vector2(uvAttribute.getX(c), uvAttribute.getY(c));

        console.log("Clicked face UV coordinates:", uvA, uvB, uvC);
        console.log("clicked intersec:", intersect);

        // Update the texture with an overlay
        updateTextureWithOverlay(
          "/final/B_D_A_normal.png",
          "/RedFish.jpg",
          [
            { x: 0.22937750816345215, y: 0.24684059619903564 },
            { x: 0.22937750816345215, y: 0.204645574092865 },
            { x: 0.21775352954864502, y: 0.204645574092865 },
            { x: 0.21775352954864502, y: 0.24684059619903564 },
          ],
          (updatedTexture) => {
            model.traverse((child) => {
              // update textures
              if (child instanceof THREE.Mesh) {
                // child.material.normalMap = updatedTexture;
                child.material.needsUpdate = true;
              }
            });
          }
        );
        updateTextureWithOverlay(
          "/final/B_D_A_baseColor.png",
          "/RedFish.jpg",
          [
            { x: 0.22937750816345215, y: 0.24684059619903564 },
            { x: 0.22937750816345215, y: 0.204645574092865 },
            { x: 0.21775352954864502, y: 0.204645574092865 },
            { x: 0.21775352954864502, y: 0.24684059619903564 },
          ],
          (updatedTexture) => {
            model.traverse((child) => {
              // update textures
              if (child instanceof THREE.Mesh) {
                child.material.map = updatedTexture;
                child.material.needsUpdate = true;
              }
            });
          }
        );
        updateTextureWithOverlay(
          "/final/B_D_A_occlusionRoughnessMetallic.png",
          "/RedFish.jpg",
          [
            { x: 0.22937750816345215, y: 0.24684059619903564 },
            { x: 0.22937750816345215, y: 0.204645574092865 },
            { x: 0.21775352954864502, y: 0.204645574092865 },
            { x: 0.21775352954864502, y: 0.24684059619903564 },
          ],
          (updatedTexture) => {
            model.traverse((child) => {
              // update textures
              if (child instanceof THREE.Mesh) {
                // child.material.roughnessMap = updatedTexture;
                // child.material.metalnessMap = updatedTexture;
                child.material.needsUpdate = true;
              }
            });
          }
        );
      }
    }

    // Event listener for clicks
    window.addEventListener("dblclick", onMouseDoubleClick);

    // Handle window resizing
    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", onWindowResize);

    // Camera position
    camera.position.set(0, 5, 10);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup function
    return () => {
      window.removeEventListener("dblclick", onMouseDoubleClick);
      window.removeEventListener("resize", onWindowResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  async function updateTextureWithOverlay(
    textureFile: string,
    overlayFile: string,
    uvCoords: { x: number; y: number }[],
    onComplete: (updatedTexture: THREE.Texture) => void
  ) {
    if (uvCoords.length !== 4) {
      console.error("Exactly 4 UV coordinates are required.");
      return;
    }

    // Load images
    const loadImage = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

    try {
      const [textureImg, overlayImg] = await Promise.all([
        loadImage(textureFile),
        loadImage(overlayFile),
      ]);

      // Create a canvas with the same size as the texture
      const canvas = document.createElement("canvas");
      canvas.width = textureImg.width;
      canvas.height = textureImg.height;
      const ctx = canvas.getContext("2d")!;

      // Draw the base texture
      ctx.drawImage(textureImg, 0, 0);

      // Convert UV coordinates to pixel positions
      const toCanvasCoords = (uv: { x: number; y: number }) => ({
        x: uv.x * canvas.width,
        y: (1 - uv.y) * canvas.height, // Flip Y because UV (0,0) is bottom-left
      });

      const pixels = uvCoords.map(toCanvasCoords);

      // Define the destination polygon
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pixels[0].x, pixels[0].y);
      ctx.lineTo(pixels[1].x, pixels[1].y);
      ctx.lineTo(pixels[2].x, pixels[2].y);
      ctx.lineTo(pixels[3].x, pixels[3].y);
      ctx.closePath();
      ctx.clip(); // Only draw inside this area

      // Fit overlay into the selected UV area
      ctx.drawImage(
        overlayImg,
        pixels[0].x,
        pixels[0].y,
        pixels[2].x - pixels[0].x, // Width
        pixels[2].y - pixels[0].y // Height
      );

      ctx.restore();

      // download the texture
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "texture.png";
      a.click();

      // Convert canvas to a texture
      const updatedTexture = new THREE.Texture(canvas);
      updatedTexture.needsUpdate = true;

      onComplete(updatedTexture); // Return the updated texture
    } catch (error) {
      console.error("Failed to load images:", error);
    }
  }

  return (
    <div ref={containerRef} style={{ width: "100vw", height: "100vh" }}>
      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(0,0,0,0.7)",
            color: "white",
            padding: "20px",
            borderRadius: "5px",
          }}
        >
          Loading model...
        </div>
      )}
    </div>
  );
};

export default BuildingViewer;
