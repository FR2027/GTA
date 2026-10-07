/**
 * 新竹 GTA (Hsinchu Open-World) - Core Engine
 * 包含：OSM 實景地圖解析、3D 建築生成、3D 車輛物理控制
 */

// --- 核心全域變數 ---
let scene, camera, renderer, world;
let vehicle, vehicleBody;
let chassisMesh;
let keys = {};
let buildings = [];
let roads = [];

// 新竹火車站 地理中心經緯度
const HSINCHU_CENTER = { lat: 24.8015, lon: 120.9716 };
const MAP_SCALE = 111320; // 經緯度轉公尺比例尺

// --- 1. 初始化 3D 與物理場景 ---
function init() {
    const container = document.getElementById('webgl-container');

    // Three.js 場景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a24);
    scene.fog = new THREE.FogExp2(0x1a1a24, 0.0015);

    // 攝影機
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);

    // 渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 光源設置 (模擬台灣陽光與環境光)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    dirLight.position.set(200, 500, 300);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.far = 1000;
    dirLight.shadow.camera.left = -500;
    dirLight.shadow.camera.right = 500;
    dirLight.shadow.camera.top = 500;
    dirLight.shadow.camera.bottom = -500;
    scene.add(dirLight);

    // Cannon.js 物理世界
    world = new CANNON.World();
    world.gravity.set(0, -9.82, 0);
    world.broadphase = new CANNON.NaiveBroadphase();

    // 地面物理
    const groundMaterial = new CANNON.Material("groundMaterial");
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0, material: groundMaterial });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);

    // 視覺地面 (新竹路面)
    const groundGeo = new THREE.PlaneGeometry(5000, 5000);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // 初始化車輛與載入地圖
    createVehicle();
    fetchHsinchuOSMData(HSINCHU_CENTER.lat, HSINCHU_CENTER.lon, 600); // 載入方圓 600 公尺真實地圖

    // 事件監聽
    window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);
    window.addEventListener('resize', onWindowResize);

    animate();
}

// --- 2. 經緯度轉 3D 空間座標 ---
function latLonToVector3(lat, lon) {
    const x = (lon - HSINCHU_CENTER.lon) * MAP_SCALE * Math.cos(HSINCHU_CENTER.lat * Math.PI / 180);
    const z = -(lat - HSINCHU_CENTER.lat) * MAP_SCALE;
    return new THREE.Vector3(x, 0, z);
}

// --- 3. 動態抓取 OpenStreetMap 新竹實景資料 ---
async function fetchHsinchuOSMData(lat, lon, radius) {
    const query = `
        [out:json];
        (
          way["building"](around:${radius},${lat},${lon});
          way["highway"](around:${radius},${lat},${lon});
        );
        out body;
        >;
        out skel qt;
    `;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        parseAndRenderOSM(data);
        document.getElementById('loading-screen').style.opacity = '0';
        setTimeout(() => document.getElementById('loading-screen').style.display = 'none', 500);
    } catch (err) {
        console.error("OSM 地圖數據載入失敗:", err);
    }
}

// --- 4. 解析 OSM 數據並拉出 3D 實景建築與道路 ---
function parseAndRenderOSM(osmData) {
    const nodes = {};
    osmData.elements.forEach(el => {
        if (el.type === 'node') {
            nodes[el.id] = latLonToVector3(el.lat, el.lon);
        }
    });

    const buildingMat = new THREE.MeshStandardMaterial({ color: 0x8899a6, roughness: 0.5 });
    const roadMat = new THREE.MeshBasicMaterial({ color: 0x333333 });

    osmData.elements.forEach(el => {
        if (el.type === 'way' && el.nodes) {
            // 生成 3D 建築
            if (el.tags && el.tags.building) {
                const points = el.nodes.map(nodeId => nodes[nodeId]).filter(p => p !== undefined);
                if (points.length < 3) return;

                const shape = new THREE.Shape();
                shape.moveTo(points[0].x, points[0].z);
                for (let i = 1; i < points.length; i++) {
                    shape.lineTo(points[i].x, points[i].z);
                }

                // 計算高度 (預設或依照樓層)
                const levels = el.tags['building:levels'] ? parseInt(el.tags['building:levels']) : Math.floor(Math.random() * 5) + 3;
                const height = levels * 3.5;

                const extrudeSettings = { depth: height, bevelEnabled: false };
                const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
                const mesh = new THREE.Mesh(geometry, buildingMat);
                mesh.rotation.x = Math.PI / 2; // 轉正
                mesh.position.y = height;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                scene.add(mesh);

                // 為建築加上 3D 物理碰撞盒
                const boxShape = new CANNON.Box(new CANNON.Vec3(10, height / 2, 10)); // 簡化碰撞盒
                const boxBody = new CANNON.Body({ mass: 0 });
                boxBody.addShape(boxShape);
                boxBody.position.set(points[0].x, height / 2, points[0].z);
                world.addBody(boxBody);
            }
        }
    });
}

// --- 5. 創建 GTA 玩家車輛與物理系統 ---
function createVehicle() {
    // 物理車體
    const chassisShape = new CANNON.Box(new CANNON.Vec3(1.2, 0.6, 2.5));
    vehicleBody = new CANNON.Body({ mass: 1200 }); // 1200kg 車重
    vehicleBody.addShape(chassisShape);
    vehicleBody.position.set(0, 3, 0);
    world.addBody(vehicleBody);

    // Raycast 車輛控制器
    vehicle = new CANNON.RaycastVehicle({
        chassisBody: vehicleBody,
    });

    // 車輪配置
    const wheelOptions = {
        radius: 0.4,
        directionLocal: new CANNON.Vec3(0, -1, 0),
        suspensionStiffness: 30,
        suspensionRestLength: 0.3,
        frictionSlip: 5,
        dampingRelaxation: 2.3,
        dampingCompression: 4.4,
        maxSuspensionForce: 100000,
        rollInfluence: 0.01,
        axleLocal: new CANNON.Vec3(-1, 0, 0),
        chassisConnectionPointLocal: new CANNON.Vec3(1, 1, 0),
        maxSuspensionTravel: 0.3,
        customSlidingRotationalSpeed: -30,
        useCustomSlidingRotationalSpeed: true
    };

    // 四個輪子位置
    wheelOptions.chassisConnectionPointLocal.set(1, -0.3, 1.5);
    vehicle.addWheel(wheelOptions);
    wheelOptions.chassisConnectionPointLocal.set(-1, -0.3, 1.5);
    vehicle.addWheel(wheelOptions);
    wheelOptions.chassisConnectionPointLocal.set(1, -0.3, -1.5);
    vehicle.addWheel(wheelOptions);
    wheelOptions.chassisConnectionPointLocal.set(-1, -0.3, -1.5);
    vehicle.addWheel(wheelOptions);

    vehicle.addToWorld(world);

    // 車輛 3D 視覺模型
    const carGroup = new THREE.Group();
    const bodyGeo = new THREE.BoxGeometry(2.4, 1.2, 5);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff0055, metalness: 0.8, roughness: 0.2 });
    const carMesh = new THREE.Mesh(bodyGeo, bodyMat);
    carMesh.castShadow = true;
    carGroup.add(carMesh);

    chassisMesh = carGroup;
    scene.add(chassisMesh);
}

// --- 6. 輸入控制與車輛驅動邏輯 ---
function updateVehicleControls() {
    const maxForce = 1500;
    const maxSteerVal = 0.5;

    // 前進 / 後退
    if (keys['w'] || keys['arrowup']) {
        vehicle.applyEngineForce(-maxForce, 2);
        vehicle.applyEngineForce(-maxForce, 3);
    } else if (keys['s'] || keys['arrowdown']) {
        vehicle.applyEngineForce(maxForce, 2);
        vehicle.applyEngineForce(maxForce, 3);
    } else {
        vehicle.applyEngineForce(0, 2);
        vehicle.applyEngineForce(0, 3);
    }

    // 轉向
    if (keys['a'] || keys['arrowleft']) {
        vehicle.setSteeringValue(maxSteerVal, 0);
        vehicle.setSteeringValue(maxSteerVal, 1);
    } else if (keys['d'] || keys['arrowright']) {
        vehicle.setSteeringValue(-maxSteerVal, 0);
        vehicle.setSteeringValue(-maxSteerVal, 1);
    } else {
        vehicle.setSteeringValue(0, 0);
        vehicle.setSteeringValue(0, 1);
    }

    // 煞車 (手煞車)
    if (keys[' ']) {
        vehicle.setBrake(100, 0);
        vehicle.setBrake(100, 1);
        vehicle.setBrake(100, 2);
        vehicle.setBrake(100, 3);
    } else {
        vehicle.setBrake(0, 0);
        vehicle.setBrake(0, 1);
        vehicle.setBrake(0, 2);
        vehicle.setBrake(0, 3);
    }
}

// --- 7. 主遊戲循環與攝影機跟隨 ---
function animate() {
    requestAnimationFrame(animate);

    // 物理世界更新
    world.step(1 / 60);

    // 控制更新
    updateVehicleControls();

    // 車輛模型同步物理引擎
    chassisMesh.position.copy(vehicleBody.position);
    chassisMesh.quaternion.copy(vehicleBody.quaternion);

    // GTA 追蹤攝影機邏輯 (TPS Camera)
    const relativeCameraOffset = new THREE.Vector3(0, 5, -12);
    const cameraOffset = relativeCameraOffset.applyMatrix4(chassisMesh.matrixWorld);
    camera.position.lerp(cameraOffset, 0.1);
    camera.lookAt(chassisMesh.position.x, chassisMesh.position.y + 1.5, chassisMesh.position.z);

    // UI 速度表更新
    const speed = Math.round(vehicleBody.velocity.length() * 3.6);
    document.getElementById('speed').innerText = speed;

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 啟動引擎
window.onload = init;
