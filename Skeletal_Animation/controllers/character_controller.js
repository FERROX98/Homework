import { vec3 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';
import { Model } from '../models/model.js';
import { AnimationSelector } from '../ui/animation_selector.js';
import { CameraControls } from '../ui/camera_controls.js';
import { CharacterAnimations } from './character_animations.js';

const debug = false;
export class CharacterController {

  constructor(model, environment, camera) {
    this.model = model;
    this.model.onLoaded(); 
    this.environment = environment;
    this.cameraControls = new CameraControls();
    this.camera = camera;

    // animation obj
    if (this.model) {
      this.chair = new Model(this.model.gl, "chair.gltf", false, false);
      environment.addModel(this.chair);
      model.chair = this.chair;
    }

    this.position = vec3.fromValues(0, 0, 0);
    this.rotation = Math.PI / 2;
    this.scale = vec3.fromValues(0.08, 0.08, 0.08);
    this.velocity = vec3.create();

    // place the player 
    this.environment.addModel(this.model, this.position, [0, this.rotation, 0], this.scale);

    // position correction 
    this.boundaryLimits = {
      minX: -this.environment.groundSize,
      maxX: this.environment.groundSize,
      minZ: -this.environment.groundSize,
      maxZ: this.environment.groundSize,
      minY: -2,
      maxY: this.environment.groundSize
    };

    // Movement e Animation walk fp 
    this.moveSpeed = 0.11;
    this.baseSpeed = this.moveSpeed;
    this.rotationSpeed = 0.10;
    this.isMoving = false;
    this.startTimeMoving = 0;

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

    this.camera.onFirstPersonRotationChange = (rotation) => {
      this.rotation = rotation;
    };

    // init other 
    this.initControls();
    this.setUpControls();

    this.setWalkAnimationType('normal');
  }

  updateSpeed(newSpeed) {
    this.moveSpeed = newSpeed;
  }

  setUpControls() {

    this.cameraControls.setReferences(this.camera, this, this.environment);
    this.animationSelector = new AnimationSelector(this);

    if (debug) console.log('setUpControls updated with character controller');

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

        //console.log(`Moving speed: ${this.moveSpeed}, Rotation speed: ${this.rotationSpeed}`);
        //console.log(`Animation speed: ${this.model ? this.model.animationSpeed : 'N/A'}`);

        if (key === 'w' || key === 'arrowup') {
          if (e.repeat) return;
          console.log('Moving forward');

          if (this.model && !this.camera.isOrbital) {
            this.startTimeMoving = performance.now();
            this.model.setStartAnimationWalk();
          }
        } else if (key === 's' || key === 'arrowdown') {
          if (e.repeat) return;
          console.log('Moving backward');

          if (this.model && !this.camera.isOrbital) {
            this.startTimeMoving = performance.now();
            this.model.setStartAnimationWalk(false);
          }
        }

        this.keys[key] = true;
        this.isMoving = true;

        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if (this.keys.hasOwnProperty(key)) {
        const isForward = (key === 'w' || key === 'arrowup');
        const isBackward = (key === 's' || key === 'arrowdown');

        if (isForward) {
          if (e.repeat) return;
          console.log('Stopped moving forward');

          if (this.model && !this.camera.isOrbital) {
            this.model.setEndAnimationWalk();
          }
        }

        if (isBackward) {
          if (e.repeat) return;
          console.log('Stopped moving backward');

          if (this.model && !this.camera.isOrbital) {
            this.model.setEndAnimationWalk(false);
          }
        }
        const timeBeforeEnd = CharacterAnimations.getAnimationByName(this.model.currentAnimation.name).waitAfter || 0;
        const animationSpeed = this.model ? this.model.animationSpeed : 1.0;

        console.log(`Animation speed: ${animationSpeed}, Time before end: ${timeBeforeEnd}`);

        if ((isForward || isBackward) && timeBeforeEnd > 0) {
          console.log(`Waiting ${timeBeforeEnd}ms before stopping movement`);
          setTimeout(() => {
            this.keys[key] = false;
            this.isMoving = false;
          }, timeBeforeEnd / animationSpeed);
        } else {
          this.keys[key] = false;
          this.isMoving = false;
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

    if (this.model)
      this.updateTransform();

    this.updateCamera();
  }

  handleMovement() {
    if (!this.model || this.camera.isOrbital)
      return;

    vec3.set(this.velocity, 0, 0, 0);

    // forward = yaw(y) * z like unicycle but x used as y 
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
      vec3.scale(moveDirection, moveDirection, this.getMoveSpeed());

      const newPosition = vec3.create();
      vec3.copy(newPosition, this.position);
      newPosition[0] += moveDirection[0];
      newPosition[2] += moveDirection[2];

      if (this.isPositionValid(newPosition)) {

        this.position[0] = newPosition[0];
        this.position[2] = newPosition[2];
      } else {

        // try only x 
        const newPosX = vec3.create();
        vec3.copy(newPosX, this.position);
        newPosX[0] += moveDirection[0];

        if (this.isPositionValid(newPosX)) {
          this.position[0] = newPosX[0];
        }

        // try only z 
        const newPosZ = vec3.create();
        vec3.copy(newPosZ, this.position);
        newPosZ[2] += moveDirection[2];

        if (this.isPositionValid(newPosZ)) {
          this.position[2] = newPosZ[2];
        }

        console.log('Movement blocked by boundary limits');
      }
    }

  }



  getMoveSpeed() {
    const animationWalkMultiplier = CharacterAnimations.getMovementSensitivity(this.model.currentWalkType) || 1.0;
    let walkMultiplierPhase = CharacterAnimations.getMovementPhase(this.model.currentAnimation.name) || 1.0;

    let walkMultiplier = 1.0;
    const timeBeforeStart = CharacterAnimations.getAnimationByName(this.model.currentAnimation.name).waitBefore || 0;
    // apply a pre-phase walk 
    if ((performance.now() - this.startTimeMoving) < timeBeforeStart) {
      const elapsed = (performance.now() - this.startTimeMoving) / timeBeforeStart;
      walkMultiplierPhase = 1 * elapsed;
    } else {
      walkMultiplierPhase = 1.0;

    }
    if (debug) console.log(`[${this.model.name}] Walk multiplier: ${walkMultiplier}, Phase: ${walkMultiplierPhase}, Animation type: ${this.model.currentAnimation.name}`);

    if (walkMultiplierPhase > 1.0) {
      walkMultiplierPhase = 1.0;
    }

    return this.moveSpeed * animationWalkMultiplier * walkMultiplierPhase;
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

    // TODO obj animation  generalize 
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

  setWalkAnimationType(walkType) {
    if (!this.model)
      return;

    this.model.currentWalkType = walkType;
  }

}