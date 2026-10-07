import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.181.1/build/three.module.js";
import { CONFIG } from "./Config.js";

export class GeoSystem {
  constructor(anchor=CONFIG.anchor) {
    this.anchor = anchor;
    this.mPerDegLat = 111132.92;
    this.mPerDegLon = 111412.84 * Math.cos(THREE.MathUtils.degToRad(anchor.lat));
  }
  wgs84ToENU(lat, lon, height=0) {
    return new THREE.Vector3(
      (lon-this.anchor.lon)*this.mPerDegLon,
      height-this.anchor.height,
      (lat-this.anchor.lat)*this.mPerDegLat
    );
  }
  enuToWgs84(v) {
    return {
      lat: this.anchor.lat + v.z/this.mPerDegLat,
      lon: this.anchor.lon + v.x/this.mPerDegLon,
      height: this.anchor.height + v.y
    };
  }
  bearingDeg(forward) {
    const deg = THREE.MathUtils.radToDeg(Math.atan2(forward.x, forward.z));
    return (deg+360)%360;
  }
  format(v) {
    const g=this.enuToWgs84(v);
    return `${g.lat.toFixed(6)}, ${g.lon.toFixed(6)}`;
  }
}
