import * as THREE from "three";
import { useEffect } from "react";

function replaceTextureArea(
  originalTexture: THREE.Texture,
  replacementImage: HTMLImageElement,
  minU: number,
  minV: number,
  maxU: number,
  maxV: number
) {
  const width = originalTexture.image.width;
  const height = originalTexture.image.height;

  // Create a canvas to modify the texture
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Draw the original texture
  ctx.drawImage(originalTexture.image, 0, 0);

  // Calculate the replacement position in pixels
  const x = minU * width;
  const y = (1 - maxV) * height; // Flip V coordinate
  const w = (maxU - minU) * width;
  const h = (maxV - minV) * height;
  // const w = 400;
  // const h = 400;

  // Draw the replacement image onto the canvas
  ctx.drawImage(replacementImage, x, y, w, h);

  // Update the texture
  const newTexture = new THREE.CanvasTexture(canvas);
  newTexture.needsUpdate = true;

  return newTexture;
}

export default function UVTextureReplacement() {
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load("/final/B_B_A_baseColor.png", (originalTexture) => {
      const replacementImg = new Image();
      replacementImg.src = "/Render.jpg";
      replacementImg.onload = () => {
        const newTexture = replaceTextureArea(
          originalTexture,
          replacementImg,
          0.9425945281982422, // minU
          0.010372638702392578, // minV
          0.991654634475708, // maxU
          0.05823945999145508 // maxV
        );

        // Apply to material
        const material = new THREE.MeshBasicMaterial({ map: newTexture });

        // Example: Apply to a plane
        const geometry = new THREE.PlaneGeometry(5, 5);
        const mesh = new THREE.Mesh(geometry, material);

        // Create a scene
        const scene = new THREE.Scene();
        scene.add(mesh);

        // Create a camera
        const camera = new THREE.PerspectiveCamera(
          75,
          window.innerWidth / window.innerHeight,
          0.1,
          1000
        );
        camera.position.z = 5;

        // Create a renderer
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        // Render the scene
        function animate() {
          requestAnimationFrame(animate);
          renderer.render(scene, camera);
        }
        animate();
      };
    });
  }, []);

  const downloadTexture = () => {
    const canvas = document.getElementById(
      "textureCanvas"
    ) as HTMLCanvasElement;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "texture.png";
    link.click();
  };

  return (
    <>
      <canvas id="textureCanvas" style={{ display: "none" }} />
      <button onClick={downloadTexture}>Download Texture</button>
    </>
  );
}
