// import React, { useState, useEffect, useRef } from "react";
// import ReactImageMapper from "react-image-mapper";

// // Function to scale grid coordinates to image pixel coordinates
// const scaleCoordinates = (gridCoord, imageSize, gridSize) => {
//   return (gridCoord / gridSize) * imageSize;
// };

// const MyImageMap = () => {
//   const imageRef = useRef(null); // Ref to access the image
//   const canvasRef = useRef(null); // Ref to access the canvas
//   const [highlightedAreas, setHighlightedAreas] = useState([]);
//   const imageWidth = 1000; // Image width in pixels
//   const imageHeight = 800; // Image height in pixels
//   const gridWidth = 10; // Number of grid cells in the x direction
//   const gridHeight = 8; // Number of grid cells in the y direction

//   useEffect(() => {
//     // Highlighted areas with coordinates to scale and highlight on the grid
//     const areas = [
//       {
//         coords: [
//           scaleCoordinates(0, imageWidth, gridWidth), // x1
//           scaleCoordinates(8, imageHeight, gridHeight), // y1
//           scaleCoordinates(-4, imageWidth, gridWidth), // x2
//           scaleCoordinates(2, imageHeight, gridHeight), // y2
//         ],
//         fillColor: "rgba(255, 0, 0, 0.5)", // Red color to highlight
//       },
//       // More areas can be added as needed
//     ];
//     setHighlightedAreas(areas);
//   }, []);

//   // Function to draw the grid on canvas
//   const drawGrid = () => {
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext("2d");
//     const cellWidth = imageWidth / gridWidth;
//     const cellHeight = imageHeight / gridHeight;

//     // Draw grid lines
//     ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous grid
//     ctx.strokeStyle = "#000"; // Grid line color
//     ctx.lineWidth = 1;

//     for (let i = 0; i <= gridWidth; i++) {
//       ctx.beginPath();
//       ctx.moveTo(i * cellWidth, 0);
//       ctx.lineTo(i * cellWidth, imageHeight);
//       ctx.stroke();
//     }

//     for (let i = 0; i <= gridHeight; i++) {
//       ctx.beginPath();
//       ctx.moveTo(0, i * cellHeight);
//       ctx.lineTo(imageWidth, i * cellHeight);
//       ctx.stroke();
//     }

//     // Highlight the areas
//     highlightedAreas.forEach((area) => {
//       ctx.fillStyle = area.fillColor;
//       ctx.globalAlpha = 0.5;
//       ctx.fillRect(
//         area.coords[0],
//         area.coords[1],
//         area.coords[2] - area.coords[0],
//         area.coords[3] - area.coords[1]
//       );
//     });
//   };

//   useEffect(() => {
//     drawGrid(); // Call drawGrid whenever highlighted areas change
//   }, [highlightedAreas]);

//   const map = {
//     name: "landMap",
//     areas: highlightedAreas.map((area) => ({
//       shape: "rect", // Rectangle shape for each highlighted area
//       coords: area.coords,
//       fillColor: area.fillColor,
//     })),
//   };

//   return (
//     <div>
//       <div style={{ position: "relative" }}>
//         <img
//           ref={imageRef}
//           src="your-map-image.jpg" // Your map image
//           width={imageWidth}
//           height={imageHeight}
//           alt="Map"
//         />
//         <canvas
//           ref={canvasRef}
//           width={imageWidth}
//           height={imageHeight}
//           style={{
//             position: "absolute",
//             top: 0,
//             left: 0,
//             pointerEvents: "none", // Make canvas non-interactive (so the image is clickable)
//           }}
//         />
//       </div>
//       <ReactImageMapper src="/TopView.svg" map={map} />
//     </div>
//   );
// };

// export default MyImageMap;
