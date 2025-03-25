import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment";
import Modal from "./helper_components/Modal";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import Spinner from "./helper_components/Spinner";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const ThreeScene = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const environment = useRef<THREE.Texture | null>(null);
  const manager = useRef<THREE.LoadingManager | null>(null);
  const loader = useRef<GLTFLoader | null>(null);
  const orbitControls = useRef<OrbitControls>(null);
  const usingFPSControls = useRef<boolean>(false);
  const direction = useRef<THREE.Vector3 | null>(null);
  const move = useRef<{
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
  }>({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });
  const velocity = useRef<THREE.Vector3 | null>(null);
  const fpsControls = useRef<PointerLockControls | null>(null);
  const movementSpeed = useRef<number>(0);
  const model1 = useRef<THREE.Object3D | null>(null);

  const [isSecondModelLoaded, setIsSecondModelLoaded] = useState(false);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  //   loading manager.current
  useEffect(() => {
    manager.current = new THREE.LoadingManager();
    manager.current.onStart = function (url, itemsLoaded, itemsTotal) {
      console.log(
        "Started loading file: " +
          url +
          ".\nLoaded " +
          itemsLoaded +
          " of " +
          itemsTotal +
          " files."
      );
      setIsLoading(true);
    };

    manager.current.onLoad = function () {
      console.log("Loading complete!");
      setIsLoading(false);
    };

    manager.current.onProgress = function (url, itemsLoaded, itemsTotal) {
      console.log(
        "Loading file: " +
          url +
          ".\nLoaded " +
          itemsLoaded +
          " of " +
          itemsTotal +
          " files."
      );
    };

    manager.current.onError = function (url) {
      console.log("There was an error loading " + url);
    };
  });

  useEffect(() => {
    const camera = new THREE.PerspectiveCamera(
      100,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current!,
      logarithmicDepthBuffer: true,
    });
    renderer.setSize(window.innerWidth - 100, window.innerHeight);

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Ambient Light - softens shadows and brightens everything
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    environment.current = pmremGenerator.fromScene(
      new RoomEnvironment()
    ).texture;

    // Directional Light - mimics sunlight, casts shadows
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight1.position.set(5, 10, 5);
    directionalLight1.castShadow = true;
    scene.add(directionalLight1);

    orbitControls.current = new OrbitControls(camera, renderer.domElement);
    orbitControls.current.maxPolarAngle = Math.PI / 2 - 0.02;

    enableFPS();

    loader.current = new GLTFLoader(manager.current);

    // Load first model
    loader.current.load("/low_poly_map.glb", (gltf1) => {
      model1.current = gltf1.scene;
      scene.add(model1.current);
      model1.current.position.set(0, 0, 0);
    });

    camera.position.set(0, 10, 10);
    camera.lookAt(0, 0, 0);

    scene.environment = environment.current;
    scene.scale.set(10, 10, 10);

    const animate = () => {
      enableControllers();
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.dispose();
      scene.clear();
    };
  }, []);

  //   =========== load second model on zoom in =============
  //   useEffect(() => {
  //     const onWheel = () => {
  //       console.log("Current Zoom Level:", cameraRef.current.fov);
  //       const zoomLevel = cameraRef.current.position.z;
  //       if (zoomLevel < 5 && !isSecondModelLoaded) {
  //         handleDoubleClick();
  //       }
  //     };

  //     window.addEventListener("wheel", onWheel);
  //     return () => window.removeEventListener("wheel", onWheel);
  //   }, [cameraRef.current]);

  const handleDoubleClick = () => {
    handleOpenModal();
  };

  const loadSecondModel = () => {
    if (sceneRef.current && !isSecondModelLoaded) {
      loader.current.load("/lands.glb", (gltf2) => {
        const model2 = gltf2.scene;
        model2.position.set(
          model1.current.position.x + 0.001,
          model1.current.position.y + 0.001,
          model1.current.position.z + 0.001
        );
        // model2.scale.set(2, 2, 2);
        sceneRef.current!.add(model2);
        setIsSecondModelLoaded(true);
        handleCloseModal();

        model2.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.material.polygonOffset = true;
            child.material.polygonOffsetFactor = -1; // Moves the polygons slightly forward
            child.material.polygonOffsetUnits = -1;
          }
        });
      });
    }
  };

  const enableFPS = () => {
    fpsControls.current = new PointerLockControls(
      cameraRef.current,
      canvasRef.current
    );

    // Movement settings
    movementSpeed.current = 0.1;
    velocity.current = new THREE.Vector3();
    direction.current = new THREE.Vector3();
    move.current = {
      forward: false,
      backward: false,
      left: false,
      right: false,
    };

    // Event Listeners for First-Person Movement
    const handleKeyDown = (event) => {
      switch (event.code) {
        case "KeyW":
          move.current.forward = true;
          break;
        case "KeyS":
          move.current.backward = true;
          break;
        case "KeyA":
          move.current.left = true;
          break;
        case "KeyD":
          move.current.right = true;
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    const handleKeyUp = (event) => {
      switch (event.code) {
        case "KeyW":
          move.current.forward = false;
          break;
        case "KeyS":
          move.current.backward = false;
          break;
        case "KeyA":
          move.current.left = false;
          break;
        case "KeyD":
          move.current.right = false;
          break;
      }
    };
    document.addEventListener("keyup", handleKeyUp);

    // Toggle Between Orbit and First-Person Controls
    usingFPSControls.current = false;

    const oHandler = (event) => {
      if (event.code === "KeyO" && !usingFPSControls.current) {
        // setLastCamPos(camera.position.clone());
        cameraRef.current.position.set(
          cameraRef.current.position.x,
          10,
          cameraRef.current.position.z
        ); // Example position, adjust as needed
        cameraRef.current.lookAt(new THREE.Vector3(0, 0, 10)); // Example target, adjust as needed

        fpsControls.current.lock();
        usingFPSControls.current = true;
        orbitControls.current.enabled = false;
      }
    };
    document.addEventListener("keydown", oHandler);

    const pHandler = (event) => {
      if (event.code === "KeyP" && usingFPSControls.current) {
        fpsControls.current.unlock();
        usingFPSControls.current = false;
        orbitControls.current.enabled = true;
      }
    };
    document.addEventListener("keydown", pHandler);

    const handlePointerLockChange = () => {
      if (document.pointerLockElement === canvasRef.current) {
        usingFPSControls.current = true;
        orbitControls.current.enabled = false;
      } else {
        usingFPSControls.current = false;
        orbitControls.current.enabled = true;
      }
    };

    document.addEventListener("pointerlockchange", handlePointerLockChange);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && usingFPSControls.current) {
        fpsControls.current.lock();
      }
    };

    function handleFocus() {
      if (usingFPSControls.current) {
        fpsControls.current.lock();
      }
    }
    window.addEventListener("focus", handleFocus);

    document.addEventListener("visibilitychange", handleVisibilityChange);
  };

  const enableControllers = () => {
    if (usingFPSControls.current) {
      // First-Person Movement
      direction.current.z =
        Number(move.current.forward) - Number(move.current.backward);
      direction.current.x =
        Number(move.current.right) - Number(move.current.left);
      direction.current.normalize(); // Keep speed consistent

      velocity.current.x -= velocity.current.x * 0.1; // Smooth deceleration
      velocity.current.z -= velocity.current.z * 0.1;
      velocity.current.addScaledVector(
        direction.current,
        movementSpeed.current
      );

      fpsControls.current.moveRight(velocity.current.x);
      fpsControls.current.moveForward(velocity.current.z);
    } else {
      // Orbit Controls Update
      orbitControls.current.update();
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <canvas ref={canvasRef} onDoubleClick={handleDoubleClick} />
      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <h2>Need to see the real view of this land?</h2>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
          <button
            onClick={loadSecondModel}
            style={{
              marginRight: "10px",
              width: "50px",
              height: "30px",
              color: "blue",
              backgroundColor: "lightblue",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Yes {isLoading ? <Spinner /> : null}
          </button>
          <button
            onClick={handleCloseModal}
            style={{
              marginRight: "10px",
              width: "50px",
              height: "30px",
              color: "blue",
              backgroundColor: "lightblue",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
            }}
          >
            No
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ThreeScene;
