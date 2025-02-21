// "use client";
// pages/index.tsx

import dynamic from "next/dynamic";
// import TestWithImage from "../components/TestWithImage";
import WithCoordinates from "../components/WithCoordinates";
import WithCoordinates2D from "../components/WithCoordinates2D";
import { useState } from "react";

const Map = dynamic(() => import("../components/LeafletMap"), { ssr: false });

const Home = () => {
  // useEffect(() => {
  //   MESH.Meshes();
  // }, []);

  const [isSwitched, setIsSwitched] = useState(false);

  return (
    <div>
      <div>
        <h1
          style={{
            fontFamily: "'Orbitron', sans-serif",
            color: "#61dafb",
            textShadow: "0 0 10px #61dafb, 0 0 20px #61dafb, 0 0 30px #61dafb",
            textAlign: "center",
            margin: "20px 0",
            fontSize: "2.5rem",
            // WebkitTextStroke: "1px #43dafb", // Add border to letters
          }}
        >
          3D / 2D Map
        </h1>
        <button
          onClick={() => {
            setIsSwitched(!isSwitched);
          }}
          style={{
            backgroundColor: "#282c34",
            color: "#61dafb",
            border: "none",
            padding: "10px 20px",
            fontSize: "16px",
            fontWeight: "bold",
            fontFamily: "'Cambria', Courier, monospace",
            cursor: "pointer",
            borderRadius: "5px",
            transition: "background-color 0.3s ease",
            marginLeft: "33px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#61dafb";
            e.currentTarget.style.color = "#282c34";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#282c34";
            e.currentTarget.style.color = "#61dafb";
          }}
        >
          Switch to {isSwitched ? "3D" : "2D"} Map
        </button>
        <div
          style={{
            display: isSwitched ? "none" : "flex",
          }}
        >
          <p style={{ marginLeft: "33px" }}>
            <span style={{ fontWeight: "bold" }}>
              First Person Controllers: <br />{" "}
            </span>
            • Press 'O' to turn on First Person view
            <br />
            • Press 'W' to move forward and rotate the mouse to change the
            direction
            <br />• Press 'P' or 'Esc' to turn off First Person view
          </p>

          <p style={{ marginLeft: "33px" }}>
            <span style={{ fontWeight: "bold" }}>
              Orbit Controllers: <br />{" "}
            </span>
            • Default view comes with Orbit controllers
            <br />
            • Press 'Ctrl' (windows) or '⌘' (mac) + left click and drag for
            panning around the map
            <br />• Left click and drag for rotating the map
            <br />• Scroll for zooming in and out
          </p>
        </div>

        <div
          style={{
            display: !isSwitched ? "none" : "flex",
          }}
        >
          <p style={{ marginLeft: "33px" }}>
            <span style={{ fontWeight: "bold" }}>
              Controllers: <br />{" "}
            </span>
            • Press 'Ctrl' (windows) or '⌘' (mac) + left click and drag for
            panning around the map
            <br />• Scroll for zooming in and out
          </p>
        </div>
      </div>
      {/* <GridOverlay /> */}
      {/* <LocationTracker /> */}
      {/* <TestWithImage /> */}
      <div
        style={{
          //   border: "2px solid #61dafb",
          // padding: "10px",
          //   borderRadius: "10px",
          //   boxShadow: "0 0 10px #61dafb, 0 0 20px #61dafb, 0 0 30px #61dafb",
          display: "flex",
          justifyContent: "center",
        }}
      >
        {isSwitched ? <WithCoordinates2D /> : <WithCoordinates />}
      </div>
      {/* <TwoDMap /> */}
      {/* <OrthoCam /> */}
      {/* <AfricaMap /> */}
      {/* <LeafletWithGLB /> */}
      {/* <Map /> */}
      {/* <Land /> */}
      {/* <FBXViewer /> */}
      {/* <SingleMeshDifferentMaterials /> */}
      {/* <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "5px",
          height: "5px",
          background: "transparent",
          border: "2px solid red",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none", // Ensure the crosshair does not interfere with mouse events
        }}
      ></div> */}
    </div>
  );
};

export default Home;
