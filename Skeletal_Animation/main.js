
import { Environment } from "./environment/environment.js";
import * as Render from "./animation/renders.js";
import { Model } from "./models/model.js";
import { createUI, UIControls } from "./ui/ui.js";

const modelList = ["spaceship.gltf"];
let currentModel = 0;

export function main(canvas) {
  if (!canvas) {
    console.error("Canvas element is not provided.");
    return;
  }
  window.onload = function () {

    const gl = InitWebGL(canvas);
    if (!gl) {
      console.error("Failed to initialize WebGL.");
      return;
    }
    let env = new Environment(gl);
    let model = new Model(gl, modelList[currentModel]);
    env.setModel(model);
    
    setModelControls(gl, model, env, currentModel);
    let uiControls = new UIControls();
    

    
    let renderer = new Render.Renderer(gl, canvas, env);
    renderer.render();
  };
}

function InitWebGL(canvas) {
  canvas.oncontextmenu = function () {
    return false;
  };
  const gl = canvas.getContext("webgl2", { antialias: true, depth: true });

  if (!gl) {
    alert(
      "Unable to initialize WebGL. Your browser or machine may not support it."
    );
    return;
  }
  gl.clearColor(0, 0, 0, 0);
  gl.enable(gl.DEPTH_TEST);
  console.log("WebGL initialized successfully");
  return gl;
}

function setModelControls(gl, model, env, currentModel) {
  document.getElementById("prevModel").addEventListener("click", () => {
      currentModel = (currentModel - 1 + modelList.length) % modelList.length;
     // loadGLTF(gl,`models/assets/${modelList[currentModel]}`)
      let model = new Model(gl, modelList[currentModel]);
      env.setModel(model);
    });

    document.getElementById("nextModel").addEventListener("click", () => {
      currentModel = (currentModel + 1) % modelList.length;
     // loadGLTF(gl, `models/assets/${modelList[currentModel]}`)
      let model = new Model(gl, modelList[currentModel]);
      env.setModel(model);
    });

    window.setTextureEnabled = function (enabled) {
      if (model) {
        env.model.toggleTextures(enabled);
      }
    }
    const modelNameElem = document.getElementById("model-name");
    if (modelNameElem && env.model && env.model.name) {
      modelNameElem.textContent = env.model.name;
    }
  }
