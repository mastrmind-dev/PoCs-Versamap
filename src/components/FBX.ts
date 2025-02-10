 const loader = new FBXLoader();
    loader.load("/TestFBX/Mesh_all.fbx", (fbx) => {
      fbx.scale.set(0.01, 0.01, 0.01); // Adjust scale if needed
      scene.add(fbx);

      const textureLoader = new THREE.TextureLoader();
      const baseColorTexture = textureLoader.load(
        "/TestFBX/Mesh_all_Building_BaseColor.png"
      );
      const metallicTexture = textureLoader.load(
        "/TestFBX/Mesh_all_Building_Metallic.png"
      );
      const normalTexture = textureLoader.load(
        "/TestFBX/Mesh_all_Building_Normal.png"
      );
      const roughnessTexture = textureLoader.load(
        "/TestFBX/Mesh_all_Building_Roughness.png"
      );
      const heightTexture = textureLoader.load(
        "/TestFBX/Mesh_all_Building_Height.png"
      );

      let previousIntersected = null; // Keep track of the last hovered mesh

      const onMouseMove = (event) => {
        // Calculate mouse position in normalized device coordinates
        const canvasBounds = mountRef.current?.getBoundingClientRect();
        if (!canvasBounds) return;

        mouse.x =
          ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
        mouse.y =
          -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;
        mouse.x =
          ((event.clientX - canvasBounds.left - 20) / canvasBounds.width) * 2 -
          1; // Adjusted to move pointer slightly to the left

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        if (intersects.length > 0) {
          const intersectedObject = intersects[0].object;

          if (intersectedObject instanceof THREE.Mesh) {
            // Restore previous mesh's color if it's different from the current one
            if (
              previousIntersected &&
              previousIntersected !== intersectedObject
            ) {
              previousIntersected.material.color.copy(
                previousIntersected.userData.originalColor
              );
              previousIntersected.material.needsUpdate = true;
            }

            // Store original color only once
            if (!intersectedObject.userData.originalColor) {
              intersectedObject.userData.originalColor =
                intersectedObject.material.color.clone();
            }

            // Apply new color
            intersectedObject.material = intersectedObject.material.clone();
            intersectedObject.material.color.set(0xff0000);
            intersectedObject.material.needsUpdate = true;

            // Update previousIntersected
            previousIntersected = intersectedObject;
          }
        } else {
          // Reset the color if no object is hovered
          if (previousIntersected) {
            previousIntersected.material.color.copy(
              previousIntersected.userData.originalColor
            );
            previousIntersected.material.needsUpdate = true;
            previousIntersected = null; // Reset tracking
          }
        }
      };

      window.addEventListener("mousemove", onMouseMove);

      fbx.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          //   console.log("child material:::", child.material);

          //   if (child.name === "B5") {
          //     const size = 5;
          //     const divisions = 500;
          //     const gridHelper = new THREE.GridHelper(size, divisions);
          //     gridHelper.scale.set(0.1, 1, 0.1); // Set fixed width
          //     gridHelper.position.copy(child.position);

          //     scene.add(gridHelper);
          //   }

          child.material.map = baseColorTexture;
          child.material.metalnessMap = metallicTexture;
          child.material.normalMap = normalTexture;
          child.material.roughnessMap = roughnessTexture;
          child.material.displacementMap = heightTexture;
          child.material.needsUpdate = true;
        }
      });

      //   traverse the model
      fbx.traverse((child) => {
        // console.log("child:::", child);
        if (child instanceof THREE.Mesh) {
          //   console.log(child);
        }
      });

      fbx.traverse((child) => {
        if (child instanceof THREE.Mesh && child.name === "B5") {
          child.traverse((grandChild) => {
            if (grandChild instanceof THREE.Mesh) {
              //   console.log("grandChild:::", grandChild);
            }
          });
        }
      });
    });