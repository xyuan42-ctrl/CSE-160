class Model {
  constructor(filePath) {
    this.filePath = filePath;

    this.color = [0.8, 0.8, 0.8, 1.0];
    this.matrix = new Matrix4();
    this.textureNum = -2; // solid color

    this.vertices = [];
    this.uvs = [];
    this.normals = [];

    this.vertexBuffer = null;
    this.uvBuffer = null;
    this.normalBuffer = null;

    this.ready = false;

    this.loadOBJ(filePath);
  }

  async loadOBJ(filePath) {
    try {
      const response = await fetch(filePath);

      if (!response.ok) {
        console.log("Failed to load OBJ:", filePath);
        return;
      }

      const text = await response.text();
      this.parseOBJ(text);
      this.initBuffers();

      this.ready = true;
      console.log("Loaded OBJ:", filePath);
    } catch (error) {
      console.log("Error loading OBJ:", error);
    }
  }

  parseOBJ(text) {
    const positions = [];
    const texcoords = [];
    const normals = [];

    const lines = text.split("\n");

    for (let line of lines) {
      line = line.trim();

      if (line.length === 0 || line.startsWith("#")) {
        continue;
      }

      const parts = line.split(/\s+/);
      const keyword = parts[0];

      if (keyword === "v") {
        positions.push([
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3])
        ]);
      } else if (keyword === "vt") {
        texcoords.push([
          parseFloat(parts[1]),
          parseFloat(parts[2])
        ]);
      } else if (keyword === "vn") {
        normals.push([
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3])
        ]);
      } else if (keyword === "f") {
        const faceVertices = parts.slice(1);

        // Triangulate faces using fan method:
        // f 1 2 3 4 becomes triangles: 1-2-3 and 1-3-4
        for (let i = 1; i < faceVertices.length - 1; i++) {
          const v1 = this.parseFaceVertex(faceVertices[0], positions, texcoords, normals);
          const v2 = this.parseFaceVertex(faceVertices[i], positions, texcoords, normals);
          const v3 = this.parseFaceVertex(faceVertices[i + 1], positions, texcoords, normals);

          let faceNormal = this.calculateFaceNormal(v1.position, v2.position, v3.position);

          this.pushOBJVertex(v1, faceNormal);
          this.pushOBJVertex(v2, faceNormal);
          this.pushOBJVertex(v3, faceNormal);
        }
      }
    }
  }

  parseFaceVertex(faceVertex, positions, texcoords, normals) {
    // OBJ face formats:
    // f v
    // f v/vt
    // f v//vn
    // f v/vt/vn

    const indices = faceVertex.split("/");

    const positionIndex = this.objIndexToArrayIndex(indices[0], positions.length);
    const texcoordIndex = indices[1] ? this.objIndexToArrayIndex(indices[1], texcoords.length) : null;
    const normalIndex = indices[2] ? this.objIndexToArrayIndex(indices[2], normals.length) : null;

    const position = positions[positionIndex];

    let uv = [0, 0];
    if (texcoordIndex !== null && texcoords[texcoordIndex]) {
      uv = texcoords[texcoordIndex];
    }

    let normal = null;
    if (normalIndex !== null && normals[normalIndex]) {
      normal = normals[normalIndex];
    }

    return {
      position: position,
      uv: uv,
      normal: normal
    };
  }

  objIndexToArrayIndex(indexString, arrayLength) {
    const index = parseInt(indexString);

    // OBJ indices start at 1.
    // Negative indices count backward from the end.
    if (index > 0) {
      return index - 1;
    } else {
      return arrayLength + index;
    }
  }

  pushOBJVertex(vertexData, faceNormal) {
    const p = vertexData.position;
    const uv = vertexData.uv;
    const n = vertexData.normal || faceNormal;

    this.vertices.push(p[0], p[1], p[2]);
    this.uvs.push(uv[0], uv[1]);
    this.normals.push(n[0], n[1], n[2]);
  }

  calculateFaceNormal(p1, p2, p3) {
    const ux = p2[0] - p1[0];
    const uy = p2[1] - p1[1];
    const uz = p2[2] - p1[2];

    const vx = p3[0] - p1[0];
    const vy = p3[1] - p1[1];
    const vz = p3[2] - p1[2];

    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;

    const length = Math.sqrt(nx * nx + ny * ny + nz * nz);

    if (length === 0) {
      return [0, 1, 0];
    }

    return [nx / length, ny / length, nz / length];
  }

  initBuffers() {
    this.vertexBuffer = gl.createBuffer();
    this.uvBuffer = gl.createBuffer();
    this.normalBuffer = gl.createBuffer();

    if (!this.vertexBuffer || !this.uvBuffer || !this.normalBuffer) {
      console.log("Failed to create OBJ buffers");
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.vertices),
      gl.STATIC_DRAW
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.uvs),
      gl.STATIC_DRAW
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.normals),
      gl.STATIC_DRAW
    );
  }

  render() {
    if (!this.ready) {
      return;
    }

    const rgba = this.color;

    gl.uniform1i(u_whichTexture, this.textureNum);
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    const normalMatrix = new Matrix4();
    normalMatrix.setInverseOf(this.matrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    // Position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    // UV buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);

    // Normal buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);

    const n = this.vertices.length / 3;
    gl.drawArrays(gl.TRIANGLES, 0, n);
  }
}