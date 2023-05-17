import { DroneController, Droner } from "/lib/droner.ts";

addEventListener("DOMContentLoaded", () => {
  const addButton = document.querySelector("[data-action=add]");
  const moveButton = document.querySelector("[data-action=move]");
  const stopButton = document.querySelector("[data-action=stop]");
  let droner: Droner | undefined;
  const drones: DroneController[] = [];

  const freq = () => (Math.random() * 3 + 1) * 220;

  addButton?.addEventListener("click", () => {
    if (!droner) droner = new Droner();
    drones.push(droner.add(freq()));
  });
  moveButton?.addEventListener("click", () => {
    drones.forEach(drone => drone.move(freq(), 0.01));
  });
  stopButton?.addEventListener("click", () => {
    while (drones.length > 0) {
      const drone = drones.pop();
      if (drone) drone.stop();
    }
  });
});
