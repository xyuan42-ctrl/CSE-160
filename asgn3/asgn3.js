var canvas;
var gl;

var a_Position;
var a_UV;

var u_FragColor;
var u_ModelMatrix;
var u_ViewMatrix;
var u_ProjectionMatrix;

var u_whichTexture;
var u_Sampler0;
var u_Sampler1;
var u_Sampler2;

var camera;

var g_mouseDown = false;

var g_frameCount = 0;
var g_lastFpsUpdate = performance.now();

var g_startTime = performance.now() / 1000.0;
var g_seconds = 0;

// Pig animation variables from Assignment 2
var g_armAngle = 0;
var g_forearmAngle = 0;
var g_handAngle = 0;
var g_headAngle = 0;
var g_bodyBob = 0;
var g_mouthOpen = 0.3;
var g_animation = true;
var g_pokeAnimation = false;
var g_pokeStartTime = 0;

// Pig world position
var PIG_X = -12;
var PIG_Y = 1.0;
var PIG_Z = 12;

var g_foundPig = false;

var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;

  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;

  varying vec2 v_UV;

  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }
`;

var FSHADER_SOURCE = `
  precision mediump float;

  uniform vec4 u_FragColor;

  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;

  uniform int u_whichTexture;

  varying vec2 v_UV;

  void main() {
    if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor;
    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if (u_whichTexture == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else if (u_whichTexture == 2) {
      gl_FragColor = texture2D(u_Sampler2, v_UV);
    } else {
      gl_FragColor = vec4(1.0, 0.2, 0.2, 1.0);
    }
  }
`;

// ------------------------------------------------------
// 32 x 32 world map
// 0 = empty
// 1 = wall height 1
// 2 = wall height 2
// 3 = wall height 3
// 4 = wall height 4
// ------------------------------------------------------

var g_map = [
  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 1, 1, 1, 1, 1, 0, 2, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 2],
  [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
  [2, 0, 2, 2, 2, 1, 0, 2, 2, 2, 2, 2, 2, 2, 0, 1, 2, 2, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 0, 2],
  [2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2],
  [2, 0, 1, 0, 0, 1, 1, 1, 1, 1, 2, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 2, 1, 1, 1, 1, 1, 0, 0, 1, 0, 2],
  [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
  [2, 0, 3, 3, 3, 3, 3, 0, 0, 3, 3, 3, 3, 3, 3, 1, 0, 3, 3, 3, 3, 3, 3, 3, 0, 0, 3, 3, 3, 3, 0, 2],
  [2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2],
  [2, 0, 1, 1, 0, 0, 1, 1, 1, 1, 2, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 2, 0, 1, 1, 1, 1, 1, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2],
  [2, 0, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 2, 2, 0, 2],
  [2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
];

var MAP_SIZE = 32;
var MAP_OFFSET = MAP_SIZE / 2;

// ------------------------------------------------------
// Camera
// ------------------------------------------------------

class Camera {
  constructor() {
    this.fov = 60;

    this.eye = [0, 1.6, 12];
    this.at = [0, 1.6, 11];
    this.up = [0, 1, 0];

    this.speed = 0.35;
    this.turnSpeed = 5;

    this.viewMatrix = new Matrix4();
    this.projectionMatrix = new Matrix4();

    this.updateViewMatrix();
    this.updateProjectionMatrix();
  }

  updateViewMatrix() {
    this.viewMatrix.setLookAt(
      this.eye[0], this.eye[1], this.eye[2],
      this.at[0], this.at[1], this.at[2],
      this.up[0], this.up[1], this.up[2]
    );
  }

  updateProjectionMatrix() {
    this.projectionMatrix.setPerspective(
      this.fov,
      canvas.width / canvas.height,
      0.1,
      1000
    );
  }

  getForwardXZ() {
    var dx = this.at[0] - this.eye[0];
    var dz = this.at[2] - this.eye[2];

    var length = Math.sqrt(dx * dx + dz * dz);

    if (length === 0) {
      return [0, -1];
    }

    return [dx / length, dz / length];
  }

  moveForward() {
    var f = this.getForwardXZ();

    this.eye[0] += f[0] * this.speed;
    this.eye[2] += f[1] * this.speed;
    this.at[0] += f[0] * this.speed;
    this.at[2] += f[1] * this.speed;

    this.updateViewMatrix();
  }

  moveBackwards() {
    var f = this.getForwardXZ();

    this.eye[0] -= f[0] * this.speed;
    this.eye[2] -= f[1] * this.speed;
    this.at[0] -= f[0] * this.speed;
    this.at[2] -= f[1] * this.speed;

    this.updateViewMatrix();
  }

  moveLeft() {
    var f = this.getForwardXZ();

    var leftX = f[1];
    var leftZ = -f[0];

    this.eye[0] += leftX * this.speed;
    this.eye[2] += leftZ * this.speed;
    this.at[0] += leftX * this.speed;
    this.at[2] += leftZ * this.speed;

    this.updateViewMatrix();
  }

  moveRight() {
    var f = this.getForwardXZ();

    var rightX = -f[1];
    var rightZ = f[0];

    this.eye[0] += rightX * this.speed;
    this.eye[2] += rightZ * this.speed;
    this.at[0] += rightX * this.speed;
    this.at[2] += rightZ * this.speed;

    this.updateViewMatrix();
  }

  panLeft() {
    this.pan(this.turnSpeed);
  }

  panRight() {
    this.pan(-this.turnSpeed);
  }

  pan(angle) {
    var dx = this.at[0] - this.eye[0];
    var dz = this.at[2] - this.eye[2];

    var rad = (Math.PI / 180) * angle;
    var cosA = Math.cos(rad);
    var sinA = Math.sin(rad);

    var newDx = dx * cosA - dz * sinA;
    var newDz = dx * sinA + dz * cosA;

    this.at[0] = this.eye[0] + newDx;
    this.at[2] = this.eye[2] + newDz;

    this.updateViewMatrix();
  }
}

// ------------------------------------------------------
// Main setup
// ------------------------------------------------------

function main() {
  setupWebGL();
  connectVariablesToGLSL();

  camera = new Camera();

  initTextures();
  addActionsForHtmlUI();
  setupGameText();

  gl.clearColor(0.5, 0.7, 1.0, 1.0);

  document.onkeydown = keydown;

  requestAnimationFrame(tick);
}

function setupWebGL() {
  canvas = document.getElementById("webgl");
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });

  if (!gl) {
    console.log("Failed to get WebGL context");
    return;
  }

  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to initialize shaders");
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  a_UV = gl.getAttribLocation(gl.program, "a_UV");

  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, "u_ProjectionMatrix");

  u_whichTexture = gl.getUniformLocation(gl.program, "u_whichTexture");
  u_Sampler0 = gl.getUniformLocation(gl.program, "u_Sampler0");
  u_Sampler1 = gl.getUniformLocation(gl.program, "u_Sampler1");
  u_Sampler2 = gl.getUniformLocation(gl.program, "u_Sampler2");

  if (a_Position < 0) {
    console.log("Failed to get a_Position");
  }

  if (a_UV < 0) {
    console.log("Failed to get a_UV");
  }

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

// ------------------------------------------------------
// Textures
// textureNum:
// -2 = solid color
//  0 = wall.png
//  1 = grass.jpg
//  2 = sky.jpg
// ------------------------------------------------------

function initTextures() {
  loadTexture("textures/wall.png", 0);
  loadTexture("textures/grass.jpg", 1);
  loadTexture("textures/sky.jpg", 2);

  return true;
}

function loadTexture(path, textureUnit) {
  var image = new Image();

  image.onload = function () {
    sendTextureToGLSL(image, textureUnit, path);
  };

  image.onerror = function () {
    console.log("Failed to load texture: " + path);
  };

  image.src = path;
}

function sendTextureToGLSL(image, textureUnit, path) {
  var texture = gl.createTexture();

  if (!texture) {
    console.log("Failed to create texture object");
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  if (textureUnit === 0) {
    gl.activeTexture(gl.TEXTURE0);
  } else if (textureUnit === 1) {
    gl.activeTexture(gl.TEXTURE1);
  } else if (textureUnit === 2) {
    gl.activeTexture(gl.TEXTURE2);
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    image
  );

  if (textureUnit === 0) {
    gl.uniform1i(u_Sampler0, 0);
  } else if (textureUnit === 1) {
    gl.uniform1i(u_Sampler1, 1);
  } else if (textureUnit === 2) {
    gl.uniform1i(u_Sampler2, 2);
  }

  console.log("Loaded texture: " + path);
}

// ------------------------------------------------------
// UI / controls
// ------------------------------------------------------

function setupGameText() {
  var status = document.getElementById("gameStatus");

  if (!status) {
    status = document.createElement("p");
    status.id = "gameStatus";
    canvas.insertAdjacentElement("afterend", status);
  }

  status.innerText =
    "Goal: Explore the maze and find the lost pig. Controls: W/A/S/D move, Q/E turn, mouse drag rotate, F delete block, G add block, P toggle pig animation.";
}

function addActionsForHtmlUI() {
  canvas.onmousedown = function () {
    g_mouseDown = true;
  };

  canvas.onmouseup = function () {
    g_mouseDown = false;
  };

  canvas.onmouseleave = function () {
    g_mouseDown = false;
  };

  canvas.onmousemove = function (ev) {
    if (g_mouseDown) {
      camera.pan(-ev.movementX * 0.25);
      renderScene();
    }
  };

  canvas.onclick = function (ev) {
    if (ev.shiftKey) {
      g_pokeAnimation = true;
      g_pokeStartTime = g_seconds;
    }
  };
}

function keydown(ev) {
  var key = ev.key.toLowerCase();

  if (key === "w") {
    camera.moveForward();
  } else if (key === "s") {
    camera.moveBackwards();
  } else if (key === "a") {
    camera.moveLeft();
  } else if (key === "d") {
    camera.moveRight();
  } else if (key === "q") {
    camera.panLeft();
  } else if (key === "e") {
    camera.panRight();
  } else if (key === "f") {
    deleteBlockInFront();
  } else if (key === "g") {
    addBlockInFront();
  } else if (key === "p") {
    g_animation = !g_animation;
  }

  renderScene();
}

// ------------------------------------------------------
// Animation loop
// ------------------------------------------------------

function tick() {
  g_seconds = performance.now() / 1000.0 - g_startTime;

  updateAnimationAngles();
  checkGameGoal();
  renderScene();

  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  if (g_animation) {
    g_armAngle = 5 * Math.sin(g_seconds * 3);
    g_forearmAngle = 10 * Math.sin(g_seconds * 3 + 1);
    g_handAngle = 20 * Math.sin(g_seconds * 5);
    g_headAngle = 5 * Math.sin(g_seconds * 2);
    g_bodyBob = 0.03 * Math.sin(g_seconds * 3);
    g_mouthOpen = 0.22 + 0.28 * Math.abs(Math.sin(g_seconds * 2));
  }

  if (g_pokeAnimation) {
    var pokeTime = g_seconds - g_pokeStartTime;

    g_headAngle = 25 * Math.sin(pokeTime * 20);
    g_armAngle = 45 * Math.sin(pokeTime * 15);
    g_forearmAngle = -50;
    g_handAngle = 30 * Math.sin(pokeTime * 25);

    if (pokeTime > 1.0) {
      g_pokeAnimation = false;
      g_headAngle = 0;
      g_armAngle = 0;
      g_forearmAngle = 0;
      g_handAngle = 0;
    }
  }
}

function checkGameGoal() {
  if (g_foundPig) {
    return;
  }

  var dx = camera.eye[0] - PIG_X;
  var dz = camera.eye[2] - PIG_Z;
  var dist = Math.sqrt(dx * dx + dz * dz);

  if (dist < 2.5) {
    g_foundPig = true;

    var status = document.getElementById("gameStatus");
    if (status) {
      status.innerText = "You found the lost pig! Press F/G to edit blocks or keep exploring.";
    }
  }
}

// ------------------------------------------------------
// Render scene
// ------------------------------------------------------

function renderScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);

  drawSky();
  drawGround();
  drawMap();
  drawPigInWorld();

  updateFPS();
}

function drawGround() {
  var tileSize = 2;

  for (var z = 0; z < 16; z++) {
    for (var x = 0; x < 16; x++) {
      var ground = new Cube();
      ground.color = [0.35, 0.75, 0.25, 1.0];
      ground.textureNum = 1;

      var worldX = x * tileSize - 16;
      var worldZ = z * tileSize - 16;

      // Small terrain height variation
      var height = 0.08 + 0.08 * Math.sin(x * 0.8) * Math.cos(z * 0.7);

      ground.matrix.translate(worldX, -0.15, worldZ);
      ground.matrix.scale(tileSize, height, tileSize);

      ground.render();
    }
  }
}

function drawSky() {
  var sky = new Cube();
  sky.color = [0.5, 0.7, 1.0, 1.0];
  sky.textureNum = 2;

  sky.matrix.translate(-500, -500, -500);
  sky.matrix.scale(1000, 1000, 1000);

  sky.render();
}

function drawMap() {
  for (var z = 0; z < MAP_SIZE; z++) {
    for (var x = 0; x < MAP_SIZE; x++) {
      var height = g_map[z][x];

      for (var y = 0; y < height; y++) {
        var block = new Cube();
        block.textureNum = 0;

        block.matrix.translate(x - MAP_OFFSET, y, z - MAP_OFFSET);
        block.render();
      }
    }
  }
}

// ------------------------------------------------------
// Your original pig, placed inside the world
// ------------------------------------------------------

function drawPigInWorld() {
  var pigPink = [1.0, 0.62, 0.78, 1.0];
  var lightPink = [1.0, 0.75, 0.88, 1.0];
  var darkPink = [0.9, 0.35, 0.5, 1.0];
  var dressColor = [0.95, 0.38, 0.28, 1.0];
  var black = [0.0, 0.0, 0.0, 1.0];
  var white = [1.0, 1.0, 1.0, 1.0];

  var pigBase = new Matrix4();
  pigBase.translate(PIG_X, PIG_Y, PIG_Z);
  pigBase.scale(1.0, 1.0, 1.0);

  drawPigBody(dressColor, pigBase);
  drawPigHead(pigPink, lightPink, darkPink, black, white, pigBase);
  drawLeftArm(lightPink, pigBase);
  drawRightArm(lightPink, pigBase);
  drawLegs(lightPink, pigBase);
}

// ---------------- BODY ----------------

function drawPigBody(color, baseMatrix) {
  var body = new Cube();
  body.textureNum = -2;
  body.color = color;
  body.matrix = new Matrix4(baseMatrix);
  body.matrix.translate(-0.35, -0.7 + g_bodyBob, -0.05);
  body.matrix.scale(0.7, 0.9, 0.25);
  body.render();
}

// ---------------- HEAD + FACE ----------------

function drawPigHead(pigPink, lightPink, darkPink, black, white, baseMatrix) {
  var headBase = new Matrix4(baseMatrix);

  headBase.translate(-0.45, 0.05, -0.2);
  headBase.rotate(g_headAngle, 0, 0, 1);

  var head = new Cube();
  head.textureNum = -2;
  head.color = pigPink;
  head.matrix = new Matrix4(headBase);
  head.matrix.scale(0.9, 0.75, 0.41);
  head.render();

  var leftEar = new Cube();
  leftEar.textureNum = -2;
  leftEar.color = lightPink;
  leftEar.matrix = new Matrix4(headBase);
  leftEar.matrix.translate(0.1, 0.65, 0.02);
  leftEar.matrix.rotate(-18, 0, 0, 1);
  leftEar.matrix.scale(0.18, 0.38, 0.16);
  leftEar.render();

  var rightEar = new Cube();
  rightEar.textureNum = -2;
  rightEar.color = lightPink;
  rightEar.matrix = new Matrix4(headBase);
  rightEar.matrix.translate(0.62, 0.65, 0.02);
  rightEar.matrix.rotate(18, 0, 0, 1);
  rightEar.matrix.scale(0.18, 0.38, 0.16);
  rightEar.render();

  var snout = new Cylinder();
  snout.color = lightPink;
  snout.matrix = new Matrix4(headBase);
  snout.matrix.translate(0.49, 0.39, -0.1);
  snout.matrix.scale(0.25, 0.25, 0.16);

  // Cylinder.js may not know about u_whichTexture, so force solid color.
  gl.uniform1i(u_whichTexture, -2);
  snout.render();

  var nostril1 = new Cube();
  nostril1.textureNum = -2;
  nostril1.color = darkPink;
  nostril1.matrix = new Matrix4(headBase);
  nostril1.matrix.translate(0.4, 0.34, -0.11);
  nostril1.matrix.scale(0.05, 0.08, 0.03);
  nostril1.render();

  var nostril2 = new Cube();
  nostril2.textureNum = -2;
  nostril2.color = darkPink;
  nostril2.matrix = new Matrix4(headBase);
  nostril2.matrix.translate(0.53, 0.34, -0.11);
  nostril2.matrix.scale(0.05, 0.08, 0.03);
  nostril2.render();

  var leftEye = new Cube();
  leftEye.textureNum = -2;
  leftEye.color = white;
  leftEye.matrix = new Matrix4(headBase);
  leftEye.matrix.translate(0.28, 0.52, -0.01);
  leftEye.matrix.scale(0.18, 0.18, 0.04);
  leftEye.render();

  var rightEye = new Cube();
  rightEye.textureNum = -2;
  rightEye.color = white;
  rightEye.matrix = new Matrix4(headBase);
  rightEye.matrix.translate(0.52, 0.52, -0.01);
  rightEye.matrix.scale(0.18, 0.18, 0.04);
  rightEye.render();

  var leftPupil = new Cube();
  leftPupil.textureNum = -2;
  leftPupil.color = black;
  leftPupil.matrix = new Matrix4(headBase);
  leftPupil.matrix.translate(0.36, 0.58, -0.02);
  leftPupil.matrix.scale(0.06, 0.06, 0.03);
  leftPupil.render();

  var rightPupil = new Cube();
  rightPupil.textureNum = -2;
  rightPupil.color = black;
  rightPupil.matrix = new Matrix4(headBase);
  rightPupil.matrix.translate(0.6, 0.58, -0.02);
  rightPupil.matrix.scale(0.06, 0.06, 0.03);
  rightPupil.render();

  var mouth = new Cube();
  mouth.textureNum = -2;
  mouth.color = black;
  mouth.matrix = new Matrix4(headBase);
  mouth.matrix.translate(0.38, 0.18 - g_mouthOpen / 2, -0.02);
  mouth.matrix.scale(0.23, g_mouthOpen, 0.05);
  mouth.render();

  var cheek1 = new Cube();
  cheek1.textureNum = -2;
  cheek1.color = [1.0, 0.45, 0.65, 1.0];
  cheek1.matrix = new Matrix4(headBase);
  cheek1.matrix.translate(0.08, 0.18, -0.01);
  cheek1.matrix.scale(0.15, 0.12, 0.03);
  cheek1.render();

  var cheek2 = new Cube();
  cheek2.textureNum = -2;
  cheek2.color = [1.0, 0.45, 0.65, 1.0];
  cheek2.matrix = new Matrix4(headBase);
  cheek2.matrix.translate(0.7, 0.18, -0.01);
  cheek2.matrix.scale(0.15, 0.12, 0.03);
  cheek2.render();
}

// ---------------- LEFT ARM ----------------

function drawLeftArm(color, baseMatrix) {
  var shoulder = new Matrix4(baseMatrix);
  shoulder.translate(-0.30, -0.1, -0.04);
  shoulder.rotate(160 + g_armAngle, 0, 0, 1);

  var upperArm = new Cube();
  upperArm.textureNum = -2;
  upperArm.color = color;
  upperArm.matrix = new Matrix4(shoulder);
  upperArm.matrix.scale(0.43, 0.07, 0.07);
  upperArm.render();

  var elbow = new Matrix4(shoulder);
  elbow.translate(0.38, 0, 0);
  elbow.rotate(-55 + g_forearmAngle, 0, 0, 1);

  var forearm = new Cube();
  forearm.textureNum = -2;
  forearm.color = color;
  forearm.matrix = new Matrix4(elbow);
  forearm.matrix.scale(0.36, 0.07, 0.07);
  forearm.render();

  var wrist = new Matrix4(elbow);
  wrist.translate(0.36, 0, 0);
  wrist.rotate(g_handAngle, 0, 0, 1);

  var hand = new Cube();
  hand.textureNum = -2;
  hand.color = color;
  hand.matrix = new Matrix4(wrist);
  hand.matrix.scale(0.12, 0.12, 0.07);
  hand.render();
}

// ---------------- RIGHT ARM ----------------

function drawRightArm(color, baseMatrix) {
  var shoulder = new Matrix4(baseMatrix);
  shoulder.translate(0.34, -0.15, -0.0);
  shoulder.rotate(20 - g_armAngle, 0, 0, 1);

  var upperArm = new Cube();
  upperArm.textureNum = -2;
  upperArm.color = color;
  upperArm.matrix = new Matrix4(shoulder);
  upperArm.matrix.scale(0.30, 0.07, 0.07);
  upperArm.render();

  var elbow = new Matrix4(shoulder);
  elbow.translate(0.31, 0.02, 0);
  elbow.rotate(55 - g_forearmAngle, 0, 0, 1);

  var forearm = new Cube();
  forearm.textureNum = -2;
  forearm.color = color;
  forearm.matrix = new Matrix4(elbow);
  forearm.matrix.scale(0.36, 0.07, 0.07);
  forearm.render();

  var wrist = new Matrix4(elbow);
  wrist.translate(0.36, 0, 0);
  wrist.rotate(-g_handAngle, 0, 0, 1);

  var hand = new Cube();
  hand.textureNum = -2;
  hand.color = color;
  hand.matrix = new Matrix4(wrist);
  hand.matrix.scale(0.12, 0.12, 0.07);
  hand.render();
}

// ---------------- LEGS ----------------

function drawLegs(color, baseMatrix) {
  var leftLeg = new Cube();
  leftLeg.textureNum = -2;
  leftLeg.color = color;
  leftLeg.matrix = new Matrix4(baseMatrix);
  leftLeg.matrix.translate(-0.22, -1, 0.06);
  leftLeg.matrix.scale(0.08, 0.35, 0.08);
  leftLeg.render();

  var rightLeg = new Cube();
  rightLeg.textureNum = -2;
  rightLeg.color = color;
  rightLeg.matrix = new Matrix4(baseMatrix);
  rightLeg.matrix.translate(0.17, -1, 0.06);
  rightLeg.matrix.scale(0.08, 0.35, 0.08);
  rightLeg.render();
}

// ------------------------------------------------------
// Add / delete blocks
// F = delete block
// G = add block
// ------------------------------------------------------

function getFrontMapCell() {
  var f = camera.getForwardXZ();

  var frontX = camera.eye[0] + f[0] * 2.0;
  var frontZ = camera.eye[2] + f[1] * 2.0;

  var mapX = Math.floor(frontX + MAP_OFFSET);
  var mapZ = Math.floor(frontZ + MAP_OFFSET);

  if (mapX < 0 || mapX >= MAP_SIZE || mapZ < 0 || mapZ >= MAP_SIZE) {
    return null;
  }

  return {
    x: mapX,
    z: mapZ
  };
}

function addBlockInFront() {
  var cell = getFrontMapCell();

  if (cell === null) {
    return;
  }

  if (g_map[cell.z][cell.x] < 4) {
    g_map[cell.z][cell.x]++;
  }
}

function deleteBlockInFront() {
  var cell = getFrontMapCell();

  if (cell === null) {
    return;
  }

  if (g_map[cell.z][cell.x] > 0) {
    g_map[cell.z][cell.x]--;
  }
}

// ------------------------------------------------------
// FPS
// ------------------------------------------------------

function updateFPS() {
  var now = performance.now();

  g_frameCount++;

  if (now - g_lastFpsUpdate >= 500) {
    var elapsed = now - g_lastFpsUpdate;
    var fps = Math.round((g_frameCount * 1000) / elapsed);

    var fpsElement = document.getElementById("fps");
    if (fpsElement) {
      fpsElement.innerText = "FPS: " + fps;
    }

    g_frameCount = 0;
    g_lastFpsUpdate = now;
  }
}