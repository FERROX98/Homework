import { vec3 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';
import { Model } from '../models/model.js';
import { AnimationSelector } from '../ui/animation_selector.js';
import { CameraControls } from '../ui/camera_controls.js';

const debug = false;
export class CharacterController {

  constructor(model, environment, camera) {
    this.model = model;
    this.environment = environment;
    this.cameraControls = new CameraControls();
    this.camera = camera;

    // animation obj
    if (this.model){
      this.chair = new Model(this.model.gl, "chair.gltf", false, false);
      environment.addModel(  this.chair );
      model.chair = this.chair; 
    }

    this.position = vec3.fromValues(0, 0, 0);
    this.rotation = Math.PI / 2;
    this.scale = vec3.fromValues(0.08, 0.08, 0.08);
    this.velocity = vec3.create();

    this.environment.addModel(this.model, this.position, [0, this.rotation, 0], this.scale);

    // TODO get from ground Boundary limits for position correction
    this.boundaryLimits = {
      minX: -95,  // Slightly inside ground boundaries to avoid edge issues
      maxX: 95,
      minZ: -95,
      maxZ: 95,
      minY: -2,   // Prevent falling below ground
      maxY: 50    // Reasonable height limit
    };

    // Movement e Animation walk fp 
    this.moveSpeed = 0.058;
    this.baseSpeed = this.moveSpeed;
    this.rotationSpeed = 0.4;
    this.isMoving = false;

    // bobbing effect
    this.durWalk = 2;
    this.numSteps = 60;
    this.step = (this.durWalk / this.numSteps);//* (this.moveSpeed *10); 
    this.currentStep = 0;
    this.bobAmount = 0.03;
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
    // the rotation of the camera = the rotation of the player
    this.camera.onFirstPersonRotationChange = (rotation) => {
      this.rotation = rotation;
    };

    this.initControls();
    this.setUpControls();
  }

  // TODO connect to the UI when change speed 
  updateSpeed(newSpeed) {
    this.moveSpeed = newSpeed;
    this.numSteps = 10 / (this.moveSpeed / this.baseSpeed);
    this.step = (this.durWalk / this.numSteps);
    // console.log('Step duration:', this.step);
  }

  setUpControls() {

    this.cameraControls.setReferences(this.camera, this, this.environment);
    this.animationSelector = new AnimationSelector(this);

    if (debug) console.log('setCharacterController updated with character controller');

    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'c') {
        this.handleCameraToggle();
        e.preventDefault();
      }
    });
  }

  initControls() {

    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (this.keys.hasOwnProperty(key)) {
        this.keys[key] = true;
        this.isMoving = true;
        if (key === 'w' || key === 'arrowup') {
          if (e.repeat) return;
          console.log('Moving forward');
         
          if (this.model && !this.camera.isOrbital) {
            this.model.setStartAnimationWalk();
          }
        } else if (key === 's' || key === 'arrowdown') {
          if (e.repeat) return;
          console.log('Moving backward');
          
          if (this.model && !this.camera.isOrbital) {
            this.model.setStartAnimationWalk(false);
          }
        }
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if (this.keys.hasOwnProperty(key)) {
        this.keys[key] = false;

        this.isMoving = false;

        if (key === 'w' || key === 'arrowup') {
          if (e.repeat) return;
          console.log('Stopped moving forward');

          if (this.model && !this.camera.isOrbital) {
            this.model.setEndAnimationWalk();
          }
        }
        if (key === 's' || key === 'arrowdown') {
          if (e.repeat) return;
          console.log('Stopped moving backward');

          if (this.model && !this.camera.isOrbital) {
            this.model.setEndAnimationWalk(false);
          }
        }
        e.preventDefault();
      }
    });
  }

  handleCameraToggle() {
    if (!this.model)
      return;

    if (debug) console.log('Current camera mode:', this.camera.cameraMode);
    const newMode = this.camera.toggleCameraMode();
    if (debug) console.log('New camera mode:', newMode);

    if (newMode === 'firstPerson') {
      const fpPosition = [0, 0, 0];
      vec3.copy(fpPosition, this.position);
      fpPosition[1] += this.firstPersonHeightOffset;

      this.hideModel();
      this.camera.setFirstPersonView(fpPosition, this.rotation);

    } else if (newMode === 'thirdPerson'
      || newMode === 'orbital') {
      this.showModel();
      this.updateCamera();
    }

    this.cameraControls.updateControls()
  }

  hideModel() {
    this.model.isVisible = false;
  }

  showModel() {
    this.model.isVisible = true;
    this.updateTransform();
  }

  updateTransform() {
    if (this.model && this.model.isVisible) {
      this.environment.updateModelTransform(
        this.model,
        [this.position[0], this.position[1], this.position[2]],
        [0, this.rotation, 0],
        [this.scale[0], this.scale[1], this.scale[2]]
      );
    }
  }

  update() {
    this.handleMovement();
    this.updateAnimation();

    if (this.model)
      this.updateTransform();

    this.updateCamera();
  }

  handleMovement() {
    if (!this.model || this.camera.isOrbital)
      return;

    vec3.set(this.velocity, 0, 0, 0);

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

    if (this.keys.w || this.keys.arrowup) {
      vec3.add(moveDirection, moveDirection, forward);
    }

    if (this.keys.s || this.keys.arrowdown) {
      vec3.subtract(moveDirection, moveDirection, forward);
    }

    if (this.keys.a || this.keys.arrowleft) {
      this.rotation += this.rotationSpeed
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
    this.rotation = ((this.rotation) % (2 * Math.PI));

    // Normalize to obtain unit vector  
    if (vec3.length(moveDirection) > 0) {
      vec3.normalize(moveDirection, moveDirection);
      vec3.scale(moveDirection, moveDirection, this.moveSpeed);

      const newPosition = vec3.create();
      vec3.copy(newPosition, this.position);
      newPosition[0] += moveDirection[0];
      newPosition[2] += moveDirection[2];

      //TODO check 
      if (this.isPositionValid(newPosition)) {

        this.position[0] = newPosition[0];
        this.position[2] = newPosition[2];
      } else {
        // so only x 
        const newPosX = vec3.create();
        vec3.copy(newPosX, this.position);
        newPosX[0] += moveDirection[0];

        if (this.isPositionValid(newPosX)) {
          this.position[0] = newPosX[0];
        }

        // Try moving only on Z axis
        const newPosZ = vec3.create();
        vec3.copy(newPosZ, this.position);
        newPosZ[2] += moveDirection[2];

        if (this.isPositionValid(newPosZ)) {
          this.position[2] = newPosZ[2];
        }

        console.log('Movement blocked by boundary limits');
      }
    }

    this.applyPositionCorrection();
  }

  // TODO improve 
  updateAnimation() {
    if (this.camera.isFirstPerson) {
      if (this.isMoving) {
        this.currentStep = (this.currentStep + this.step) % this.durWalk;
        const heightOffset = Math.abs(this.currentStep * this.bobAmount);
        this.position[1] = this.baseHeight + heightOffset;
        this.reverse = this.durWalk - this.currentStep;
      } else {
        this.currentStep = 0;
        this.position[1] = this.baseHeight;
      }
    }
  }

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

    } else if (this.camera.isOrbital && this.model) {
      this.showModel();
    }

    this.camera.updateView();
  }

  getState() {
    return {
      position: Array.from(this.position),
      rotation: this.rotation,
      pitch: this.camera.firstPersonPitch || 0,
      isMoving: this.isMoving || (this.model && this.model.isMoving),
      keys: { ...this.keys },
      cameraMode: this.camera.cameraMode,
      modelVisible: this.model.isVisible,
    };
  }

  setPosition(x, y, z) {
    vec3.set(this.position, x, y, z);
    this.baseHeight = y;
    this.updateTransform();
  }

  setAnimation(animationName) {
    if (!this.model)
      return;

    if (debug) console.log(`[${this.model.name}] Setting animation to: ${animationName}`);

    if (animationName === 'StandToSit') {
      const offset = 7.3;
      const behindX = this.position[0] - Math.sin(this.rotation) * offset;
      const behindZ = this.position[2] - Math.cos(this.rotation) * offset;

      this.environment.updateModelTransform(
        this.chair,
        [behindX, 4.8, behindZ],
        [0, this.rotation + 30, 0],
        [1.4, 1.47, 1.4]
      );

      this.chair.isVisible = true;
    }

    this.model.setAnimation(animationName);
  }

  // Position correction to prevent going outside the play area
  applyPositionCorrection() {
    let corrected = false;

    // Check X boundaries
    if (this.position[0] < this.boundaryLimits.minX) {
      this.position[0] = this.boundaryLimits.minX;
      corrected = true;
      console.log('Position corrected: Hit left boundary');
    } else if (this.position[0] > this.boundaryLimits.maxX) {
      this.position[0] = this.boundaryLimits.maxX;
      corrected = true;
      console.log('Position corrected: Hit right boundary');
    }

    // Check Z boundaries  
    if (this.position[2] < this.boundaryLimits.minZ) {
      this.position[2] = this.boundaryLimits.minZ;
      corrected = true;
      console.log('Position corrected: Hit front boundary');
    } else if (this.position[2] > this.boundaryLimits.maxZ) {
      this.position[2] = this.boundaryLimits.maxZ;
      corrected = true;
      console.log('Position corrected: Hit back boundary');
    }

    // Check Y boundaries (height)
    if (this.position[1] < this.boundaryLimits.minY) {
      this.position[1] = this.boundaryLimits.minY;
      corrected = true;
      console.log('Position corrected: Hit ground boundary');
    } else if (this.position[1] > this.boundaryLimits.maxY) {
      this.position[1] = this.boundaryLimits.maxY;
      corrected = true;
      console.log('Position corrected: Hit height limit');
    }

    return corrected;
  }

  // Alternative method: Check if next position would be valid before moving
  isPositionValid(newPosition) {
    return (
      newPosition[0] >= this.boundaryLimits.minX &&
      newPosition[0] <= this.boundaryLimits.maxX &&
      newPosition[2] >= this.boundaryLimits.minZ &&
      newPosition[2] <= this.boundaryLimits.maxZ &&
      newPosition[1] >= this.boundaryLimits.minY &&
      newPosition[1] <= this.boundaryLimits.maxY
    );
  }

  // Set custom boundary limits
  setBoundaryLimits(minX, maxX, minZ, maxZ, minY = -2, maxY = 50) {
    this.boundaryLimits = {
      minX: minX,
      maxX: maxX,
      minZ: minZ,
      maxZ: maxZ,
      minY: minY,
      maxY: maxY
    };
    console.log('Boundary limits updated:', this.boundaryLimits);
  }

  // Get distance to nearest boundary (useful for visual feedback)
  getDistanceToBoundary() {
    const distToMinX = this.position[0] - this.boundaryLimits.minX;
    const distToMaxX = this.boundaryLimits.maxX - this.position[0];
    const distToMinZ = this.position[2] - this.boundaryLimits.minZ;
    const distToMaxZ = this.boundaryLimits.maxZ - this.position[2];

    return Math.min(distToMinX, distToMaxX, distToMinZ, distToMaxZ);
  }

  // Check if near boundary (useful for warnings)
  isNearBoundary(threshold = 5) {
    return this.getDistanceToBoundary() < threshold;
  }

  // Debug method to log current position and boundary info
  logBoundaryInfo() {
    const distance = this.getDistanceToBoundary();
    const isNear = this.isNearBoundary();

    console.log('=== Boundary Info ===');
    console.log('Current position:', this.position);
    console.log('Boundary limits:', this.boundaryLimits);
    console.log('Distance to nearest boundary:', distance.toFixed(2));
    console.log('Near boundary (< 5 units):', isNear);
    console.log('====================');
  }

  setWalkAnimationType(walkType) {
    if (!this.model)
      return;

    this.model.currentWalkType = walkType;
  }

}