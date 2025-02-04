// pages/index.tsx
import { useEffect } from "react";
import GridOverlay from "../components/GridOverlay";
import LocationTracker from "../components/LocationTracker";
import * as MESH from "../components/Meshes";
import Land from "../components/Land";

const Home = () => {
  // useEffect(() => {
  //   MESH.Meshes();
  // }, []);
  
  return (
    <div>
      <h1>3D Model with Grid Overlay</h1>
      {/* <GridOverlay /> */}
      <LocationTracker />
      {/* <Land /> */}
    </div>
  );
};

export default Home;
