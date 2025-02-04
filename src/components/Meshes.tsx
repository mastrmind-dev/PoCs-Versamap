import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export const Meshes = () => {
  const renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(0x222230);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  const light = new THREE.DirectionalLight();
  light.intensity = 2;
  light.position.set(2, 5, 10);
  light.castShadow = true;
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.1));

  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  const controls = new OrbitControls(camera, renderer.domElement);

  camera.position.set(-5, -5, 12);
  controls.target.set(-1, 2, 0);
  controls.update();

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  const floorGeometry = new THREE.PlaneGeometry(25, 20);
  const boxGeometry = new THREE.BoxGeometry(20, 20, 20);
  const cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2);
  const material = new THREE.MeshLambertMaterial();

//   const floorMesh = new THREE.Mesh(
//     floorGeometry,
//     new THREE.MeshLambertMaterial({ color: 0xffffff })
//   );
//   floorMesh.rotation.x = -Math.PI / 2;
//   floorMesh.name = "Floor";
//   floorMesh.receiveShadow = true;
//   scene.add(floorMesh);

  function createMeash(geometry, material, x, y, z, name) {
    const mesh = new THREE.Mesh(geometry, material.clone());
    mesh.position.set(x, y, z);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  const cylinders = new THREE.Group();
  cylinders.add(createMeash(cylinderGeometry, material, 3, 1, 0, "Cylinder A"));
//   cylinders.add(
//     createMeash(cylinderGeometry, material, 4.2, 1, 0, "Cylinder B")
//   );
//   cylinders.add(
//     createMeash(cylinderGeometry, material, 3.6, 3, 0, "Cylinder C")
//   );
  scene.add(cylinders);

  const boxes = new THREE.Group();
//   boxes.add(createMeash(boxGeometry, material, -1, 1, 0, "Box A"));
//   boxes.add(createMeash(boxGeometry, material, -4, 1, 0, "Box B"));
  boxes.add(createMeash(boxGeometry, material, -2.5, 3, 0, "Box C"));
  scene.add(boxes);

  animate();

  // ==================== start raycasting ====================
  const raycaster = new THREE.Raycaster();

  document.addEventListener("mousedown", onMouseDown);

  function onMouseDown(event) {
    const coords = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -((event.clientY / window.innerHeight) * 2) + 1
    );

    raycaster.setFromCamera(coords, camera);

    const intersections = raycaster.intersectObjects(scene.children, true);
    if (intersections.length > 0) {
      console.log("intersections:::", intersections);
      const selectedObject = intersections[0].object;
      const color = new THREE.Color(
        Math.random(),
        Math.random(),
        Math.random()
      );
      const selectedMaterial = (selectedObject as THREE.Mesh)
        .material as THREE.MeshLambertMaterial;
      selectedMaterial.color = color;
      console.log(`Selected object: ${selectedObject.name}`);
    }
  }
};
