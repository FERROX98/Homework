import { Ground } from './ground.js';
import { Wall } from './wall.js';
import { mat4, vec3 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';
import { GradientSky } from './sky.js';
import { Model } from '../models/model.js';


const debug = false; 
export class Environment {
  constructor(gl, groundSize = 100) {
    this.gl = gl;

    this.ground = null;
    this.groundSize = groundSize;
    this.groundCenter = vec3.fromValues(0.0, 0.0, 0.0);

    this.wall = null;
    this.sky = null; 

    this.sun = null; 
    this.sunScale = 5;
    this.sunPosition = vec3.fromValues(-35, 110.0, 5.0);

    this.onModelsUpdated = null;

    this.modelTransforms = new Map();

    // sun - ground  
    this.dirLightDir = vec3.create();
    vec3.subtract(this.dirLightDir, this.sunPosition, this.groundCenter);
    vec3.normalize(this.dirLightDir, this.dirLightDir);
    
    this.dirLightColor = [1.0, 0.95, 0.8, 1.0];
    this.dirLightIntensity = 1.0;
 
    this.ambientLight = [0.4, 0.42, 0.45, 1.0];
    this.ambientIntensity = 0.14;
    
    this.updateLightDirection();
    
    this.init();
  } 

  init() {
    this.ground = new Ground(this.gl);
    console.log('Ground initialized');
    
    this.wall = new Wall(this.gl, this.groundSize);
    console.log('Walls initialized');

    this.sky = new GradientSky(this.gl);
    console.log('Sky initialized');
    
    this.loadSun();
    
    console.log('Environment initialization complete');
  }

  computeTransformMatrix(position, rotation, scale) {
    const transform = mat4.create();
    mat4.translate(transform, transform, position);
    mat4.rotateX(transform, transform, rotation[0]);
    mat4.rotateY(transform, transform, rotation[1]);
    mat4.rotateZ(transform, transform, rotation[2]);
    mat4.scale(transform, transform, scale);
    return transform;
  }

  addModel(model, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {

    // model space to world space transformation
    const transform = this.computeTransformMatrix(position, rotation, scale);

    this.modelTransforms.set(model, transform);
    console.log(`Added model ${model.name} to environment with transform:`, transform);
    
    //TODO FIX
    if (this.onModelsUpdated) {
      this.onModelsUpdated();
    }
  }
  
  updateModelTransform(model, position, rotation, scale) {
    const transform = this.computeTransformMatrix(position, rotation, scale);
    this.setModelTransform(model, transform);
  }

  setModelTransform(model, transform) {
    if (!this.modelTransforms.has(model)) {
      console.warn(`Model ${model.name} not found in environment, cannot set transform.`); 
      return;
    }
    this.modelTransforms.set(model, transform);
  }

  renderEnvironment(proj, view) {
    let trianglesCount = 0;

    const lights = {
      dirLightDir: this.dirLightDir,
      dirLightColor: this.dirLightColor,
      ambientLight: this.ambientLight,
      ambientIntensity: this.ambientIntensity
    };

    if (this.sky)
      trianglesCount += this.sky.render();
    
    if (this.ground)
      trianglesCount += this.ground.render(proj, view, lights);
    
    if (this.wall)
      trianglesCount += this.wall.render(proj, view, lights);
 
    for (const [model, transform] of this.modelTransforms) {
      if (!model.isVisible) {
        if (debug) console.warn(`Model ${model.name} is not visible, skipping render.`);
        continue;
      }

      if (transform)
        if (debug) console.log(`Rendering model ${model.name} with transform:`, transform);
        trianglesCount += model.render(proj, view, lights, transform);
    }
    return trianglesCount;
  }

  setDirectionalLightIntensity(intensity) {
    this.dirLightIntensity = Math.max(0, Math.min(2, intensity));
    
    this.dirLightColor = [
      1.0 * this.dirLightIntensity,
      0.9 * this.dirLightIntensity, 
      0.7 * this.dirLightIntensity
    ];
  }

  updateLightDirection() {
    vec3.subtract(this.dirLightDir, this.groundCenter, this.sunPosition);
    vec3.normalize(this.dirLightDir, this.dirLightDir);
  }

  setSunPosition(x, y, z) {
    vec3.set(this.sunPosition, x, y, z);
    this.updateLightDirection();
    
    if (this.sun) {
      this.updateModelTransform(this.sun, 
        [x, y, z], 
        [0, 0, 0], 
        [this.sunScale, this.sunScale, this.sunScale]
      );
    }    

    console.log(`Sun position set to: [${x}, ${y}, ${z}]`);
  }

  loadSun() {
    this.sun = new Model(this.gl, "sun.gltf", false);
    
    this.addModel(this.sun, 
      [this.sunPosition[0], this.sunPosition[1], this.sunPosition[2]], 
      [0, 0, 0], 
      [this.sunScale, this.sunScale, this.sunScale]
    );
    
    console.log('Sun model loaded');
  }

  getModelsList() {
    return this.modelTransforms.keys();
  }

  getModelTransform(model) {
    return this.modelTransforms.get(model) || null;
  }
}
