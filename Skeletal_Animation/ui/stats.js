class Stats {
  constructor() {
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    this.lastFrameTime = performance.now();

    this.fps = 0;
    document.getElementById("toggle-stats").addEventListener("click", () => {
      const toggleBtn = document.getElementById("toggle-stats");

      const statsContainer = document.getElementById("stats-container");
      const rows = statsContainer.querySelectorAll(".stat-row");
      const visible = rows[0].style.display !== "none";
      
      rows.forEach((row) => {
        row.style.display = visible ? "none" : "flex";
      });
      toggleBtn.textContent = visible ? "Show Stats" : "Hide Stats";
    });
  }

  update(time, triangles = "-") {
    this.frameCount++;
    let ms = "-";
    let frameTime = time - this.lastFrameTime;
    ms = frameTime.toFixed(1) + " ms";
    this.lastFrameTime = time;
    if ((time %6000) < 20) {
        console.log('Rendering frame at time:', time /1000);
      }
    if (time - this.lastFpsUpdate > 1000) {
      //   console.log('Updating FPS:', this.frameCount, 'frames in', time - this.lastFpsUpdate, 'ms');
      this.fps = Math.round(
        (this.frameCount * 1000) / (time - this.lastFpsUpdate)
      );
      // console.log('FPS:', this.frameCount * 1000);
      const fpsDisplay = document.getElementById("fps");
      if (fpsDisplay) {
        fpsDisplay.textContent = this.fps;
      }
      this.lastFpsUpdate = time;
      this.frameCount = 0;

      let mb = "-";
      if (performance && performance.memory) {
        mb = Math.round(performance.memory.totalJSHeapSize / 10 ** 6) + " MB";
      }

      const msDisplay = document.getElementById("ms");
      if (msDisplay) {
        msDisplay.textContent = ms;
      }
      const mbDisplay = document.getElementById("mb");
      if (mbDisplay) {
        mbDisplay.textContent = mb;
      }

      let textureMemory = "-";
      if (
        window.renderer &&
        window.renderer.info &&
        window.renderer.info.memory
      ) {
        const texCount = window.renderer.info.memory.textures;
        textureMemory = texCount + " textures";
      }
      const texDisplay = document.getElementById("tex");
      if (texDisplay) {
        texDisplay.textContent = textureMemory;
      }
      const triDisplay = document.getElementById("triangles");
      if (triDisplay) {
        triDisplay.textContent = triangles;
      }
    }
  }
}

export { Stats };
