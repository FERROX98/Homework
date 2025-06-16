import { Ground } from './ground.js';
import { Wall } from './wall.js';
import { mat4, vec3 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';
import { GradientSky } from './sky.js';
import { Model } from '../models/model.js';


const debug = false; 
export class Environment {
  constructor(gl) {
    this.gl = gl;

    this.ground = null;
    this.wall = null;
    this.sky = null; 
    this.sun = null; // Sun model
    
    // Callback for UI updates
    this.onModelsUpdated = null;

    this.modelTransforms = new Map();

    // Sun position (fixed position in the sky)
    this.sunPosition = vec3.fromValues(50.0, 80.0, 30.0);
    
    // Ground center position (where light should point)
    this.groundCenter = vec3.fromValues(0.0, 0.0, 0.0);
    
    // Calculate light direction from sun to ground
    this.dirLightDir = vec3.create();
    vec3.subtract(this.dirLightDir, this.groundCenter, this.sunPosition);
    vec3.normalize(this.dirLightDir, this.dirLightDir);
    
    this.dirLightColor = [1.0, 0.9, 0.7]; // Warm sunlight
    this.dirLightIntensity = 1.0;
    
    this.lightPos = [10.0, 10.0, 10.0];
    this.lightColor = [1.0, 1.0, 1.0];
    
    // Initialize light direction
    this.updateLightDirection();
    
    this.init();
  }  // ok
  init() {
    console.log('Environment initialized');

    this.ground = new Ground(this.gl);
    console.log('Ground initialized');
    
    this.wall = new Wall(this.gl, 100);
    console.log('Walls initialized');

    this.sky = new GradientSky(this.gl);
    console.log('Sky initialized');
    
    // Load sun model
    this.loadSun();
    
    console.log('Environment initialization complete');
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
    
    // Notify UI of model list update
    if (this.onModelsUpdated) {
      this.onModelsUpdated();
    }
  }
 
  // ok
  updateModelTransform(model, position, rotation, scale) {
    if (model.name== 'chair')  console.log(`Updating model ${model.name} transform`);
    const transform = this.computeTransformMatrix(position, rotation, scale);
     if (model.name== 'chair') console.log(`New transform for ${model.name}:`, transform);
    this.modelTransforms.set(model, transform);
  }

  renderEnvironment(proj, view) {
    let trianglesCount = 0;

    const lights = {
      lightPos: this.lightPos,
      lightColor: this.lightColor,
      dirLightDir: this.dirLightDir,
      dirLightColor: this.dirLightColor
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


  // Set directional light intensity
  setDirectionalLightIntensity(intensity) {
    this.dirLightIntensity = Math.max(0, Math.min(2, intensity)); // Clamp between 0 and 2
    
    // Apply intensity to light color
    this.dirLightColor = [
      1.0 * this.dirLightIntensity,
      0.9 * this.dirLightIntensity, 
      0.7 * this.dirLightIntensity
    ];
    
    console.log(`Directional light intensity set to: ${this.dirLightIntensity}`);
  }

  // Update light direction based on sun and ground positions
  updateLightDirection() {
    vec3.subtract(this.dirLightDir, this.groundCenter, this.sunPosition);
    vec3.normalize(this.dirLightDir, this.dirLightDir);
    
    console.log(`Light direction updated: [${this.dirLightDir[0].toFixed(3)}, ${this.dirLightDir[1].toFixed(3)}, ${this.dirLightDir[2].toFixed(3)}]`);
    console.log(`Sun position: [${this.sunPosition[0]}, ${this.sunPosition[1]}, ${this.sunPosition[2]}]`);
    console.log(`Ground center: [${this.groundCenter[0]}, ${this.groundCenter[1]}, ${this.groundCenter[2]}]`);
  }

  // Set sun position and update light direction
  setSunPosition(x, y, z) {
    vec3.set(this.sunPosition, x, y, z);
    this.updateLightDirection();
    
    // Update sun model position if it exists
    if (this.sun) {
      this.updateModelTransform(this.sun, 
        [x, y, z], 
        [0, 0, 0], 
        [3, 3, 3] // Scale the sun model
      );
    }
    
    console.log(`Sun position set to: [${x}, ${y}, ${z}]`);
  }

  // Load and setup sun model
  loadSun() {
    // Use sun model  
    this.sun = new Model(this.gl, "sun.gltf", false);
    
    // Position the sun at its initial position
    this.addModel(this.sun, 
      [this.sunPosition[0], this.sunPosition[1], this.sunPosition[2]], 
      [0, 0, 0], 
      [3, 3, 3] // Smaller scale for sun visibility
    );
    
    console.log('Sun model loaded and positioned');
  }

  getModelsList() {
    const modelList = [];
    for (const model of this.modelTransforms.keys()) {
      modelList.push(model);
    }
    return modelList;
  }
}
