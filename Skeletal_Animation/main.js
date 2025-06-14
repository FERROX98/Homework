import { Environment } from "./environment/environment.js";
import * as Render from "./animation/renders.js";
import { Model } from "./models/model.js";
//import { UIControls } from "./ui/ui.js";
import { CharacterController } from "./controllers/character_controller.js";

const modelList = ["spaceship.gltf", "earth.gltf", "Woman_01.gltf", "scene.gltf", "mansion2.gltf", "laboratory.gltf"];
let currentModel = 0;



export function main(canvas) {
  if (!canvas) {
    console.error("Canvas element is not provided.");
    return;
  }

  // start ui
  // let uiControls = new UIControls();
  // uiControls.toggleLeftPanel();

  window.onload = function () {

    const gl = InitWebGL(canvas);
    if (!gl) {
      console.error("Failed to initialize WebGL.");
      return;
    }

    // initialize env 
    let env = new Environment(gl);

    // // Test only laboratory model
    // let labModel = new Model(gl, "laboratory2.gltf");
    // env.addModel(labModel, [70, 10, 1], [0, 0, 0], [10,10, 10]);

    let manson = new Model(gl, "mansion_low.gltf");
    env.addModel(manson, [0, 13.5, 0], [0, 0, 0], [20, 20, 20]);

    // let earthModel = new Model(gl, "earth.gltf");
    // env.addModel(earthModel,  [270, 179, -10],[0, 0, 0], [33, 33, 33]); 

    // let womanModel = new Model(gl, "walle.gltf");
    // env.addModel(womanModel, [103, 0, 0], [0, 0, 0], [4, 4, 4]);
//  let womanModel7 = new Model(gl, "wall2.gltf");
//     env.addModel(womanModel7, [233, 0, -10], [0, 0, 0], [10, 10, 10]);

    let womanModel5 = new Model(gl, "Woman_05.gltf");
    env.addModel(womanModel5, [23, 0, -10], [0, 0, 0], [1, 1, 1]);

    // let mart3Model = new Model(gl, "road.gltf");
    // env.addModel(mart3Model, [0, 0, 70], [0, 0, 0], [108, 1, 10]);
   
    //   let mart5Model = new Model(gl, "hill2.gltf");
    // env.addModel(mart5Model, [120, 0,-50], [0, 1.6, 0], [100, 100, 10]);


    // let mart4Model = new Model(gl, "mart3.gltf");
    // env.addModel(mart4Model, [0, 20, -100], [0, 0, 0], [80, 35, 10]);

    // initialize renderer
    let renderer = new Render.Renderer(gl, canvas, env);

    // set the player 
    setupCharacterController(womanModel5, renderer, env);

    // Start rendering
    renderer.render();
  };
}

// ok
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

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  console.log("WebGL initialized successfully");
  return gl;
}

/// ok
function setupCharacterController(model, renderer, env) {
  if (!model) {
    const characterController = new CharacterController(model, env, renderer.camera);
    renderer.setCharacterController(characterController);
  }
  else if (model.isLoaded) {
    console.log(`Setting up character controller ${model.name}`);

    const characterController = new CharacterController(model, env, renderer.camera);

    characterController.setPosition(50, 0, 60);

    renderer.setCharacterController(characterController);

  } else {
    //sleep 2 sec and repeat 
    setTimeout(() => {
      setupCharacterController(model, renderer, env);
    }, 2000);

  }
};


