import { ConwayGameOfLife } from "./ConwayGameOfLife.js";

const main = () => {
  const conway = new ConwayGameOfLife(document.querySelector("#canvas"), undefined, "./src/shaders/");
  conway.start();
  window.conway = conway;
}

main();
