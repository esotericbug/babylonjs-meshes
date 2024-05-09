import { FC, PropsWithChildren } from "react";

const WebGLCompat: FC<PropsWithChildren> = ({ children }) => {
  const isWebGLAvailable = () => {
    try {
      const canvas = document.createElement("canvas");
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
      );
    } catch (e) {
      return false;
    }
  };

  const isWebGL2Available = () => {
    try {
      const canvas = document.createElement("canvas");
      return !!(window.WebGL2RenderingContext && canvas.getContext("webgl2"));
    } catch (e) {
      return false;
    }
  };

  return (isWebGLAvailable() && isWebGL2Available()) ? (
    children
  ) : (
    <div
      style={{
        fontSize: "13px",
        fontWeight: "normal",
        textAlign: "center",
        background: "#fff",
        color: "#000",
        padding: "1.5em",
        width: "400px",
        margin: "5px",
      }}
    >
      Your device does not seem to
      <a
        href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation"
        style={{ color: "#000", textDecoration: "underline" }}
        target="_blank"
        rel="noreferrer"
      >
        WebGL
      </a>
    </div>
  );
};

export default WebGLCompat;
