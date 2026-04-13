var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform float u_Size;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  gl_PointSize = u_Size;\n' +
  '}\n';

var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';

// =========================
// Global constants
// =========================
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// =========================
// Global WebGL variables
// =========================
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

// =========================
// Global UI state
// =========================
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 10.0;
let g_selectedType = POINT;
let g_selectedSegments = 10;

// Awesomeness: rainbow mode
let g_rainbowMode = false;
let g_rainbowHue = 0;

// =========================
// Shape list
// =========================
let g_shapesList = [];

// =========================
// Main
// =========================
function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForHtmlUI();

  canvas.onmousedown = function(ev) {
    click(ev);
  };

  canvas.onmousemove = function(ev) {
    if (ev.buttons === 1) {
      click(ev);
    }
  };

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  renderAllShapes();
}

// =========================
// Setup functions
// =========================
function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });

  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
  }
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

function addActionsForHtmlUI() {
  document.getElementById('clearButton').onclick = function() {
    g_shapesList = [];
    renderAllShapes();
  };

  document.getElementById('pointButton').onclick = function() {
    g_selectedType = POINT;
  };

  document.getElementById('triButton').onclick = function() {
    g_selectedType = TRIANGLE;
  };

  document.getElementById('circleButton').onclick = function() {
    g_selectedType = CIRCLE;
  };

  document.getElementById('redSlide').oninput = function() {
    g_selectedColor[0] = Number(this.value) / 100;
  };

  document.getElementById('greenSlide').oninput = function() {
    g_selectedColor[1] = Number(this.value) / 100;
  };

  document.getElementById('blueSlide').oninput = function() {
    g_selectedColor[2] = Number(this.value) / 100;
  };

  document.getElementById('sizeSlide').oninput = function() {
    g_selectedSize = Number(this.value);
  };

  document.getElementById('segmentSlide').oninput = function() {
    g_selectedSegments = Number(this.value);
  };

  document.getElementById('rainbowToggle').onchange = function() {
    g_rainbowMode = this.checked;
  };

  document.getElementById('drawPictureButton').onclick = function() {
    drawWindmillXY();
  };
}

// =========================
// Click handling
// =========================
function click(ev) {
  let [x, y] = convertCoordinatesEventToGL(ev);
  let shape;

  if (g_selectedType === POINT) {
    shape = new Point();
  } else if (g_selectedType === TRIANGLE) {
    shape = new Triangle();
  } else {
    shape = new Circle();
    shape.segments = g_selectedSegments;
  }

  shape.position = [x, y];

  if (g_rainbowMode) {
    let rgb = hsvToRgb(g_rainbowHue, 1.0, 1.0);
    shape.color = [rgb[0], rgb[1], rgb[2], 1.0];

    g_rainbowHue += 8;
    if (g_rainbowHue >= 360) {
      g_rainbowHue = 0;
    }
  } else {
    shape.color = [
      g_selectedColor[0],
      g_selectedColor[1],
      g_selectedColor[2],
      g_selectedColor[3]
    ];
  }

  shape.size = g_selectedSize;

  g_shapesList.push(shape);
  renderAllShapes();
}

function convertCoordinatesEventToGL(ev) {
  let x = ev.clientX;
  let y = ev.clientY;
  let rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

  return [x, y];
}

// =========================
// Render
// =========================
function renderAllShapes() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  let len = g_shapesList.length;
  for (let i = 0; i < len; i++) {
    g_shapesList[i].render();
  }
}

// =========================
// Shape classes
// =========================
class Point {
  constructor() {
    this.type = 'point';
    this.position = [0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 10.0;
  }

  render() {
    let xy = this.position;
    let rgba = this.color;
    let size = this.size;

    gl.disableVertexAttribArray(a_Position);
    gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniform1f(u_Size, size);
    gl.drawArrays(gl.POINTS, 0, 1);
  }
}

class Triangle {
  constructor() {
    this.type = 'triangle';
    this.position = [0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 10.0;
    this.vertices = null;
  }

  render() {
    let rgba = this.color;

    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniform1f(u_Size, this.size);

    if (this.vertices !== null) {
      drawTriangle(this.vertices);
      return;
    }

    let xy = this.position;
    let d = this.size / 200.0;

    drawTriangle([
      xy[0],     xy[1] + d,
      xy[0] - d, xy[1] - d,
      xy[0] + d, xy[1] - d
    ]);
  }
}

class Circle {
  constructor() {
    this.type = 'circle';
    this.position = [0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 10.0;
    this.segments = 10;
  }

  render() {
    let xy = this.position;
    let rgba = this.color;
    let size = this.size;
    let radius = size / 200.0;

    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniform1f(u_Size, size);

    let angleStep = 360 / this.segments;

    for (let angle = 0; angle < 360; angle += angleStep) {
      let angle1 = angle * Math.PI / 180.0;
      let angle2 = (angle + angleStep) * Math.PI / 180.0;

      let x1 = xy[0] + Math.cos(angle1) * radius;
      let y1 = xy[1] + Math.sin(angle1) * radius;

      let x2 = xy[0] + Math.cos(angle2) * radius;
      let y2 = xy[1] + Math.sin(angle2) * radius;

      drawTriangle([
        xy[0], xy[1],
        x1, y1,
        x2, y2
      ]);
    }
  }
}

// =========================
// Triangle drawing helper
// =========================
function drawTriangle(vertices) {
  let vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function makeCustomTriangle(vertices, color) {
  let t = new Triangle();
  t.vertices = vertices;
  t.color = color;
  return t;
}

// =========================
// Rainbow helper
// =========================
function hsvToRgb(h, s, v) {
  let c = v * s;
  let x = c * (1 - Math.abs((h / 60) % 2 - 1));
  let m = v - c;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  return [r + m, g + m, b + m];
}

// =========================
// Required picture:
// Windmill using initials X and Y
// 20+ triangles
// =========================
function drawWindmillXY() {
  g_shapesList = [];

  // Sky
  g_shapesList.push(makeCustomTriangle(
    [-1.0,  1.0,  -1.0, 0.2,   1.0, 1.0],
    [0.55, 0.8, 1.0, 1.0]
  ));
  g_shapesList.push(makeCustomTriangle(
    [-1.0,  0.2,   1.0, 0.2,   1.0, 1.0],
    [0.55, 0.8, 1.0, 1.0]
  ));

  // Ground
  g_shapesList.push(makeCustomTriangle(
    [-1.0, 0.2,  -1.0,-1.0,   1.0, 0.2],
    [0.45, 0.78, 0.35, 1.0]
  ));
  g_shapesList.push(makeCustomTriangle(
    [-1.0,-1.0,   1.0,-1.0,   1.0, 0.2],
    [0.45, 0.78, 0.35, 1.0]
  ));

  // Windmill body
  g_shapesList.push(makeCustomTriangle(
    [-0.18, -0.75,  -0.05, -0.15,   0.00, -0.75],
    [0.82, 0.68, 0.50, 1.0]
  ));
  g_shapesList.push(makeCustomTriangle(
    [ 0.00, -0.75,  -0.05, -0.15,   0.18, -0.75],
    [0.78, 0.62, 0.45, 1.0]
  ));


  // X support (initial X)
  g_shapesList.push(makeCustomTriangle(
    [-0.22, 0.24,  -0.18, 0.28,   0.22,-0.16],
    [0.25, 0.25, 0.28, 1.0]
  ));
  g_shapesList.push(makeCustomTriangle(
    [-0.22, 0.24,   0.18,-0.20,   0.22,-0.16],
    [0.22, 0.22, 0.25, 1.0]
  ));
  g_shapesList.push(makeCustomTriangle(
    [-0.22,-0.16,  -0.18,-0.20,   0.22, 0.24],
    [0.25, 0.25, 0.28, 1.0]
  ));
  g_shapesList.push(makeCustomTriangle(
    [-0.22,-0.16,   0.18, 0.28,   0.22, 0.24],
    [0.22, 0.22, 0.25, 1.0]
  ));

  // Top blade (3 triangles)
  g_shapesList.push(makeCustomTriangle(
    [-0.03, 0.02,   0.00, 0.52,   0.03, 0.02],
    [0.96, 0.96, 0.98, 1.0]
  ));
  g_shapesList.push(makeCustomTriangle(
    [-0.03, 0.02,  -0.11, 0.28,   0.00, 0.22],
    [0.88, 0.88, 0.92, 1.0]
  ));
  g_shapesList.push(makeCustomTriangle(
    [ 0.03, 0.02,   0.11, 0.28,   0.00, 0.22],
    [0.82, 0.82, 0.88, 1.0]
  ));

  // Right blade (3 triangles)
  g_shapesList.push(makeCustomTriangle(
    [0.02,  0.03,   0.52, 0.00,   0.02,-0.03],
    [0.96, 0.96, 0.98, 1.0]
  ));
  g_shapesList.push(makeCustomTriangle(
    [0.02,  0.03,   0.28, 0.11,   0.22, 0.00],
    [0.88, 0.88, 0.92, 1.0]
  ));
  g_shapesList.push(makeCustomTriangle(
    [0.02, -0.03,   0.28,-0.11,   0.22, 0.00],
    [0.82, 0.82, 0.88, 1.0]
  ));

  // Bottom blade (3 triangles)
  g_shapesList.push(makeCustomTriangle(
    [-0.03,-0.02,   0.00,-0.52,   0.03,-0.02],
    [0.96, 0.96, 0.98, 1.0]
  ));
  g_shapesList.push(makeCustomTriangle(
    [-0.03,-0.02,  -0.11,-0.28,   0.00,-0.22],
    [0.88, 0.88, 0.92, 1.0]
  ));
  g_shapesList.push(makeCustomTriangle(
    [ 0.03,-0.02,   0.11,-0.28,   0.00,-0.22],
    [0.82, 0.82, 0.88, 1.0]
  ));

  // Left blade (3 triangles)
  g_shapesList.push(makeCustomTriangle(
    [-0.02, 0.03,  -0.52, 0.00,  -0.02,-0.03],
    [0.96, 0.96, 0.98, 1.0]
  ));
  g_shapesList.push(makeCustomTriangle(
    [-0.02, 0.03,  -0.28, 0.11,  -0.22, 0.00],
    [0.88, 0.88, 0.92, 1.0]
  ));
  g_shapesList.push(makeCustomTriangle(
    [-0.02,-0.03,  -0.28,-0.11,  -0.22, 0.00],
    [0.82, 0.82, 0.88, 1.0]
  ));

  // Y on windmill body (initial Y)
  g_shapesList.push(makeCustomTriangle(
    [-0.09, -0.28,  -0.05, -0.24,  -0.01, -0.38],
    [0.15, 0.18, 0.55, 1.0]
  ));
  g_shapesList.push(makeCustomTriangle(
    [-0.01, -0.38,  -0.05, -0.24,   0.01, -0.38],
    [0.12, 0.15, 0.48, 1.0]
  ));
  g_shapesList.push(makeCustomTriangle(
    [ 0.09, -0.28,   0.05, -0.24,   0.01, -0.38],
    [0.15, 0.18, 0.55, 1.0]
  ));
  g_shapesList.push(makeCustomTriangle(
    [-0.02, -0.38,   0.02, -0.38,   0.00, -0.62],
    [0.12, 0.15, 0.48, 1.0]
  ));

  renderAllShapes();
}
