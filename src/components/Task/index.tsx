import {
    Color3,
    FreeCamera,
    HemisphericLight,
    Material,
    MeshBuilder,
    Nullable,
    Scene,
    SceneLoader,
    ShaderMaterial,
    StandardMaterial,
    Vector3,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { FC, useRef } from "react";
import fragmentShader from "../../shaders/fragment.glsl";
import vertexShader from "../../shaders/vertex.glsl";
import SceneComponent from "../SceneComponent";
import WebGLCompat from "../WebGLCompat";
import styles from "./index.module.css";

const Task: FC = () => {
  const spanRef = useRef<HTMLSpanElement>(null);

  // script to return a mesh object when the mouse hovers over it
  const getHoveredMesh = (scene: Scene) => {
    // get pointer info
    const pointer = scene.pick(scene.pointerX, scene.pointerY);
    if (pointer.pickedMesh) {
      // check if the picked mesh is pickable
      if (pointer.pickedMesh.isPickable) {
        return pointer.pickedMesh;
      } else {
        return null;
      }
    } else {
      return null;
    }
  };
  const onSceneReady = async (scene: Scene) => {
    // create and position a camera
    const camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);

    // Set camera target
    camera.setTarget(Vector3.Zero());

    const canvas = scene.getEngine().getRenderingCanvas();

    // Create the spheres with varied diameters and overlap them

    const sphere1 = MeshBuilder.CreateSphere("sphere1", { diameter: 3 }, scene);

    const sphere2 = MeshBuilder.CreateSphere(
      "sphere2",
      { diameter: 2.5 },
      scene
    );
    sphere2.position.set(1, 1, 0);

    const sphere3 = MeshBuilder.CreateSphere("sphere3", { diameter: 2 }, scene);
    sphere3.position.set(2.5, 0.5, 0);

    // Create a standard material
    const material1 = new StandardMaterial("material1", scene);
    material1.diffuseColor = new Color3(0.5, 0.4, 1);
    sphere1.material = material1;
    const material2 = new StandardMaterial("material2", scene);

    material2.diffuseColor = new Color3(0.7, 0.3, 1);
    sphere2.material = material2;

    const material3 = new StandardMaterial("material3", scene);
    material3.diffuseColor = new Color3(0.2, 0.8, 1);

    sphere3.material = material3;

    // downloaded a custom .obj from https://people.sc.fsu.edu/~jburkardt/data/obj/dodecahedron.obj

    const result = await SceneLoader.ImportMeshAsync(
      undefined,
      "/assets/",
      "dodecahedron.obj",
      scene
    );

    // get the mesh in a singular object
    const customMesh = result.meshes[0];
    customMesh.name = "Dodecahedron";
    customMesh.position.set(1.5, 0.5, -2);
    const customMaterial = new StandardMaterial("customMaterial", scene);
    customMaterial.ambientColor = new Color3(0.1, 0.1, 1);
    customMaterial.diffuseColor = new Color3(0.2, 0.1, 1);
    customMesh.material = customMaterial;

    // attach camera control to canvas
    camera.attachControl(canvas, true);

    // added lighting
    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

    light.intensity = 0.7;

    MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);

    scene.enableDepthRenderer();

    const meshes = scene.meshes.reduce<
      { name: string; material: Nullable<Material> }[]
    >((acc, value) => {
      acc.push({ name: value.name, material: value.material });
      return acc;
    }, []);

    scene.onPointerMove = () => {
      const restoreMeshMaterials = () => {
        scene.meshes.forEach((originalMesh) => {
          meshes?.forEach((mesh) => {
            if (mesh.name === originalMesh.name) {
              originalMesh.material = mesh.material;
            }
          });
        });
      };
      const hoveredMesh = getHoveredMesh(scene);

      // import and add shaders

      const customMaterial = new ShaderMaterial(
        "customOutline",
        scene,
        {
          vertexSource: vertexShader,
          fragmentSource: fragmentShader,
        },
        {
          attributes: ["position", "normal"],
          uniforms: ["worldViewProjection", "outlineColor", "outlineAlpha"],
        }
      );
      if (hoveredMesh) {
        restoreMeshMaterials();
        customMaterial.setColor3("outlineColor", new Color3(1, 0, 0));
        customMaterial.setFloat("outlineAlpha", 0.3);

        hoveredMesh.material = customMaterial;
        spanRef.current!.innerHTML = `Hovering over : <span style="color: #0FFF50">${hoveredMesh.name}</span>`;
      } else {
        restoreMeshMaterials();

        // No mesh hovered
        spanRef.current!.innerHTML = `Not hovering over any`;
      }
    };
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.overlay}>
          <span className={styles.message} ref={spanRef}>
            Not hovering over any mesh
          </span>
        </div>
        <WebGLCompat>
          <SceneComponent antialias onSceneReady={onSceneReady} />
        </WebGLCompat>
      </div>
    </>
  );
};

export default Task;
