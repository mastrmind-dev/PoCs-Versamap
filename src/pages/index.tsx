// "use client";
// pages/index.tsx
import { useEffect } from "react";
import GridOverlay from "../components/GridOverlay";
import LocationTracker from "../components/LocationTracker";
import * as MESH from "../components/Meshes";
import Land from "../components/Land";
import FBXViewer from "../components/FBXViewer";
import LeafletWithGLB from "../components/LeafletMap";

import dynamic from "next/dynamic";
import WithCoordinates from "../components/WithCoordinates";
import TwoDMap from "../components/twoDMap";
import OrthoCam from "../components/OrthoCam";
import AfricaMap from "../components/SVGAfrica";
import SingleMeshDifferentMaterials from "../components/test/SingleMeshDifferentMaterials";

const Map = dynamic(() => import("../components/LeafletMap"), { ssr: false });

const Home = () => {
  // useEffect(() => {
  //   MESH.Meshes();
  // }, []);

  return (
    <div>
      <h1>3D Model with Grid Overlay</h1>
      {/* <GridOverlay /> */}
      {/* <LocationTracker /> */}
      <WithCoordinates />
      {/* <TwoDMap /> */}
      {/* <OrthoCam /> */}
      {/* <AfricaMap /> */}
      {/* <LeafletWithGLB /> */}
      {/* <Map /> */}
      {/* <Land /> */}
      {/* <FBXViewer /> */}
      {/* <SingleMeshDifferentMaterials /> */}
    </div>
  );
};

export default Home;
