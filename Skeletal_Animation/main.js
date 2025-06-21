import { Environment } from "./environment/environment.js";
import * as Render from "./animation/renders.js";
import { Model } from "./models/model.js";
import { CharacterController } from "./controllers/character_controller.js";
import { Character } from "./models/character.js";

export class Main {

  constructor(canvas) {
    this.canvas = canvas; 
    this.main(canvas);
  }

  main(canvas) {
      const self = this;
     window.onload = function () {
      self.gl = self.initWebGL(canvas);

      const gl = self.gl;
      if (!gl) {
        console.error("Failed to initialize WebGL.");
        return;
      }

      // initialize env 
      let env = new Environment(gl);

    //  let manson = new Model(gl, "tmp/mansion_low.gltf", false, true);
    // env.addModel(manson, [0, 13.5, 0], [0, 0, 0], [20, 20, 20]);

      // let earthModel = new Model(gl, "earth.gltf");
      // env.addModel(earthModel,  [270, 179, -10],[0, 0, 0], [33, 33, 33]); 

      let rb1 = new Character(gl, "rb5.gltf", true, true , false);
      let renderer = new Render.Renderer(gl, canvas, env);

      self.setupCharacterController(rb1, renderer, env);

      // Start rendering
      renderer.render();
    };
  }

  initWebGL(canvas) {
    if (!canvas) {
      console.error("Canvas element is not provided.");
      return;
    }
    canvas.oncontextmenu = function () {
      return false;
    };
    const gl = canvas.getContext("webgl2", { antialias: true, depth: true });

    if (!gl) {
      alert( "Unable to initialize WebGL.");
      return;
    }
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.DEPTH_TEST);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    return gl;
  }

  setupCharacterController(model, renderer, env) {
    if (model || model.isLoaded ) {
      const characterController = new CharacterController(model, env, renderer.camera);
      characterController.setPosition(50, 0, 60);
      renderer.setCharacterController(characterController);
    } else {
      setTimeout(() => {
        this.setupCharacterController(model, renderer, env);
      }, 2000);
    }
  }
}




