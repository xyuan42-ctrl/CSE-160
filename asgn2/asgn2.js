var canvas;
var gl;

var a_Position;
var u_FragColor;
var u_ModelMatrix;
var u_GlobalRotateMatrix;

var g_globalAngle = 0;
var g_armAngle = 0;
var g_forearmAngle = 0;
var g_handAngle = 0;
var g_headAngle = 0;
var g_bodyBob = 0;
var g_pokeAnimation = false;
var g_pokeStartTime = 0;

var g_mouseDown = false;

var g_mouthOpen = 0.3;

var g_animation = false;

var g_startTime = performance.now() / 1000.0;
var g_seconds = 0;

var g_lastFrameTime = performance.now();

var g_frameCount = 0;
var g_lastFpsUpdate = performance.now();

var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;

  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }
`;

var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;

  void main() {
    gl_FragColor = u_FragColor;
  }
`;

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForHtmlUI();

  gl.clearColor(0.18, 0.04, 0.16, 1.0);

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
  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, "u_GlobalRotateMatrix");

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

function addActionsForHtmlUI() {
  document.getElementById("angleSlide").addEventListener("input", function () {
    g_globalAngle = Number(this.value);
  });

  document.getElementById("armSlide").addEventListener("input", function () {
    g_armAngle = Number(this.value);
  });

  document.getElementById("forearmSlide").addEventListener("input", function () {
    g_forearmAngle = Number(this.value);
  });

  document.getElementById("handSlide").addEventListener("input", function () {
    g_handAngle = Number(this.value);
  });

  document.getElementById("animationOnButton").onclick = function () {
    g_animation = true;
  };

  document.getElementById("animationOffButton").onclick = function () {
    g_animation = false;
  };

  

  // Mouse drag rotate
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
      g_globalAngle += ev.movementX;
    }
  };

  // Shift-click poke animation
  canvas.onclick = function (ev) {
    if (ev.shiftKey) {
      g_pokeAnimation = true;
      g_pokeStartTime = g_seconds;
    }
  };
}

function tick() {
  g_seconds = performance.now() / 1000.0 - g_startTime;

  updateAnimationAngles();
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
function renderScene() {
  var globalRotMat = new Matrix4();
  globalRotMat.rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var pigPink = [1.0, 0.62, 0.78, 1.0];
  var lightPink = [1.0, 0.75, 0.88, 1.0];
  var darkPink = [0.9, 0.35, 0.5, 1.0];
  var dressColor = [0.95, 0.38, 0.28, 1.0];
  var black = [0.0, 0.0, 0.0, 1.0];
  var white = [1.0, 1.0, 1.0, 1.0];

  drawPigBody(dressColor);
  drawPigHead(pigPink, lightPink, darkPink, black, white);
  drawLeftArm(lightPink);
  drawRightArm(lightPink);
  drawLegs(lightPink);



  updateFPS();
}

function updateFPS() {
  var now = performance.now();

  g_frameCount++;

  if (now - g_lastFpsUpdate >= 500) {
    var elapsed = now - g_lastFpsUpdate;
    var fps = Math.round((g_frameCount * 1000) / elapsed);

    document.getElementById("fps").innerText = "FPS: " + fps;

    g_frameCount = 0;
    g_lastFpsUpdate = now;
  }
}

// ---------------- BODY ----------------

function drawPigBody(color) {
  var body = new Cube();
  body.color = color;
  body.matrix.translate(-0.35, -0.7 + g_bodyBob, -0.05);
  body.matrix.scale(0.7, 0.9, 0.25);
  body.render();
}

// ---------------- HEAD + FACE ----------------

function drawPigHead(pigPink, lightPink, darkPink, black, white) {
  var headBase = new Matrix4();

  // This is the parent matrix for the whole head.
  // Face pieces now follow the head.
  headBase.translate(-0.45, 0.05, -0.2);
  headBase.rotate(g_headAngle, 0, 0, 1);

  var head = new Cube();
  head.color = pigPink;
  head.matrix = new Matrix4(headBase);
  head.matrix.scale(0.9, 0.75, 0.41);
  head.render();

  // Ears connected to head
  var leftEar = new Cube();
  leftEar.color = lightPink;
  leftEar.matrix = new Matrix4(headBase);
  leftEar.matrix.translate(0.1, 0.65, 0.02);
  leftEar.matrix.rotate(-18, 0, 0, 1);
  leftEar.matrix.scale(0.18, 0.38, 0.16);
  leftEar.render();

  var rightEar = new Cube();
  rightEar.color = lightPink;
  rightEar.matrix = new Matrix4(headBase);
  rightEar.matrix.translate(0.62, 0.65, 0.02);
  rightEar.matrix.rotate(18, 0, 0, 1);
  rightEar.matrix.scale(0.18, 0.38, 0.16);
  rightEar.render();

  // Snout connected to head front
  var snout = new Cylinder();
  snout.color = lightPink;
  snout.matrix = new Matrix4(headBase);
  snout.matrix.translate(0.49, 0.39, -0.1);
  snout.matrix.scale(0.25, 0.25, 0.16);
  snout.render();

  var nostril1 = new Cube();
  nostril1.color = darkPink;
  nostril1.matrix = new Matrix4(headBase);
  nostril1.matrix.translate(0.4, 0.34, -0.11);
  nostril1.matrix.scale(0.05, 0.08, 0.03);
  nostril1.render();

  var nostril2 = new Cube();
  nostril2.color = darkPink;
  nostril2.matrix = new Matrix4(headBase);
  nostril2.matrix.translate(0.53, 0.34, -0.11);
  nostril2.matrix.scale(0.05, 0.08, 0.03);
  nostril2.render();

  // Eyes connected to head
  var leftEye = new Cube();
  leftEye.color = white;
  leftEye.matrix = new Matrix4(headBase);
  leftEye.matrix.translate(0.28, 0.52, -0.01);
  leftEye.matrix.scale(0.18, 0.18, 0.04);
  leftEye.render();

  var rightEye = new Cube();
  rightEye.color = white;
  rightEye.matrix = new Matrix4(headBase);
  rightEye.matrix.translate(0.52, 0.52, -0.01);
  rightEye.matrix.scale(0.18, 0.18, 0.04);
  rightEye.render();

  var leftPupil = new Cube();
  leftPupil.color = black;
  leftPupil.matrix = new Matrix4(headBase);
  leftPupil.matrix.translate(0.36, 0.58, -0.02);
  leftPupil.matrix.scale(0.06, 0.06, 0.03);
  leftPupil.render();

  var rightPupil = new Cube();
  rightPupil.color = black;
  rightPupil.matrix = new Matrix4(headBase);
  rightPupil.matrix.translate(0.6, 0.58, -0.02);
  rightPupil.matrix.scale(0.06, 0.06, 0.03);
  rightPupil.render();

  // Shocked mouth
  var mouth = new Cube();
  mouth.color = black;
  mouth.matrix = new Matrix4(headBase);
  mouth.matrix.translate(0.38, 0.18 - g_mouthOpen / 2, -0.02);
  mouth.matrix.scale(0.23, g_mouthOpen, 0.05);
  mouth.render();

  // Cheeks
  var cheek1 = new Cube();
  cheek1.color = [1.0, 0.45, 0.65, 1.0];
  cheek1.matrix = new Matrix4(headBase);
  cheek1.matrix.translate(0.08, 0.18, -0.01);
  cheek1.matrix.scale(0.15, 0.12, 0.03);
  cheek1.render();

  var cheek2 = new Cube();
  cheek2.color = [1.0, 0.45, 0.65, 1.0];
  cheek2.matrix = new Matrix4(headBase);
  cheek2.matrix.translate(0.7, 0.18, -0.01);
  cheek2.matrix.scale(0.15, 0.12, 0.03);
  cheek2.render();
}

// ---------------- LEFT ARM: 3-LEVEL CHAIN ----------------

function drawLeftArm(color) {
  var shoulder = new Matrix4();
  shoulder.translate(-0.30, -0.1, -0.04);
  shoulder.rotate(160 + g_armAngle, 0, 0, 1);

  var upperArm = new Cube();
  upperArm.color = color;
  upperArm.matrix = new Matrix4(shoulder);
  upperArm.matrix.scale(0.43, 0.07, 0.07);
  upperArm.render();

  var elbow = new Matrix4(shoulder);
  elbow.translate(0.38, 0, 0);
  elbow.rotate(-55 + g_forearmAngle, 0, 0, 1);

  var forearm = new Cube();
  forearm.color = color;
  forearm.matrix = new Matrix4(elbow);
  forearm.matrix.scale(0.36, 0.07, 0.07);
  forearm.render();

  var wrist = new Matrix4(elbow);
  wrist.translate(0.36, 0, 0);
  wrist.rotate(g_handAngle, 0, 0, 1);

  var hand = new Cube();
  hand.color = color;
  hand.matrix = new Matrix4(wrist);
  hand.matrix.scale(0.12, 0.12, 0.07);
  hand.render();
}

// ---------------- RIGHT ARM: 3-LEVEL CHAIN ----------------

function drawRightArm(color) {
  var shoulder = new Matrix4();
  shoulder.translate(0.34, -0.15, -0.0);
  shoulder.rotate(20 - g_armAngle, 0, 0, 1);

  var upperArm = new Cube();
  upperArm.color = color;
  upperArm.matrix = new Matrix4(shoulder);
  upperArm.matrix.scale(0.30, 0.07, 0.07);
  upperArm.render();

  var elbow = new Matrix4(shoulder);
  elbow.translate(0.31, 0.02, 0);
  elbow.rotate(55 - g_forearmAngle, 0, 0, 1);

  var forearm = new Cube();
  forearm.color = color;
  forearm.matrix = new Matrix4(elbow);
  forearm.matrix.scale(0.36, 0.07, 0.07);
  forearm.render();

  var wrist = new Matrix4(elbow);
  wrist.translate(0.36, 0, 0);
  wrist.rotate(-g_handAngle, 0, 0, 1);

  var hand = new Cube();
  hand.color = color;
  hand.matrix = new Matrix4(wrist);
  hand.matrix.scale(0.12, 0.12, 0.07);
  hand.render();
}

// ---------------- LEGS ----------------

function drawLegs(color) {
  var leftLeg = new Cube();
  leftLeg.color = color;
  leftLeg.matrix.translate(-0.22, -1, 0.06);
  leftLeg.matrix.scale(0.08, 0.35, 0.08);
  leftLeg.render();

  var rightLeg = new Cube();
  rightLeg.color = color;
  rightLeg.matrix.translate(0.17, -1, 0.06);
  rightLeg.matrix.scale(0.08, 0.35, 0.08);
  rightLeg.render();
}

