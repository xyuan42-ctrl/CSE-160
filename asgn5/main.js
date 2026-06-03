import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene;
let camera;
let renderer;
let controls;
let score = 0;

const animatedObjects = [];
const coins = [];
const trees = [];
const petals = [];
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const clock = new THREE.Clock();

// Keyboard state for WASD movement.
const keys = {
  w: false,
  a: false,
  s: false,
  d: false
};

const moveSpeed = 8; // units per second

init();
animate();

function init() {
  const canvas = document.querySelector('#c');

  scene = new THREE.Scene();

  // Requirement: perspective projection camera.
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(10, 7, 12);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Requirement: mouse controls.
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.2, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  addSkybox();
  addLights();
  addGround();
  addVillageObjects();
  addCoins();
  loadTexturedModel();

  window.addEventListener('resize', onWindowResize);
  window.addEventListener('click', onMouseClick);

  // WASD movement controls.
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
}

function addSkybox() {
  // Requirement: textured skybox using a cube texture.
  const cubeLoader = new THREE.CubeTextureLoader();
  const skybox = cubeLoader.setPath('assets/skybox/').load([
    'px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'
  ]);
  skybox.colorSpace = THREE.SRGBColorSpace;
  scene.background = skybox;
}

function addLights() {
  // Requirement: at least 3 different light sources.
  const ambient = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0x87ceeb, 0x3b2f1e, 0.65);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffffff, 1.25);
  sun.position.set(8, 12, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  scene.add(sun);

  const lanternLight = new THREE.PointLight(0xffb347, 75, 18);
  lanternLight.position.set(-3, 3, 2);
  lanternLight.castShadow = true;
  scene.add(lanternLight);
  animatedObjects.push({ type: 'light', object: lanternLight });
}

function loadTexture(path, repeatX = 1, repeatY = 1) {
  const texture = new THREE.TextureLoader().load(path);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  return texture;
}

function addGround() {
  const grassTexture = loadTexture('assets/textures/grass.png', 10, 10);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshStandardMaterial({ map: grassTexture })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
}

function addVillageObjects() {
  const wallMat = new THREE.MeshStandardMaterial({
    map: loadTexture('assets/textures/wood.png', 1, 1),
    roughness: 0.8
  });
  const roofMat = new THREE.MeshStandardMaterial({
    map: loadTexture('assets/textures/roof.png', 1, 1),
    roughness: 0.7
  });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3518, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x1f7a3a, roughness: 0.85 });
  const stoneMat = new THREE.MeshStandardMaterial({
    map: loadTexture('assets/textures/stone.png', 1, 1),
    roughness: 1.0
  });

  // Houses: 5 boxes + 5 cone roofs = 10 primary shapes.
  const housePositions = [
    [-6.8, 0, -2.8],
    [-4.2, 0, 3.4],
    [-0.8, 0, -5.6],
    [3.8, 0, 4.2],
    [7.0, 0, -1.3]
  ];

  housePositions.forEach((pos, i) => {
    const houseAngle = [-0.18, 0.28, -0.1, 0.22, -0.26][i % 5];

    const house = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.6, 1.8), wallMat);
    house.position.set(pos[0], 0.8, pos[2]);
    house.rotation.y = houseAngle;
    house.castShadow = true;
    house.receiveShadow = true;
    scene.add(house);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.55, 1.05, 4), roofMat);
    roof.position.set(pos[0], 2.1, pos[2]);
    roof.rotation.y = Math.PI / 4 + houseAngle;
    roof.castShadow = true;
    scene.add(roof);

    // Small chimney for extra detail.
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.65, 0.25), stoneMat);
    chimney.position.set(pos[0] + Math.cos(houseAngle) * 0.45, 2.45, pos[2] - Math.sin(houseAngle) * 0.25 - Math.cos(houseAngle) * 0.25);
    chimney.rotation.y = houseAngle;
    chimney.castShadow = true;
    scene.add(chimney);
  });

  // Cherry blossom trees: trunks, branches, and pink blossom clusters.
  // This replaces the plain green trees with a more polished themed design.
  const treePositions = [
    [-8.8, 0, 1.8],
    [-6.0, 0, 5.8],
    [-2.6, 0, 1.0],
    [1.6, 0, 6.0],
    [5.8, 0, 1.8],
    [8.8, 0, 3.6],
    [5.2, 0, -4.8],
    [-3.8, 0, -6.0]
  ];

  treePositions.forEach((pos, i) => {
    createCherryBlossomTree(pos[0], pos[2], 0.9 + (i % 3) * 0.08, i, trunkMat);
  });

  addFallingPetals();

  // Rocks: 6 dodecahedrons = 6 primary shapes.
  const rockPositions = [
    [-5, 0, 1], [-2, 0, 3.5], [1.5, 0, 2], [6.5, 0, 0], [-8, 0, -1.5], [0, 0, -2.5]
  ];

  rockPositions.forEach((pos, i) => {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45 + i * 0.03), stoneMat);
    rock.position.set(pos[0], 0.45, pos[2]);
    rock.rotation.set(i * 0.4, i * 0.2, i * 0.3);
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);
  });

  // Center platform: cylinder = another primary shape.
  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(2.0, 2.3, 0.4, 32),
    stoneMat
  );
  platform.position.set(0, 0.2, 0);
  platform.castShadow = true;
  platform.receiveShadow = true;
  scene.add(platform);
}

function createCherryBlossomTree(x, z, scale, index, trunkMat) {
  const treeGroup = new THREE.Group();
  treeGroup.position.set(x, 0, z);
  treeGroup.scale.set(scale, scale, scale);

  const barkMat = new THREE.MeshStandardMaterial({
    color: 0x4b1f12,
    roughness: 0.95,
    flatShading: true
  });

  const barkMatDark = new THREE.MeshStandardMaterial({
    color: 0x2f120a,
    roughness: 1.0,
    flatShading: true
  });

  const blossomMatMain = new THREE.MeshStandardMaterial({
    color: 0xf6d7e8,
    roughness: 0.9,
    flatShading: true
  });

  const blossomMatMid = new THREE.MeshStandardMaterial({
    color: 0xefbfd7,
    roughness: 0.88,
    flatShading: true
  });

  const blossomMatShadow = new THREE.MeshStandardMaterial({
    color: 0xe6a8ca,
    roughness: 0.88,
    flatShading: true
  });

  function addTwig(parent, length, radiusTop, radiusBottom, position, rotation, material = barkMat) {
    const twig = new THREE.Mesh(
      new THREE.CylinderGeometry(radiusTop, radiusBottom, length, 5, 1),
      material
    );
    twig.position.set(...position);
    twig.rotation.set(...rotation);
    twig.castShadow = true;
    twig.receiveShadow = true;
    parent.add(twig);
    return twig;
  }

  function addCanopy(parent, radius, position, scaleVec, rotation, material) {
    const canopy = new THREE.Mesh(
      new THREE.IcosahedronGeometry(radius, 0),
      material
    );
    canopy.position.set(...position);
    canopy.scale.set(...scaleVec);
    canopy.rotation.set(...rotation);
    canopy.castShadow = true;
    canopy.receiveShadow = true;
    parent.add(canopy);
    return canopy;
  }

  // Angled trunk made from a few low-poly segments for a more organic silhouette.
  addTwig(treeGroup, 0.72, 0.20, 0.28, [0.03, 0.34, 0], [0.18, 0.08, -0.18], barkMatDark);
  addTwig(treeGroup, 0.66, 0.12, 0.18, [-0.04, 0.86, 0.02], [0.08, -0.1, 0.28], barkMat);
  addTwig(treeGroup, 0.54, 0.09, 0.12, [0.06, 1.34, 0.02], [-0.1, 0.2, 0.18], barkMat);

  // Main branches.
  addTwig(treeGroup, 1.06, 0.055, 0.11, [0.30, 1.45, -0.02], [0.15, -0.35, -1.0], barkMat);
  addTwig(treeGroup, 0.96, 0.05, 0.1, [-0.28, 1.33, 0.06], [0.08, 0.25, 0.92], barkMat);
  addTwig(treeGroup, 0.86, 0.045, 0.085, [0.10, 1.78, 0.06], [-0.18, 0.1, 0.38], barkMat);
  addTwig(treeGroup, 0.78, 0.04, 0.07, [0.48, 1.80, 0.00], [0.1, 0.15, -0.62], barkMat);
  addTwig(treeGroup, 0.72, 0.038, 0.07, [-0.54, 1.62, 0.10], [0.05, -0.1, 0.7], barkMat);

  // Smaller branch tips so the blossoms feel attached.
  addTwig(treeGroup, 0.46, 0.022, 0.04, [0.76, 1.95, -0.04], [0.08, -0.35, -0.74], barkMatDark);
  addTwig(treeGroup, 0.42, 0.022, 0.04, [-0.80, 1.78, 0.12], [0.1, 0.2, 0.92], barkMatDark);
  addTwig(treeGroup, 0.38, 0.02, 0.038, [0.16, 2.12, 0.10], [-0.2, 0.05, 0.3], barkMatDark);
  addTwig(treeGroup, 0.32, 0.018, 0.034, [0.50, 1.52, 0.25], [0.18, 0.1, -0.4], barkMatDark);

  // Large low-poly blossom masses inspired by the reference image.
  addCanopy(treeGroup, 0.88, [0.20, 2.44, -0.02], [1.65, 0.95, 1.20], [0.08, 0.32, -0.12], blossomMatMain);
  addCanopy(treeGroup, 0.48, [-0.98, 1.94, 0.06], [1.28, 0.95, 1.02], [-0.12, -0.2, 0.18], blossomMatMain);
  addCanopy(treeGroup, 0.44, [0.88, 1.86, -0.02], [1.18, 0.92, 1.0], [0.1, 0.28, -0.25], blossomMatMain);
  addCanopy(treeGroup, 0.36, [-0.12, 1.84, 0.48], [1.15, 0.82, 1.1], [0.22, 0.12, 0.18], blossomMatMid);
  addCanopy(treeGroup, 0.28, [0.16, 1.98, 0.24], [0.95, 0.75, 0.85], [0.1, 0.12, 0.2], blossomMatShadow);
  addCanopy(treeGroup, 0.22, [-0.45, 1.70, -0.14], [1.02, 0.7, 0.82], [0.2, -0.1, -0.22], blossomMatShadow);

  // Sprinkle a few small blossom clumps to soften the silhouette.
  for (let i = 0; i < 7; i++) {
    const puff = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.12 + (i % 2) * 0.03, 0),
      i % 3 === 0 ? blossomMatShadow : blossomMatMid
    );
    const angle = (i / 7) * Math.PI * 2 + index * 0.27;
    puff.position.set(
      Math.cos(angle) * (0.42 + (i % 2) * 0.18),
      1.78 + (i % 4) * 0.16,
      Math.sin(angle) * (0.22 + (i % 3) * 0.1)
    );
    puff.rotation.set(i * 0.3, i * 0.45, i * 0.18);
    puff.castShadow = true;
    puff.receiveShadow = true;
    treeGroup.add(puff);
  }

  scene.add(treeGroup);
  trees.push(treeGroup);
}

function addFallingPetals() {
  const petalMat = new THREE.MeshStandardMaterial({
    color: 0xffb7d5,
    roughness: 0.6,
    side: THREE.DoubleSide
  });

  for (let i = 0; i < 36; i++) {
    const petal = new THREE.Mesh(new THREE.CircleGeometry(0.055, 8), petalMat);
    petal.position.set(
      -10 + (i % 12) * 1.8,
      1.6 + (i % 6) * 0.45,
      -2 + Math.floor(i / 12) * 4.0
    );
    petal.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    petal.userData.baseX = petal.position.x;
    petal.userData.startY = petal.position.y;
    petal.userData.baseZ = petal.position.z;
    petal.userData.offset = i * 0.43;
    scene.add(petal);
    petals.push(petal);
  }
}

function addCoins() {
  const coinMat = new THREE.MeshStandardMaterial({
    color: 0xffd54f,
    emissive: 0xffa000,
    emissiveIntensity: 0.25,
    metalness: 0.7,
    roughness: 0.25
  });

  const positions = [
    [-4, 1.2, -1], [-2, 1.2, 2.2], [1, 1.2, 3.3], [3, 1.2, 0.5],
    [5.5, 1.2, -2], [-6, 1.2, 2], [0, 1.2, -4], [7, 1.2, 2.7]
  ];

  positions.forEach((pos, i) => {
    const coin = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.08, 12, 28), coinMat);
    coin.position.set(pos[0], pos[1], pos[2]);
    coin.rotation.x = Math.PI / 2;
    coin.castShadow = true;
    coin.userData.isCoin = true;
    coin.userData.baseY = pos[1];
    coin.userData.offset = i * 0.7;
    scene.add(coin);
    coins.push(coin);
  });
}

function loadTexturedModel() {
  // Requirement: textured custom 3D model loaded through GLTFLoader.
  // Starter model path: assets/models/rocket.gltf
  // You can replace this with a nicer .glb/.gltf from Poly Pizza or another free model site.
  const loader = new GLTFLoader();

  loader.load(
    'assets/models/rocket.gltf',
    (gltf) => {
      const model = gltf.scene;
      model.position.set(0, 1.15, 0);
      model.scale.set(1.2, 1.2, 1.2);
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(model);
      animatedObjects.push({ type: 'rocket', object: model });
    },
    undefined,
    (error) => {
      console.error('Could not load model. Check assets/models/rocket.gltf', error);
    }
  );
}


function onKeyDown(event) {
  const key = event.key.toLowerCase();

  if (key in keys) {
    keys[key] = true;
    event.preventDefault();
  }
}

function onKeyUp(event) {
  const key = event.key.toLowerCase();

  if (key in keys) {
    keys[key] = false;
    event.preventDefault();
  }
}

function updateCameraMovement(deltaTime) {
  const direction = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();

  // Camera's forward direction, flattened so W/S stays on the ground plane.
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();

  // Right direction based on where the camera is facing.
  right.crossVectors(forward, camera.up).normalize();

  if (keys.w) direction.add(forward);
  if (keys.s) direction.sub(forward);
  if (keys.d) direction.add(right);
  if (keys.a) direction.sub(right);

  if (direction.lengthSq() > 0) {
    direction.normalize().multiplyScalar(moveSpeed * deltaTime);

    // Move both the camera and OrbitControls target together.
    // This keeps mouse rotation working after WASD movement.
    camera.position.add(direction);
    controls.target.add(direction);
  }
}

function onMouseClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(coins.filter((coin) => coin.visible));

  if (hits.length > 0) {
    const coin = hits[0].object;
    coin.visible = false;
    score += 1;
    document.querySelector('#score').textContent = `Coins collected: ${score}`;
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  const deltaTime = clock.getDelta();
  const elapsed = clock.elapsedTime;

  updateCameraMovement(deltaTime);

  coins.forEach((coin) => {
    if (!coin.visible) return;
    coin.rotation.z += 0.04;
    coin.position.y = coin.userData.baseY + Math.sin(elapsed * 2 + coin.userData.offset) * 0.18;
  });

  trees.forEach((tree, i) => {
    tree.rotation.z = Math.sin(elapsed + i) * 0.025;
    tree.rotation.y = Math.sin(elapsed * 0.45 + i) * 0.025;
  });

  petals.forEach((petal, i) => {
    const fall = (elapsed * 0.28 + petal.userData.offset) % 2.8;
    petal.position.y = petal.userData.startY + 0.6 - fall;
    petal.position.x = petal.userData.baseX + Math.sin(elapsed * 0.8 + i) * 0.28;
    petal.position.z = petal.userData.baseZ + Math.cos(elapsed * 0.7 + i) * 0.18;
    petal.rotation.x += 0.012;
    petal.rotation.y += 0.018;
  });

  animatedObjects.forEach((entry) => {
    if (entry.type === 'rocket') {
      entry.object.rotation.y += 0.012;
      entry.object.position.y = 1.15 + Math.sin(elapsed * 1.5) * 0.15;
    }

    if (entry.type === 'light') {
      entry.object.intensity = 65 + Math.sin(elapsed * 3.0) * 18;
    }
  });

  controls.update();
  renderer.render(scene, camera);
}
