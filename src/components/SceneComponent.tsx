import { Camera } from "@babylonjs/core/Cameras/camera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { EngineOptions } from "@babylonjs/core/Engines/thinEngine";
import { EventState, Observer } from "@babylonjs/core/Misc/observable";
import { Scene, SceneOptions } from "@babylonjs/core/scene";
import { Nullable } from "@babylonjs/core/types.js";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useWindowSize } from "../lib/useWIndowSize";
import { EngineCanvasContext, EngineCanvasContextType } from "./Engine";
import { SceneContext, SceneContextType } from "./Scene";

export type BabylonjsProps = {
  antialias?: boolean;
  engineOptions?: EngineOptions;
  adaptToDeviceRatio?: boolean;
  renderChildrenWhenReady?: boolean;
  sceneOptions?: SceneOptions;
  onSceneReady: (scene: Scene) => void;
  /**
   * Automatically trigger engine resize when the canvas resizes (default: true)
   */
  observeCanvasResize?: boolean;
  onRender?: (scene: Scene) => void;
  children?: React.ReactNode;
};

export type OnFrameRenderFn = (
  eventData: Scene,
  eventState: EventState
) => void;

export const useBeforeRender = (
  callback: OnFrameRenderFn,
  mask?: number,
  insertFirst?: boolean,
  callOnce?: boolean
): void => {
  const { scene } = useContext(SceneContext);

  useEffect(() => {
    if (scene === null) {
      return;
    }

    const unregisterOnFirstCall: boolean = callOnce === true;
    const sceneObserver: Nullable<Observer<Scene>> =
      scene.onBeforeRenderObservable.add(
        callback,
        mask,
        insertFirst,
        undefined,
        unregisterOnFirstCall
      );

    if (unregisterOnFirstCall !== true) {
      return () => {
        scene.onBeforeRenderObservable.remove(sceneObserver);
      };
    }
  });
};

export const useAfterRender = (
  callback: OnFrameRenderFn,
  mask?: number,
  insertFirst?: boolean,
  callOnce?: boolean
): void => {
  const { scene } = useContext(SceneContext);

  useEffect(() => {
    if (scene === null) {
      return;
    }

    const unregisterOnFirstCall: boolean = callOnce === true;
    const sceneObserver: Nullable<Observer<Scene>> =
      scene.onAfterRenderObservable.add(
        callback,
        mask,
        insertFirst,
        undefined,
        unregisterOnFirstCall
      );

    if (unregisterOnFirstCall !== true) {
      return () => {
        scene.onAfterRenderObservable.remove(sceneObserver);
      };
    }
  });
};

/**
 * Handles creating a camera and attaching/disposing.
 * TODO: add new 4.2 parameters: useCtrlForPanning & panningMouseButton
 * @param createCameraFn function that creates and returns a camera
 * @param autoAttach Attach the input controls (default true)
 * @param noPreventDefault Events caught by controls should call prevent default
 * @param useCtrlForPanning (ArcRotateCamera only)
 * @param panningMoustButton (ArcRotateCamera only)
 */
export const useCamera = <T extends Camera>(
  createCameraFn: (scene: Scene) => T,
  autoAttach: boolean = true,
  noPreventDefault: boolean = true /*, useCtrlForPanning: boolean = false, panningMouseButton: number*/
): Nullable<T> => {
  const { scene } = useContext(SceneContext);
  const cameraRef = useRef<Nullable<T>>(null);

  useEffect(() => {
    if (scene === null) {
      console.warn("cannot create camera (scene not ready)");
      return;
    }

    const camera: T = createCameraFn(scene);
    if (autoAttach === true) {
      const canvas: HTMLCanvasElement = scene.getEngine().getRenderingCanvas()!;
      camera.attachControl(canvas, noPreventDefault);
    }
    cameraRef.current = camera;

    return () => {
      if (autoAttach === true) {
        // canvas is only needed for < 4.1
        const canvas: HTMLCanvasElement = scene
          .getEngine()
          .getRenderingCanvas()!;
        camera.detachControl(canvas);
      }
      camera.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  return cameraRef.current;
};

const SceneComponent = (
  props: BabylonjsProps & React.CanvasHTMLAttributes<HTMLCanvasElement>
) => {
  const reactCanvas = useRef<Nullable<HTMLCanvasElement>>(null);
  const {
    antialias,
    engineOptions,
    adaptToDeviceRatio,
    sceneOptions,
    onRender,
    renderChildrenWhenReady,
    children,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onSceneReady: _,
    ...rest
  } = props;

  const [sceneContext, setSceneContext] = useState<SceneContextType>({
    scene: null,
    sceneReady: false,
  });

  const [engineContext, setEngineContext] = useState<EngineCanvasContextType>({
    engine: null,
    canvas: null,
  });

  useEffect(() => {
    if (reactCanvas.current) {
      const engine = new Engine(
        reactCanvas.current,
        antialias,
        engineOptions,
        adaptToDeviceRatio
      );
      setEngineContext(() => ({
        engine,
        canvas: reactCanvas.current,
      }));

      let resizeObserver: Nullable<ResizeObserver> = null;

      const scene = new Scene(engine, sceneOptions);

      if (props.observeCanvasResize !== false && window.ResizeObserver) {
        resizeObserver = new ResizeObserver(() => {
          engine.resize();
          if (scene.activeCamera /* needed for rendering */) {
            // render to prevent flickering on resize
            if (typeof onRender === "function") {
              onRender(scene);
            }
            scene.render();
          }
        });
        resizeObserver.observe(reactCanvas.current);
      }

      const sceneIsReady = scene.isReady();
      if (sceneIsReady) {
        props.onSceneReady(scene);
      } else {
        scene.onReadyObservable.addOnce((scene) => {
          props.onSceneReady(scene);
          setSceneContext(() => ({
            canvas: reactCanvas.current,
            scene,
            engine,
            sceneReady: true,
          }));
        });
      }

      engine.runRenderLoop(() => {
        if (scene.activeCamera) {
          if (typeof onRender === "function") {
            onRender(scene);
          }
          scene.render();
        } else {
          console.warn("no active camera..");
        }
      });

      const resize = () => {
        scene.getEngine().resize();
      };

      if (window) {
        window.addEventListener("resize", resize);
      }

      setSceneContext(() => ({
        canvas: reactCanvas.current,
        scene,
        engine,
        sceneReady: sceneIsReady,
      }));

      return () => {
        // cleanup
        if (resizeObserver !== null) {
          resizeObserver.disconnect();
        }

        if (window) {
          window.removeEventListener("resize", resize);
        }

        scene.getEngine().dispose();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reactCanvas]);

  const { height, width } = useWindowSize();

  return (
    <>
      <canvas
        ref={reactCanvas}
        {...rest}
        style={{
          display: "block",
          width: width ? width - 10 : 0,
          height: height ? height - 10 : 0,
          touchAction: "none",
        }}
      />
      <EngineCanvasContext.Provider value={engineContext}>
        <SceneContext.Provider value={sceneContext}>
          {(renderChildrenWhenReady !== true ||
            (renderChildrenWhenReady === true && sceneContext.sceneReady)) &&
            children}
        </SceneContext.Provider>
      </EngineCanvasContext.Provider>
    </>
  );
};
export default SceneComponent;
