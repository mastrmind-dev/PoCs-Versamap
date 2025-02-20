// "use client";
// pages/index.tsx

import dynamic from "next/dynamic";
// import TestWithImage from "../components/TestWithImage";
import WithCoordinates from "../components/WithCoordinates";
import WithCoordinates2D from "../components/WithCoordinates2D";

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
      {/* <TestWithImage /> */}
      <WithCoordinates />
      {/* <WithCoordinates2D /> */}
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
