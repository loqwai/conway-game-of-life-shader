
import { initAutoResize } from "./resize.js";

export class ConwayGameOfLife {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {number} [dimensions=16] - The number of rows and columns in the grid. Must be a power of 2.
   */
  constructor(canvas, numRows = 10) {
    this.canvas = canvas;
    this.numRows = numRows;
    this.running = false;
  }

  start = () => {
    this.running = true;
    initAutoResize(this.canvas);
  }

  stop = () => {
    this.running = false;
  }

  singleFrame = () => {
    if (!this.running) return;
    requestAnimationFrame(this.singleFrame); // registering this first thing so we can safely early return


  }
}