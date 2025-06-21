import { Ground } from './ground.js';
import { Wall } from './wall.js';
import { mat4, vec3 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';
import { GradientSky } from './sky.js';
import { Model } from '../models/model.js';
import { Character } from '../models/character.js';

const debug = false; 
export class Environment {
  constructor(gl, groundSize = 150) {
    this.gl = gl;

    this.ground = null;
    this.groundSize = groundSize;
    this.groundCenter = vec3.fromValues(0.0, 0.0, 0.0);

    this.wall = null;
    this.sky = null; 

    this.pointLight = null; 
    this.lightScale = 5;

    this.onModelsUpdated = null;

    this.modelTransforms = new Map();
    
    this.pointLightColor = [1.0, 0.95, 0.8, 1.0];
    this.dirLightIntensity = 1.0;
 
    this.ambientLight = [0.4, 0.42, 0.45, 1.0];
    this.ambientIntensity = 0.3;
    
    // light - ground   
    this.lightPosition = vec3.fromValues(-35, 110.0, 5.0); 
    this.baselightPosition = this.lightPosition.slice(); 
    
    // no used 
    this.dirLightDir = vec3.create();

    this.setLightPosition(this.lightPosition[0], this.lightPosition[1], this.lightPosition[2]);  
    
    this.hdr = true;
    this.attenuationRange = 1.0; 
    this.attenuationEnabled = true;

    this.updateLightDirection();
    this.init();
  } 

  init() {
    this.ground = new Ground(this.gl, this.groundSize);
    console.log('Ground initialized');
    
    this.wall = new Wall(this.gl, this.groundSize);
    console.log('Walls initialized');

    this.sky = new GradientSky(this.gl);
    console.log('Sky initialized');
    
    this.loadPointLight();
    
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

    let lights = {
      attenuationEnabled: this.attenuationEnabled,
      hdr: this.hdr,
      attenuationRange: this.attenuationRange,
      pointLightColor: this.pointLightColor,
      ambientLight: this.ambientLight,
      ambientIntensity: this.ambientIntensity,
      lightPosition: this.lightPosition
    };

    if (this.sky && this.sky.isLoaded)
      trianglesCount += this.sky.render(proj, view, lights);
    
    if (this.ground && this.ground.isLoaded)
      trianglesCount += this.ground.render(proj, view, lights);
    
    if (this.wall && this.wall.isLoaded)
      trianglesCount += this.wall.render(proj, view, lights);
 
    for (const [model, transform] of this.modelTransforms) {
      if (!model.isVisible) {

        continue;
      }

      if (transform){
        trianglesCount += model.render(proj, view, lights, transform);
      }
    }
    return trianglesCount;
  }



  getModelsList() {
    return this.modelTransforms.keys().filter(model => !(model instanceof Character) && !(model.name === 'chair'));
  }

  getModelTransform(model) {
    return this.modelTransforms.get(model) || null;
  }

  setModelVisibility(model, isVisible) {
    if (this.modelTransforms.has(model)) {
      model.isVisible = isVisible;
    }
  }

  resetLightPosition() {
    vec3.copy(this.lightPosition, this.baselightPosition);
    this.updateLightDirection();
    this.updateModelTransform(this.pointLight, 
      [this.lightPosition[0], this.lightPosition[1], this.lightPosition[2]], 
      [0, 0, 0], 
      [this.lightScale, this.lightScale, this.lightScale]
    );

    this.attenuationEnabled = true;
    this.attenuationRange = 1.0;
    this.hdr = true;
  }
    // no used 
  setDirectionalLightIntensity(intensity) {
    this.dirLightIntensity = Math.max(0, Math.min(20, intensity));
    
    this.pointLightColor = [
      1.0 * this.dirLightIntensity,
      0.95 * this.dirLightIntensity, 
      0.85 * this.dirLightIntensity, 
      1.0
    ];
  }
  // no used 
  updateLightDirection() {
    vec3.subtract(this.dirLightDir, this.groundCenter, this.lightPosition);
    vec3.normalize(this.dirLightDir, this.dirLightDir);
  }

  setLightPosition(x, y, z) { 
    vec3.set(this.lightPosition, x, y, z);
    this.updateLightDirection();
    if (this.pointLight) {
      this.updateModelTransform(this.pointLight, 
        [x, y, z], 
        [0, 0, 0], 
        [this.lightScale, this.lightScale, this.lightScale]
      );
    }    
  }

  loadPointLight() {
    this.pointLight = new Model(this.gl, "pointLight.gltf", false);
    
    this.addModel(this.pointLight, 
      [this.lightPosition[0], this.lightPosition[1], this.lightPosition[2]], 
      [0, 0, 0], 
      [this.lightScale, this.lightScale, this.lightScale]
    );
    

  }
}
