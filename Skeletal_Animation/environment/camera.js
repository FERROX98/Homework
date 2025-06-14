import {
  mat4,
  vec3,
} from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js";

export class Camera {
  // ok
  constructor(canvas) {

    this.canvas = canvas;
    this.radius = 50;

    // yaw 
    this.azimuth = 0;

    // pitch 
    this.elevation = Math.PI / 6;

    this.target = vec3.fromValues(0, 0, 0);
    this.up = vec3.fromValues(0, 1, 0);

    // orbital speed
    this.moveSpeed = 4;

    this.viewMatrix = mat4.create();
    this.projectionMatrix = mat4.create();

    this.fov = (55 * Math.PI) / 180;
    this.near = 0.1;
    this.far = 1000;

    this.cameraMode = 'orbital';

    this.thirdPersonPosition = vec3.create();
    this.thirdPersonTarget = vec3.create();
    this.thirdPersonRadius = 12.0;
    this.thirdPersonAzimuth = Math.PI;
    this.thirdPersonElevation = Math.PI / 6;
    this.thirdPersonMinRadius = 3.0;
    this.thirdPersonMaxRadius = 35.0;

    this.firstPersonPosition = vec3.create();
    this.firstPersonRotation = 0;
    this.firstPersonPitch = 0;
    this.firstPersonMaxPitch = Math.PI / 2 - 0.1;
    this.firstPersonMinPitch = -Math.PI / 2 + 0.1;
    this.onFirstPersonRotationChange = null;

    // TODO fix
    this.thirdPersonAutoFollow = true;
    this.thirdPersonFollowSpeed = 2.0;
    this.thirdPersonFollowDeadzone = 0.1;
    this.thirdPersonTargetAzimuth = this.thirdPersonAzimuth;

    this.initEvents();
    this.updateView();
    this.updateProjection();
  }

  // ok
  initEvents() {
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    this.canvas.addEventListener("mousedown", (e) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });

    this.canvas.addEventListener("mouseup", () => (isDragging = false));
    this.canvas.addEventListener("mouseleave", () => (isDragging = false));

    this.canvas.addEventListener("mousemove", (e) => {
      if (!isDragging) return;

      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;

      if (this.isOrbital) {
        this.azimuth += dx * 0.01;
        this.elevation += dy * 0.01;
        this.elevation = Math.max(0.01, Math.min(Math.PI / 2 - 0.01, this.elevation));

      } else if (this.isThirdPerson) {

        this.thirdPersonAzimuth += dx * 0.01;
        this.thirdPersonElevation += dy * 0.01;
        this.thirdPersonElevation = Math.max(0.01, Math.min(Math.PI / 2 - 0.01, this.thirdPersonElevation));

        // TODO fix
        this.thirdPersonAutoFollow = false;

        clearTimeout(this.autoFollowTimeout);
        this.autoFollowTimeout = setTimeout(() => {
          this.thirdPersonAutoFollow = true;
        }, 3000);

      } else if (this.isFirstPerson) {

        this.firstPersonRotation -= dx * 0.008;
        this.firstPersonPitch -= dy * 0.008;

        this.firstPersonPitch = Math.max(this.firstPersonMinPitch,
          Math.min(this.firstPersonMaxPitch, this.firstPersonPitch));

        // wrap angle to [-PI, PI]
        this.firstPersonRotation = ((this.firstPersonRotation) % (2 * Math.PI));

        if (this.onFirstPersonRotationChange) {
          this.onFirstPersonRotationChange(this.firstPersonRotation);
        }
      }

      lastX = e.clientX;
      lastY = e.clientY;
    });

    this.canvas.addEventListener("wheel", (e) => {
      e.preventDefault();

      if (this.isOrbital) {
        this.radius *= 1 + e.deltaY * 0.0005;
        this.radius = Math.max(0.5, Math.min(this.radius, 800));

      } else if (this.isThirdPerson) {

        this.thirdPersonRadius *= 1 + e.deltaY * 0.0005;
        this.thirdPersonRadius = Math.max(this.thirdPersonMinRadius, Math.min(this.thirdPersonRadius, this.thirdPersonMaxRadius));

        // TODO fix
        this.thirdPersonAutoFollow = false;
        clearTimeout(this.autoFollowTimeout);
        this.autoFollowTimeout = setTimeout(() => {
          this.thirdPersonAutoFollow = true;
        }, 2000);
      }
    });

    // orbital controls
    window.addEventListener("keydown", (e) => {
      if (!this.isOrbital) return;
      
      const postion = Camera.computeCameraPosition(this.azimuth, this.elevation, this.radius);
      const eye = vec3.fromValues(postion.x,
        postion.y,
        postion.z
      );

      vec3.add(eye, eye, this.target);

      const forward = vec3.create();
      vec3.sub(forward, this.target, eye);
      vec3.normalize(forward, forward);

      const right = vec3.create();
      vec3.cross(right, forward, this.up);
      vec3.normalize(right, right);

      const move = vec3.create();

      switch (e.key.toLowerCase()) {
        case "w":
          vec3.scale(move, forward, this.moveSpeed);
          break;
        case "s":
          vec3.scale(move, forward, -this.moveSpeed);
          break;
        case "a":
          vec3.scale(move, right, -this.moveSpeed);
          break;
        case "d":
          vec3.scale(move, right, this.moveSpeed);
          break;
        default:
          return;
      }

      vec3.add(this.target, this.target, move);

      // avoid under plane
      const minHeight = 0.001;
      this.target[1] = Math.max(this.target[1], minHeight);
    });
  }

  // ok
  static computeCameraPosition(yaw, pitch, radius) {

    // is a point on a sphere 
    // x = distance * cos(pitch) * sin(yaw);
    // y = distance * sin(pitch);
    // z = distance * cos(pitch) * cos(yaw);
    const x = radius * Math.cos(pitch) * Math.sin(yaw);
    const y = radius * Math.sin(pitch);
    const z = radius * Math.cos(pitch) * Math.cos(yaw);

    return { x, y, z };
  }

  // ok
  updateThirdPersonPosition() {
    const position = Camera.computeCameraPosition(this.thirdPersonAzimuth, this.thirdPersonElevation, this.thirdPersonRadius);

    vec3.set(this.thirdPersonPosition,
      this.thirdPersonTarget[0] + position.x,
      this.thirdPersonTarget[1] + position.y,
      this.thirdPersonTarget[2] + position.z
    );
  }

  // ok
  updateThirdPersonTarget(targetPosition) {
    vec3.copy(this.thirdPersonTarget, targetPosition);
    this.updateThirdPersonPosition();
  }

  // TODO to be fixed 
  updateThirdPersonFollow(playerRotation, isMoving, deltaTime) {
    if (this.cameraMode !== 'thirdPerson' || !this.thirdPersonAutoFollow) return;

    if (isMoving) {
      // Calculate desired camera angle (behind the player)
      this.thirdPersonTargetAzimuth = playerRotation + Math.PI;

      // Normalize angles to [-PI, PI] range
      while (this.thirdPersonTargetAzimuth > Math.PI) {
        this.thirdPersonTargetAzimuth -= 2 * Math.PI;
      }
      while (this.thirdPersonTargetAzimuth < -Math.PI) {
        this.thirdPersonTargetAzimuth += 2 * Math.PI;
      }

      // Calculate angle difference
      let angleDiff = this.thirdPersonTargetAzimuth - this.thirdPersonAzimuth;

      // Handle wrapping around PI/-PI boundary
      if (angleDiff > Math.PI) {
        angleDiff -= 2 * Math.PI;
      } else if (angleDiff < -Math.PI) {
        angleDiff += 2 * Math.PI;
      }

      // Only follow if difference is significant enough
      if (Math.abs(angleDiff) > this.thirdPersonFollowDeadzone) {
        // Smooth interpolation towards target angle
        const followAmount = this.thirdPersonFollowSpeed * deltaTime;
        this.thirdPersonAzimuth += angleDiff * Math.min(followAmount, 1.0);

        // Normalize azimuth
        while (this.thirdPersonAzimuth > Math.PI) {
          this.thirdPersonAzimuth -= 2 * Math.PI;
        }
        while (this.thirdPersonAzimuth < -Math.PI) {
          this.thirdPersonAzimuth += 2 * Math.PI;
        }

        this.updateThirdPersonPosition();
      }
    }
  }

  // ok
  setFirstPersonView(cameraPosition, rotation) {
    this.updateFirstPersonPosition(cameraPosition);
    this.firstPersonRotation = rotation;

    this.firstPersonPitch = 0;

    this.cameraMode = 'firstPerson';
  }

  // ok
  updateFirstPersonPosition(cameraPosition) {
    vec3.copy(this.firstPersonPosition, cameraPosition);
  }

  // ok
  updateView() {

    if (this.isThirdPerson) {
      this.updateThirdPersonPosition();

      // view transformation 
      mat4.lookAt(
        this.viewMatrix,
        this.thirdPersonPosition,
        this.thirdPersonTarget,
        this.up
      );

    } else if (this.isFirstPerson) {
      const target = vec3.create();

      const position = Camera.computeCameraPosition(this.firstPersonRotation, this.firstPersonPitch, 1);
      target[0] = this.firstPersonPosition[0] + position.x;
      target[1] = this.firstPersonPosition[1] + position.y;
      target[2] = this.firstPersonPosition[2] + position.z;

      mat4.lookAt(this.viewMatrix, this.firstPersonPosition, target, this.up);

    } else if (this.isOrbital) {

      const position = Camera.computeCameraPosition(this.azimuth, this.elevation, this.radius);
      const eye = vec3.fromValues(
        position.x,
        position.y,
        position.z
      );

      vec3.add(eye, eye, this.target);
      mat4.lookAt(this.viewMatrix, eye, this.target, this.up);
    }
  }

  // ok
  updateProjection() {
    const aspect = this.canvas.width / this.canvas.height;
    mat4.perspective(
      this.projectionMatrix,
      this.fov,
      aspect,
      this.near,
      this.far
    );
  }

  // ok
  toggleCameraMode() {
    const currentMode = this.cameraMode;

    let newMode;
    if (currentMode === 'orbital') {
      newMode = 'thirdPerson';
    } else if (currentMode === 'thirdPerson') {
      newMode = 'firstPerson';
    } else if (currentMode === 'firstPerson') {
      newMode = 'orbital';
    } else {
      newMode = 'orbital';
    }

    this.cameraMode = newMode;

    return newMode;
  }

  // ok
  get isThirdPerson() {
    return this.cameraMode === 'thirdPerson';
  }

  // ok
  get isFirstPerson() {
    return this.cameraMode === 'firstPerson';
  }

  // ok
  get isOrbital() {
    return this.cameraMode === 'orbital';
  }
}
