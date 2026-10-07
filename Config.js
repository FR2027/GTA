export const CONFIG = {
  anchor: { lat: 24.80395, lon: 120.97150, height: 15 },
  world: { size: 9000, roadGrid: 600, roadWidth: 28 },
  vehicle: {
    mass: 1350, maxSpeed: 58, engineForce: 10500, brakeForce: 17500,
    steering: 0.48, drag: 0.42
  },
  camera: { distance: 8.5, height: 3.7, lookHeight: 1.2, smoothing: 7.5 },
  map: {
    // Optional Cesium Ion 3D Tiles:
    enabled: false,
    ionToken: "",
    assetId: "",
  }
};
