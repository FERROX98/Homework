import { vec3 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';
import { Model } from '../models/model.js';
import { AnimationSelector } from '../ui/animation_selector.js';
import { CameraControls } from '../ui/camera_controls.js';
import { CharacterAnimations } from './character_animations.js';

const debug = false;
export class CharacterController {

  constructor(model, environment, camera) {
    this.model = model;

    this.environment = environment;
    this.cameraControls = new CameraControls();
    this.camera = camera;

    // animation obj
    if (this.model) {
      this.chair = new Model(this.model.gl, "chesterfieldarmchair.gltf", false, false, true);
      environment.addModel(this.chair, [0, 0, 0], [0, 0, 0], [10.4, 10, 10.4]);
      model.chair = this.chair;
    }

    this.position = vec3.fromValues(0, 0, 0);
    this.rotation = Math.PI / 2;
    this.scale = vec3.fromValues(0.08, 0.08, 0.08);
    this.velocity = vec3.create();

    this.environment.addModel(this.model, this.position, [0, this.rotation, 0], this.scale);

    const offsetPosCorr = 4.9;
    // position correction 
    this.boundaryLimits = {
      minX: -this.environment.groundSize + offsetPosCorr,
      maxX: this.environment.groundSize - offsetPosCorr,
      minZ: -this.environment.groundSize + offsetPosCorr,
      maxZ: this.environment.groundSize - offsetPosCorr,
      minY: -2,
      maxY: this.environment.groundSize - offsetPosCorr
    };

    // Movement e Animation walk fp 
    this.animationSpeedMultiplier = 13;
    this.normalizationFactor = (moveSpeed) =>  ( 0.8* Math.exp(-moveSpeed)); 
    this.minRotationSpeed = 0.01;
    this.maxRotationSpeed = 0.2;

    this.initSpeedModel(0.22, 0.07);
    

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

    this.firstPersonHeightOffset = 14.6;
    this.thirdPersonHeightOffset = 10.0;

    this.camera.onFirstPersonRotationChange = (rotation) => {
      this.rotation = rotation;
    };

    // init other 
    this.initControls();
    this.setUpControls();

    this.setWalkAnimationType('normal');
  }

  initSpeedModel(moveSpeed = 0.13, rotationSpeed = 0.05) {
    if (this.model) {
      this.model.animationSpeed = moveSpeed * this.animationSpeedMultiplier * this.normalizationFactor(moveSpeed);
      this.rotationSpeed = rotationSpeed;
      this.moveSpeed = moveSpeed;
      this.baseSpeed = moveSpeed;
      this.baseRotationSpeed = rotationSpeed;
      this.model.baseAnimationSpeed = this.model.animationSpeed;
    }
  }

  resetSpeed() {
    if (this.model) {
      this.model.animationSpeed = this.model.baseAnimationSpeed;
      this.rotationSpeed = this.baseRotationSpeed;
      this.moveSpeed = this.baseSpeed;
      this.setWalkAnimationType('normal');
    }
  }

  updateSpeed(newSpeed) {
    this.moveSpeed = newSpeed;
  }

  setUpControls() {

    this.cameraControls.setReferences(this.camera, this, this.environment);
    this.animationSelector = new AnimationSelector(this);

    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'c') {
        this.handleCameraToggle();
        e.preventDefault();
      }
    });
  }

  initControls() {

    this.startTimeAnimation = 0; 
    this.doubleClickThreshold = 300;
    
    window.addEventListener('keydown', (e) => {
      if (!this.model || this.camera.isOrbital)
        return;

      const key = e.key.toLowerCase();
      if (this.keys.hasOwnProperty(key)) {
        const isForward = (key === 'w' || key === 'arrowup');
        const isBackward = (key === 's' || key === 'arrowdown');
        // if alreeady pressed, ignore
        if (this.keys[key]) 
          return;

        // if other keys pressed, reset movement
        const otherKeysPressed = Object.keys(this.keys)
                  .filter(k => k !== key && this.keys[k] && (k === 'w' ||  k=== 's') && (key !== 'a' && key !== 'd' ));
                      
        if (otherKeysPressed.length > 0) {
          this.isMoving = false;
          otherKeysPressed.forEach(k => this.keys[k] = false); 
        }

        // if there is a double click ignore the movement till the end of the animation
        const now = performance.now();  
        
        if ((isForward ||isBackward) && this.startTimeAnimation  && (now - this.startTimeAnimation  < this.doubleClickThreshold)) {
          return;
        } 

        if (isForward) {
          this.model.setStartAnimationWalk();
          this.startTimeMoving = performance.now();
          this.startTimeAnimation = performance.now();
          
        } else if (isBackward) {
          this.model.setStartAnimationWalk(false);
          this.startTimeMoving = performance.now();
          this.startTimeAnimation = performance.now();
        }

        this.keys[key] = true;
        this.isMoving = true;
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (!this.model || this.camera.isOrbital)
        return;

      const key = e.key.toLowerCase();
      if (this.keys.hasOwnProperty(key)) {
        const isForward = (key === 'w' || key === 'arrowup');
        const isBackward = (key === 's' || key === 'arrowdown');

        // check if there is another key pressed among forward ,backward
        if (!this.keys[key]) {
          return;
        }

        if (isForward) {
          if (e.repeat)
              return;
          
          this.model.setEndAnimationWalk();
        }else if (isBackward) {
          if (e.repeat )
              return;
          
          this.model.setEndAnimationWalk(false);
        }

        const timeBeforeEnd = CharacterAnimations.getAnimationByName(this.model.currentAnimation.name).waitAfter || 0;
        const animationSpeed = this.model ? this.model.animationSpeed : 1.0;

        if ((isForward || isBackward) && timeBeforeEnd > 0) {
          
          this.timerWalk = setTimeout(() => {
            this.keys[key] = false;
            this.isMoving = false;
            this.doubleClickThreshold = 0;
            this.startTimeAnimation  = null;

          }, timeBeforeEnd / animationSpeed);

          this.doubleClickThreshold =  timeBeforeEnd / animationSpeed + 0.1 * timeBeforeEnd / animationSpeed; 
        } else {
          this.keys[key] = false;
          this.isMoving = false;
          this.startTimeAnimation  = null; 
          this.doubleClickThreshold = 0; 
        }
        e.preventDefault();
      }
    });
  }

  handleCameraToggle() {
    if (!this.model)
      return;

    const newMode = this.camera.toggleCameraMode();

    if (newMode === 'firstPerson') {
      const fpPosition = [0, 0, 0];
      vec3.copy(fpPosition, this.position);
      fpPosition[1] += this.firstPersonHeightOffset;
      fpPosition[0] += Math.sin(this.rotation) * 3.0;
      fpPosition[2] += Math.cos(this.rotation) * 3.0;
      this.camera.fov = 75 * (Math.PI / 180); 
      //this.hideModel();
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

    let moveDirection = vec3.create();

    if (this.keys.w || this.keys.arrowup) {
      vec3.add(moveDirection, moveDirection, forward);
    }

    if (this.keys.s || this.keys.arrowdown) {
      vec3.subtract(moveDirection, moveDirection, forward);
    }

    if (this.keys.a || this.keys.arrowleft) {
      this.rotation += this.rotationSpeed;
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
      }
    }

  }

  getMoveSpeed() {
    const animationWalkMultiplier = CharacterAnimations.getMovementSensitivity(this.model.currentWalkType) || 1.0;
    let walkMultiplierPhase = CharacterAnimations.getMovementPhase(this.model.currentAnimation.name) || 1.0;

    let walkMultiplier = 1.0;
    // wait before speed up 
    const intervalSpeedUp = CharacterAnimations.getAnimationByName(this.model.currentAnimation.name).waitBefore || 0;
    // apply a pre-phase walk 
    if ((performance.now() - this.startTimeMoving) < intervalSpeedUp) {
      const elapsed = (performance.now() - this.startTimeMoving) / intervalSpeedUp;
      walkMultiplierPhase = elapsed;
    } else {
      walkMultiplierPhase = 1.0;
    }

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
      fpPosition[0] += Math.sin(this.rotation) * 3.0;
      fpPosition[2] += Math.cos(this.rotation) * 3.0;
      //this.hideModel();

      this.camera.updateFirstPersonPosition(fpPosition);
      this.camera.firstPersonRotation = this.rotation;

    } else if (this.camera.isThirdPerson) {
      this.showModel();

      const cameraTarget = vec3.create();
      vec3.copy(cameraTarget, this.position);
      cameraTarget[1] += this.thirdPersonHeightOffset;

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
      currentAnimation: this.model && this.model.currentAnimation ? this.model.currentAnimation.name : 'None',
      animationSpeed: this.model ? this.model.getAnimationSpeed().toFixed(2) : '0.00',
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

    if (animationName === 'StandToSit') {
      const offset = 6.1;

      const offsetRotation = 0
      // yaw 
      const behindX = this.position[0] - Math.sin(this.rotation) * (offset);
      const behindZ = this.position[2] - Math.cos(this.rotation) * (offset);
      
      const rightOffset = 1.0;        
      // traslo verso destra ruoto yaw di 90 gradi in senso orario 
      // per piccolo aggiustamento 
      const rightX =  Math.cos(this.rotation) * rightOffset;
      const rightZ = -Math.sin(this.rotation) * rightOffset;

      this.environment.updateModelTransform(
        this.chair,
        [behindX +rightX , 0, behindZ + rightZ],
        [0, this.rotation + offsetRotation, 0],
        [10.4, 10, 10.4]
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