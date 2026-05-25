class Cube {
  constructor() {
    this.color = [1, 1, 1, 1];
    this.matrix = new Matrix4();

    // -2 = solid color
    //  0 = wall texture
    //  1 = grass texture
    //  2 = sky texture
    this.textureNum = -2;

    if (!Cube.initialized) {
      Cube.initCubeBuffers();
      Cube.initialized = true;
    }
  }

  static initCubeBuffers() {
    // 36 vertices total, 6 faces * 2 triangles * 3 vertices
    Cube.vertices = new Float32Array([
      // Front face z = 0
      0,0,0,  1,1,0,  1,0,0,
      0,0,0,  0,1,0,  1,1,0,

      // Back face z = 1
      0,0,1,  1,0,1,  1,1,1,
      0,0,1,  1,1,1,  0,1,1,

      // Top face y = 1
      0,1,0,  0,1,1,  1,1,1,
      0,1,0,  1,1,1,  1,1,0,

      // Bottom face y = 0
      0,0,0,  1,0,0,  1,0,1,
      0,0,0,  1,0,1,  0,0,1,

      // Left face x = 0
      0,0,0,  0,0,1,  0,1,1,
      0,0,0,  0,1,1,  0,1,0,

      // Right face x = 1
      1,0,0,  1,1,0,  1,1,1,
      1,0,0,  1,1,1,  1,0,1
    ]);

    Cube.uvs = new Float32Array([
      // Front
      0,0,  1,1,  1,0,
      0,0,  0,1,  1,1,

      // Back
      0,0,  1,0,  1,1,
      0,0,  1,1,  0,1,

      // Top
      0,0,  0,1,  1,1,
      0,0,  1,1,  1,0,

      // Bottom
      0,0,  1,0,  1,1,
      0,0,  1,1,  0,1,

      // Left
      0,0,  1,0,  1,1,
      0,0,  1,1,  0,1,

      // Right
      0,0,  0,1,  1,1,
      0,0,  1,1,  1,0
    ]);

    Cube.normals = new Float32Array([
      // Front z = 0
      0,0,-1,  0,0,-1,  0,0,-1,
      0,0,-1,  0,0,-1,  0,0,-1,

      // Back z = 1
      0,0,1,  0,0,1,  0,0,1,
      0,0,1,  0,0,1,  0,0,1,

      // Top y = 1
      0,1,0,  0,1,0,  0,1,0,
      0,1,0,  0,1,0,  0,1,0,

      // Bottom y = 0
      0,-1,0,  0,-1,0,  0,-1,0,
      0,-1,0,  0,-1,0,  0,-1,0,

      // Left x = 0
      -1,0,0,  -1,0,0,  -1,0,0,
      -1,0,0,  -1,0,0,  -1,0,0,

      // Right x = 1
      1,0,0,  1,0,0,  1,0,0,
      1,0,0,  1,0,0,  1,0,0
    ]);

    Cube.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, Cube.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Cube.vertices, gl.STATIC_DRAW);

    Cube.uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, Cube.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Cube.uvs, gl.STATIC_DRAW);

    Cube.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, Cube.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Cube.normals, gl.STATIC_DRAW);
  }

  render() {
    var rgba = this.color;

    gl.uniform1i(u_whichTexture, this.textureNum);
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    var normalMatrix = new Matrix4();
    normalMatrix.setInverseOf(this.matrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    gl.bindBuffer(gl.ARRAY_BUFFER, Cube.vertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.bindBuffer(gl.ARRAY_BUFFER, Cube.uvBuffer);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);

    gl.bindBuffer(gl.ARRAY_BUFFER, Cube.normalBuffer);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);

    gl.drawArrays(gl.TRIANGLES, 0, 36);
  }
}

Cube.initialized = false;