import { Ground } from './ground.js';
import { Wall } from './wall.js';
import { mat4 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';


export class Environment {
  constructor(gl) {
    this.gl = gl;

    this.ground = null;
    this.wall = null;

    this.modelTransforms = new Map();

    this.dirLightDir = [0.5, 1.0, 0.3];
    this.dirLightColor = [1.0, 1.0, 1.0];
    this.lightPos = [10.0, 10.0, 10.0];
    this.lightColor = [1.0, 1.0, 1.0];
    this.init();
  }

  // ok
  init() {
    console.log('Environment initialized');

    this.ground = new Ground(this.gl);
    console.log('Ground initialized');
    
    this.wall = new Wall(this.gl, 100);
    console.log('Walls initialized');

    // TODO maybe load all models here is better choice 
    // TODO load the sun? 
  }

  //ok 
  computeTransformMatrix(position, rotation, scale) {
    const transform = mat4.create();
    mat4.translate(transform, transform, position);
    mat4.rotateX(transform, transform, rotation[0]);
    mat4.rotateY(transform, transform, rotation[1]);
    mat4.rotateZ(transform, transform, rotation[2]);
    mat4.scale(transform, transform, scale);
    return transform;
  }

  // ok  
  addModel(model, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
    // model space to world space transformation
    const transform = this.computeTransformMatrix(position, rotation, scale);

    this.modelTransforms.set(model, transform);
    console.log(`Added model ${model.name} to environment with transform:`, transform);
  }

  // ok
  updateModelTransform(model, position, rotation, scale) {
    const transform = this.computeTransformMatrix(position, rotation, scale);
    this.modelTransforms.set(model, transform);
  }

  // ok
  renderEnvironment(proj, view) {
    let trianglesCount = 0;

    // TODO add sun and make it dynamic and connect to the panel 
    const lights = {
      lightPos: this.lightPos,
      lightColor: this.lightColor,
      dirLightDir: this.dirLightDir,
      dirLightColor: this.dirLightColor
    };

    if (this.ground) {
      trianglesCount += this.ground.render(proj, view, lights);
    }

    if (this.wall) {
      trianglesCount += this.wall.render(proj, view, lights);
    }

    for (const [model, transform] of this.modelTransforms) {
      if (!model.isVisible) {
        //console.warn(`Model ${model.name} is not visible, skipping render.`);
        continue;
      }

      if (transform) {
        trianglesCount += model.render(proj, view, lights, transform);
      }
    }
    return trianglesCount;
  }

  // TODO make a class for city layout
  createCityLayout() {

    const cityLayout = [
      { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
      { position: [5, 0, 5], rotation: [0, Math.PI / 4, 0], scale: [1, 1, 1] },
      { position: [-5, 0, -5], rotation: [0, -Math.PI / 4, 0], scale: [1, 1, 1] },
      { position: [10, 0, 0], rotation: [0, Math.PI / 2, 0], scale: [1, 1, 1] },
      { position: [-10, 0, 0], rotation: [0, -Math.PI / 2, 0], scale: [1, 1, 1] },
    ];

    return cityLayout;
  }
}
