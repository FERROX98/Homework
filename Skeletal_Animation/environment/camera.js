// Orbital Camera using gl-matrix
import { mat4, vec3 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';

class OrbitalCamera {
  constructor(canvas) {
    this.canvas = canvas;
    this.radius = 50;
    this.azimuth = 0;
    this.elevation = Math.PI / 6; // ≈30° above the plane
    this.target = vec3.fromValues(0, 0, 0);
    this.up = vec3.fromValues(0, 1, 0);

    this.viewMatrix = mat4.create();
    this.projectionMatrix = mat4.create();
    this.fov = 60 * Math.PI / 180;
    this.near = 0.1;
    this.far = 1000;

    this.initEvents();
    this.updateView();
    this.updateProjection();
  }

  initEvents() {
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    this.canvas.addEventListener('mousedown', e => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });

    this.canvas.addEventListener('mouseup', () => {
      isDragging = false;
    });

    this.canvas.addEventListener('mouseleave', () => {
      isDragging = false;
    });

    this.canvas.addEventListener('mousemove', e => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      this.azimuth += dx * 0.01;
      this.elevation += dy * 0.01;
      this.elevation = Math.max(0.01, Math.min(Math.PI / 2 - 0.01, this.elevation));
      lastX = e.clientX;
      lastY = e.clientY;
      this.updateView();
    });

    this.canvas.addEventListener('wheel', e => {
      e.preventDefault();
      this.radius *= 1 + e.deltaY * 0.0005;
      //this.radius = Math.max(50.0, Math.min(this.radius, 500));
      this.radius = Math.max(10.0, Math.min(this.radius, 500));
      this.updateView();
    });
  }

  updateView() {
    const eye = vec3.fromValues(
      this.radius * Math.cos(this.elevation) * Math.sin(this.azimuth),
      this.radius * Math.sin(this.elevation),
      this.radius * Math.cos(this.elevation) * Math.cos(this.azimuth)
    );
    mat4.lookAt(this.viewMatrix, eye, this.target, this.up);
  }

  updateProjection() {
    const aspect = this.canvas.width / this.canvas.height;
    mat4.perspective(this.projectionMatrix, this.fov, aspect, this.near, this.far);
  }
}

export { OrbitalCamera };
