import { DroneController, Droner } from "/lib/droner.ts";

addEventListener("DOMContentLoaded", () => {
  const addButton = document.querySelector("[data-action=add]");
  const moveButton = document.querySelector("[data-action=move]");
  const stopButton = document.querySelector("[data-action=stop]");
  const speedControl = document.querySelector<HTMLInputElement>("[data-action=speed]");

  let droner: Droner | undefined;
  const drones: DroneController[] = [];

  const freq = () => (Math.random() * 3 + 1) * 110;

  let speed = 3;
  speedControl!.value = speed.toFixed(1);

  addButton?.addEventListener("click", (e: Event) => {
    e.preventDefault();
    if (!droner) droner = new Droner();
    drones.push(droner.add(freq()));
  });
  moveButton?.addEventListener("click", (e: Event) => {
    e.preventDefault();
    drones.forEach(drone => drone.move(freq(), speed));
  });
  stopButton?.addEventListener("click", (e: Event) => {
    e.preventDefault();
    while (drones.length > 0) {
      const drone = drones.pop();
      if (drone) drone.stop();
    }
  });
  speedControl?.addEventListener("change", function() {
    speed = parseFloat(this.value);
  })
});
