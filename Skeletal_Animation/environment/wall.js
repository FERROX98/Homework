import { mat4 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';
import { Model } from "../models/model.js";

export class Wall {
  constructor(gl, groundSize = 100, modelPath = 'wall4.gltf') {
    this.gl = gl;
    this.groundSize = groundSize;
    this.modelPath = modelPath;

    this.isLoaded = false;
    this.models = [];
    this.loadWalls();
  }

loadWalls() {
  const thickness = 2;
  const size = this.groundSize;

  const wallHeight = 10;
  const wallDepth = thickness;
  const wallLength = size  + wallDepth;

  const configs = [
    { translation: [0, 0, size + wallDepth ], rotationY: 0, scale: [wallLength+2, wallHeight, wallDepth] },
    { translation: [0, 0, -size - wallDepth ], rotationY: 0, scale: [wallLength+2, wallHeight, wallDepth] },
    { translation: [size + wallDepth , 0, 0], rotationY: Math.PI / 2, scale: [wallLength+2, wallHeight, wallDepth] },
    { translation: [-size - wallDepth , 0, 0], rotationY: Math.PI / 2, scale: [wallLength+2, wallHeight, wallDepth] },
  ];

  let loadedCount = 0;

  for (const config of configs) {
    const model = new Model(this.gl, `${this.modelPath}`);
    this.models.push(model);

    const modelMatrix = mat4.create();

    mat4.translate(modelMatrix, modelMatrix, config.translation);
    mat4.rotateY(modelMatrix, modelMatrix, config.rotationY);
    mat4.scale(modelMatrix, modelMatrix, config.scale); 

    model.modelMatrix = modelMatrix;

    const checkLoaded = () => {
      if (model.isLoaded) {
        loadedCount++;
        if (loadedCount === configs.length) {
          this.isLoaded = true;
        }
      } else {
          //sleep 2 sec and repeat 
          setTimeout(() => {
            checkLoaded();
          }, 2000);     
        }
    };
    checkLoaded();

    console.log(`Loading wall model: ${this.modelPath} at position ${config.translation}, scale: ${config.scale}`);
  }
}

  render(proj, view, lights) {
    if (!this.isLoaded) return 0;
   // console.log("Rendering walls...");
    let triangleCount = 0;
    for (const model of this.models) {
      triangleCount += model.render(proj, view, lights, model.modelMatrix);
    }

    return triangleCount;
  }
}
