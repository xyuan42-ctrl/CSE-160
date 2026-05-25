function drawTriangle3D(vertices) {
  var n = vertices.length / 3;

  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log("Failed to create buffer");
    return;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0, n);
}