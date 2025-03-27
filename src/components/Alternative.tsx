import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import Modal from "./helper_components/Modal";
import Spinner from "./helper_components/Spinner";

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
  const model2 = useRef<THREE.Object3D | null>(null);
  const raycasterRef = useRef<THREE.Raycaster | null>(null);

  const [shouldSecondModelLoad, setShouldSecondModelLoad] = useState(false);
  const [isSecondModelLoaded, setIsSecondModelLoaded] = useState(false);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFirstModelLoaded, setIsFirstModelLoaded] = useState<boolean>(false);
 
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  useEffect(() => {
    if (!isFirstModelLoaded) loadLoadingManager();
    if (isFirstModelLoaded) loadRaycaster();
  }, [isFirstModelLoaded]);

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

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    environment.current = pmremGenerator.fromScene(
      new RoomEnvironment()
    ).texture;

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight1.position.set(5, 10, 5);
    directionalLight1.castShadow = true;
    scene.add(directionalLight1);

    orbitControls.current = new OrbitControls(camera, renderer.domElement);
    orbitControls.current.maxPolarAngle = Math.PI / 2 - 0.02;

    enableFPS();

    loader.current = new GLTFLoader(manager.current);
   
    loader.current.load("/low_poly_map.glb", (gltf1) => {
      model1.current = gltf1.scene;

      let i: number = 0;
      model1.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          ++i;
          child.name = "model" + "_" + i;
        }
      });

      scene.add(model1.current);
      model1.current.position.set(0, 0, 0);
      setIsFirstModelLoaded(true);
    });

    camera.position.set(0, 400, 0);
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

  useEffect(() => {
    if (shouldSecondModelLoad) {
      // Load second model
      loadSecondModel();
    }
    if (isSecondModelLoaded && !shouldSecondModelLoad) {
      removeSecondModel();
    }
  }, [shouldSecondModelLoad]);

  const handleDoubleClick = () => {
    handleOpenModal();
  };

  const loadLoadingManager = () => {
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
  };

  const loadRaycaster = () => {
    raycasterRef.current = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const onMouseMove = (event) => {
      if (!canvasRef.current) return;
      const canvasBounds = canvasRef.current.getBoundingClientRect();
      if (!canvasBounds) return;

      mouse.x =
        ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
      mouse.y =
        -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouse, cameraRef.current);

      const intersectedObject = raycasterRef.current.intersectObject(
        sceneRef.current,
        true
      )[0];

      if (intersectedObject) {
        console.log(
          cameraRef.current.position.distanceTo(
            intersectedObject.object.position
          )
        );
        if (
          cameraRef.current &&
          cameraRef.current.position.distanceTo(
            intersectedObject.object.position
          ) > 650 &&
          intersectedObject.object.name === "model_319" &&
          !shouldSecondModelLoad
        ) {
          setShouldSecondModelLoad(true);
        }

        if (
          model2.current &&
          cameraRef.current &&
          model2.current &&
          cameraRef.current.position.distanceTo(model2.current.position) <= 650
        ) {
          setShouldSecondModelLoad(false);
        }
      }
    };

    window.addEventListener("mousemove", onMouseMove);
  };


  const loadSecondModel = () => {
    if (sceneRef.current && (!isSecondModelLoaded || shouldSecondModelLoad)) {
      loader.current.load("/lands.glb", (gltf2) => {
        model2.current = gltf2.scene;
        model2.current.position.set(
          model1.current.position.x + 0.001,
          model1.current.position.y + 0.001,
          model1.current.position.z + 0.001
        );
        sceneRef.current!.add(model2.current);
        setIsSecondModelLoaded(true);
        handleCloseModal();
      });
    }
  };

  const removeSecondModel = () => {
    if (sceneRef.current && isSecondModelLoaded) {
      sceneRef.current.remove(model2.current);
      setIsSecondModelLoaded(false);
      model2.current = null;
    }
  };

  const enableFPS = () => {
    fpsControls.current = new PointerLockControls(
      cameraRef.current,
      canvasRef.current
    );

    movementSpeed.current = 0.1;
    velocity.current = new THREE.Vector3();
    direction.current = new THREE.Vector3();
    move.current = {
      forward: false,
      backward: false,
      left: false,
      right: false,
    };

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
