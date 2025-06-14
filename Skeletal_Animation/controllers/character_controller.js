import { vec3 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';

export class CharacterController {
  // OK
  constructor(model, environment, camera) {
    this.model = model;
    this.environment = environment;
    this.camera = camera;

    this.position = vec3.fromValues(0, 0, 0);
    this.rotation = Math.PI/2; 
    this.scale = vec3.fromValues(4, 4, 4);
    this.velocity = vec3.create();
    
    // Movement e Animation walk fp 
    this.moveSpeed = 0.4;
    this.baseSpeed =  this.moveSpeed;
    this.rotationSpeed = 0.4;
    this.isMoving = false;

    // up and down bobbing effect
    this.durWalk = 1; 
    this.numSteps = 25; 
    this.step = (this.durWalk/this.numSteps) ;//* (this.moveSpeed *10); 
    this.currentStep = 0; 
    this.bobAmount = 0.1;
    this.baseHeight = 0; 
   
    // Input
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false,
      arrowup: false,
      arrowdown: false,
      arrowleft: false,
      arrowright: false
    };
    
    // Camera settings
    this.cameraDistance = 12.0;
    this.cameraHeight = 5.0;
    this.cameraOffset = vec3.fromValues(0, this.cameraHeight, this.cameraDistance);
    this.firstPersonHeightOffset = 5.8;  
    
    // first person
    this.originalModelScale = vec3.clone(this.scale);
    
    this.initControls();
    if (this.model)
      this.updateTransform();
    
    // the rotation of the camera became the rotation of the player
    this.camera.onFirstPersonRotationChange = (rotation) => {
      this.rotation = rotation;
    };
  }

  // TODO connect to the UI when change speed 
  updateSpeed(newSpeed) {
    this.numSteps = 10/ (this.moveSpeed /this.baseSpeed); 
    this.step = (this.durWalk/this.numSteps) ;
   // console.log('Step duration:', this.step);
  }
  
  // ok
  initControls() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (this.keys.hasOwnProperty(key)) {
        this.keys[key] = true;
        e.preventDefault();
      }
    });
    
    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if (this.keys.hasOwnProperty(key)) {
        this.keys[key] = false;
        e.preventDefault();
      }
    });
  }

  // ok
  handleCameraToggle() {
    if (!this.model) 
      return; 
    
    console.log('Current camera mode:', this.camera.cameraMode);
    const newMode = this.camera.toggleCameraMode();
    console.log('New camera mode:', newMode);
    
    if (newMode === 'firstPerson') {
        const fpPosition = [0,0,0];
        vec3.copy(fpPosition, this.position);
        fpPosition[1] += this.firstPersonHeightOffset;

        this.hideModel();
        this.camera.setFirstPersonView(fpPosition, this.rotation);

    } else if (newMode === 'thirdPerson' || newMode === 'orbital'){

        this.showModel();
        this.updateCamera(); 
    } 
  }

  // todo 
  hideModel() {
    // TODO keep this and set env 
    this.model.isVisible = false;     
  }
  
  // todo 
  showModel() {
    this.model.isVisible = true; 
    this.updateTransform();
  }
  
  // todo 
  updateTransform() {
    // TODO remove this check 
    if (this.model.isVisible) {
      this.environment.updateModelTransform(
        this.model,
        [this.position[0], this.position[1], this.position[2]],
        [0, this.rotation, 0],
        [this.scale[0], this.scale[1], this.scale[2]]
      );
    }
  }

  //ok 
  update() {
    this.handleMovement();
    this.updateAnimation();
    if (this.model)
      this.updateTransform();
    this.updateCamera();
  }
  
  // ok just some comments
  handleMovement() {
    
    // if orbital ignore movement  
    if (this.camera.isOrbital) {
      this.isMoving = false;
      return;
    }
    
    // set velocity to zero 
    vec3.set(this.velocity, 0, 0, 0);
    this.isMoving = false;
    
    // forward = yaw(y) * z 
    // but theta is is expressed is cw so -theta 
    // sin(-theta) = -sin(theta)
    // cos(-theta) = Math.cos(theta)
    const forward = vec3.fromValues(
       Math.sin(this.rotation),
      0,
       Math.cos(this.rotation),
    );
    
    // right = yaw(y) * x 
    // const right = vec3.fromValues(
    //   Math.cos(this.rotation),
    //   0,
    //   -Math.sin(this.rotation)
    // );
    
    let moveDirection = vec3.create();
    
    // TODO set walk animation
    if (this.keys.w || this.keys.arrowup) {
      vec3.add(moveDirection, moveDirection, forward);
      this.isMoving = true;
    }

    // TODO set back animation 
    if (this.keys.s || this.keys.arrowdown) {
      vec3.subtract(moveDirection, moveDirection, forward);
      this.isMoving = true;
    }
    
    if (this.keys.a || this.keys.arrowleft) {
      this.rotation += this.rotationSpeed;
      // move only the camera 
      if (this.camera.isFirstPerson) {
        this.camera.firstPersonRotation = this.rotation;
      }
    }
    
    if (this.keys.d || this.keys.arrowright) {
      this.rotation -= this.rotationSpeed;
      if (this.camera.isFirstPerson) {
        this.camera.firstPersonRotation = this.rotation;
      }
    }

    // wrap angle to [-2*PI, 2*PI]
    this.rotation = ((this.rotation) % (2*Math.PI)); 

    // Normalize to obtain unit vector  
    if (vec3.length(moveDirection) > 0) {
      vec3.normalize(moveDirection, moveDirection);
      vec3.scale(moveDirection, moveDirection, this.moveSpeed);
      
      this.position[0] += moveDirection[0];
      this.position[2] += moveDirection[2];
    }
  }
  
  // ok to decomment
  updateAnimation() {
    // TODO apply only in first person 
    if (this.isMoving) {
     // console.log(' step :', this.step);
      //console.log('Current step upd:', this.currentStep, 'Walk time:', this.walkTime);
      this.currentStep  = (this.step + this.currentStep )% this.durWalk
   //   console.log('Current step upd:', this.currentStep, 'Walk time:', this.walkTime);
      const heightOffset =  this.currentStep * this.bobAmount; 
     // console.log('Height offset:', heightOffset);
      this.position[1] = this.baseHeight + Math.abs(heightOffset);
    } else {
      this.currentStep = 0;
      this.walkTime = 0;
      this.position[1] = this.baseHeight;
    }
  }
  
  // ok
  updateCamera() {
    if (this.camera.isFirstPerson) {

      const fpPosition = vec3.create();
      vec3.copy(fpPosition, this.position);
      fpPosition[1] += this.firstPersonHeightOffset;
      
      this.hideModel();
    
      this.camera.updateFirstPersonPosition(fpPosition);
      this.camera.firstPersonRotation = this.rotation;

    } else if (this.camera.isThirdPerson) {
        this.showModel();

      // TODO follow the orientation of the player after a certain distance 
     // this.camera.updateThirdPersonFollow(this.rotation, this.isMoving,0 );
      
      const cameraTarget = vec3.create();
      vec3.copy(cameraTarget, this.position);
      cameraTarget[1] += 4.0;
      
      this.camera.updateThirdPersonTarget(cameraTarget);

    } else if (this.camera.isOrbital) {
      if (this.model)
        this.showModel();
    }
    
    this.camera.updateView();
  }
  
  // ok to debug 
  getState() {
    return {
      position: Array.from(this.position),
      rotation: this.rotation,
      pitch: this.camera.firstPersonPitch || 0,
      isMoving: this.isMoving,
      keys: { ...this.keys },
      cameraMode: this.camera.cameraMode,
      modelVisible: this.model.isVisible,
    };
  }
  
  // ok initial postion 
  setPosition(x, y, z) {
    vec3.set(this.position, x, y, z);
    this.baseHeight = y;
    this.updateTransform();
  }
  
}