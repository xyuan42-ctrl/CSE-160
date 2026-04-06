function main() {  
  var canvas = document.getElementById('webgl');  
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  } 

  var ctx = canvas.getContext('2d');

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 400, 400);

  var v1 = new Vector3([2.25, 2.25, 0]);
  drawVector(v1, "red"); 
}

function drawVector(v, color) {
  var canvas = document.getElementById('webgl');
  var ctx = canvas.getContext('2d');

  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(200, 200);
  ctx.lineTo(
    200 + v.elements[0] * 20,
    200 - v.elements[1] * 20
  );
  ctx.stroke();
}

function clearCanvas() {
  var canvas = document.getElementById('webgl');
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 400, 400);
}

function angleBetween(v1, v2) {
  var dot = Vector3.dot(v1, v2);
  var mag1 = v1.magnitude();
  var mag2 = v2.magnitude();

  if (mag1 === 0 || mag2 === 0) {
    return 0;
  }

  var cosAlpha = dot / (mag1 * mag2);
  cosAlpha = Math.min(1, Math.max(-1, cosAlpha));

  var angleRad = Math.acos(cosAlpha);
  var angleDeg = angleRad * 180 / Math.PI;

  return angleDeg;
}

function areaTriangle(v1, v2) {
  var cross = Vector3.cross(v1, v2);
  var areaParallelogram = cross.magnitude();
  var areaTriangle = areaParallelogram / 2;
  return areaTriangle;
}

function handleDrawEvent() {
  clearCanvas();

  var x1 = parseFloat(document.getElementById('x1').value);
  var y1 = parseFloat(document.getElementById('y1').value);
  var v1 = new Vector3([x1, y1, 0]);

  var x2 = parseFloat(document.getElementById('x2').value);
  var y2 = parseFloat(document.getElementById('y2').value);
  var v2 = new Vector3([x2, y2, 0]);

  drawVector(v1, "red");
  drawVector(v2, "blue");
}

function handleDrawOperationEvent() {
  clearCanvas();

  var x1 = parseFloat(document.getElementById('x1').value);
  var y1 = parseFloat(document.getElementById('y1').value);
  var v1 = new Vector3([x1, y1, 0]);

  var x2 = parseFloat(document.getElementById('x2').value);
  var y2 = parseFloat(document.getElementById('y2').value);
  var v2 = new Vector3([x2, y2, 0]);

  drawVector(v1, "red");
  drawVector(v2, "blue");

  var op = document.getElementById('operation').value;
  var scalar = parseFloat(document.getElementById('scalar').value);

  if (op === "add") {
    var v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    v3.add(v2);
    drawVector(v3, "green");

  } else if (op === "sub") {
    var v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    v3.sub(v2);
    drawVector(v3, "green");

  } else if (op === "mul") {
    var v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    var v4 = new Vector3([v2.elements[0], v2.elements[1], v2.elements[2]]);
    v3.mul(scalar);
    v4.mul(scalar);
    drawVector(v3, "green");
    drawVector(v4, "green");

  } else if (op === "div") {
    var v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    var v4 = new Vector3([v2.elements[0], v2.elements[1], v2.elements[2]]);
    v3.div(scalar);
    v4.div(scalar);
    drawVector(v3, "green");
    drawVector(v4, "green");

  } else if (op === "magnitude") {
    console.log("Magnitude v1: " + v1.magnitude());
    console.log("Magnitude v2: " + v2.magnitude());

  } else if (op === "normalize") {
    var v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    var v4 = new Vector3([v2.elements[0], v2.elements[1], v2.elements[2]]);
    v3.normalize();
    v4.normalize();
    drawVector(v3, "green");
    drawVector(v4, "green");

  } else if (op === "angle") {
    var angle = angleBetween(v1, v2);
    console.log("Angle between v1 and v2: " + angle + " degrees");

  } else if (op === "area") {
    var area = areaTriangle(v1, v2);
    console.log("Area of the triangle: " + area);
  }
}