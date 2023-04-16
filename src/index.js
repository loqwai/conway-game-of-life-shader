import { ConwayGameOfLife } from "./ConwayGameOfLife.js";

const main = () => {
  const conway = new ConwayGameOfLife(document.querySelector("#canvas"));
  conway.start();
  window.conway = conway;
}

main();
