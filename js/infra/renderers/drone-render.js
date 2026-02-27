// --- Drone Renderer ---
// Rendu canvas du drone, extrait de Drone.draw()

export function drawDrone(ctx, drone) {
  ctx.fillStyle = drone.color;
  ctx.beginPath();
  ctx.arc(drone.x, drone.y, drone.radius, 0, Math.PI * 2);
  ctx.fill();

  // Halo lumineux
  ctx.strokeStyle = 'rgba(255, 204, 0, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(drone.x, drone.y, drone.radius + 3, 0, Math.PI * 2);
  ctx.stroke();
}
