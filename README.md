# Hsinchu GTA v0.1 — Playable Open World

一個瀏覽器端、可直接遊玩的新竹 3D 開放世界原型。

## 已完成

- Three.js WebGL 3D 世界
- 新竹地理座標系統（WGS84 → ENU）
- 東門城作為世界 Anchor / Spawn
- 新竹市、竹北、竹科、高鐵等地標
- 大型道路網格與程序化建築
- 第三人稱追蹤鏡頭
- WASD / 方向鍵
- 行動裝置虛擬按鍵
- 加速、煞車、倒車、轉向、手煞車
- 車輛重置
- 速度 / RPM / 方位 HUD
- Minimap
- 地標進入提示
- Web Audio 引擎聲
- 日夜循環
- Shadow / Fog / Pixel Ratio 等基礎效能控制

## 執行

不要直接用 `file://` 開啟，請使用 HTTP Server。

### Python

```bash
python -m http.server 8080
```

然後開啟：

http://localhost:8080

### VS Code

安裝 Live Server，右鍵 `index.html` → Open with Live Server。

## 專案架構

```text
src/
├── main.js
├── core/
│   ├── Config.js
│   ├── GeoSystem.js
│   └── Game.js
├── world/
│   └── World.js
├── vehicle/
│   └── Vehicle.js
├── input/
│   └── Input.js
├── ui/
│   └── HUD.js
└── audio/
    └── EngineAudio.js
```

## 地理座標

目前 Anchor：

- Latitude: `24.80395`
- Longitude: `120.97150`
- Height: `15m`

這是 ENU 局部世界座標的原點。

X = East  
Y = Up  
Z = North

因此：

```text
east  = Δlongitude × metersPerDegreeLongitude
north = Δlatitude  × metersPerDegreeLatitude
up    = Δheight
```

## 真實 3D Tiles 下一階段

`src/core/Config.js` 已保留：

```js
map: {
  enabled: false,
  ionToken: "",
  assetId: ""
}
```

v0.2 可以把 `World.js` 的程序化建築替換/融合成 Cesium 3D Tiles streaming。

### 注意

Google Photorealistic 3D Tiles、Cesium ion 與其他第三方地圖圖資都需要依各服務的 API Key、授權、使用條款與流量限制使用。

本 v0.1 不內含第三方 API Key。

## 效能策略

- renderer pixel ratio 上限
- shadow map 解析度限制
- fog 遠距裁切
- 程序化資產而非大量獨立模型
- 地標距離檢測
- 後續建議加入：
  - InstancedMesh
  - tile-level streaming
  - object pooling
  - collider LOD
  - Web Worker
  - Rapier physics
  - 3D Tiles cache budget

## 下一版本

推薦依序加入：

1. Rapier.js 車輛 Raycast Physics
2. GLB 跑車
3. Cesium 3D Tiles
4. 真正道路碰撞
5. 車燈 / Bloom
6. 第一/第三人稱角色
7. NPC
8. 任務系統
9. 存檔
10. 多人連線
