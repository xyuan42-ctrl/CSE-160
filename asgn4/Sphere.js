class Sphere {
  constructor(latBands = 24, lonBands = 24) {
    this.color = [1, 1, 1, 1];
    this.matrix = new Matrix4();

    // -2 = solid color
    //  0 = wall texture
    //  1 = grass texture
    //  2 = sky texture
    this.textureNum = -2;

    this.latBands = latBands;
    this.lonBands = lonBands;

    this.vertices = [];
    this.uvs = [];
    this.normals = [];

    this.vertexBuffer = null;
    this.uvBuffer = null;
    this.normalBuffer = null;

    this.generateSphere();
    this.initBuffers();
  }

  generateSphere() {
    for (let lat = 0; lat < this.latBands; lat++) {
      let theta1 = (lat * Math.PI) / this.latBands;
      let theta2 = ((lat + 1) * Math.PI) / this.latBands;

      for (let lon = 0; lon < this.lonBands; lon++) {
        let phi1 = (lon * 2 * Math.PI) / this.lonBands;
        let phi2 = ((lon + 1) * 2 * Math.PI) / this.lonBands;

        let p1 = this.getSpherePoint(theta1, phi1);
        let p2 = this.getSpherePoint(theta2, phi1);
        let p3 = this.getSpherePoint(theta2, phi2);
        let p4 = this.getSpherePoint(theta1, phi2);

        let uv1 = [lon / this.lonBands, lat / this.latBands];
        let uv2 = [lon / this.lonBands, (lat + 1) / this.latBands];
        let uv3 = [(lon + 1) / this.lonBands, (lat + 1) / this.latBands];
        let uv4 = [(lon + 1) / this.lonBands, lat / this.latBands];

        // Triangle 1: p1, p2, p3
        this.pushVertex(p1, uv1);
        this.pushVertex(p2, uv2);
        this.pushVertex(p3, uv3);

        // Triangle 2: p1, p3, p4
        this.pushVertex(p1, uv1);
        this.pushVertex(p3, uv3);
        this.pushVertex(p4, uv4);
      }
    }
  }

  getSpherePoint(theta, phi) {
    // Unit sphere centered at origin
    let x = Math.sin(theta) * Math.cos(phi);
    let y = Math.cos(theta);
    let z = Math.sin(theta) * Math.sin(phi);

    return [x, y, z];
  }

  pushVertex(position, uv) {
    let x = position[0];
    let y = position[1];
    let z = position[2];

    this.vertices.push(x, y, z);
    this.uvs.push(uv[0], uv[1]);

    // For a sphere centered at origin, normal = normalized position.
    // Since this is already a unit sphere, position is already normalized.
    this.normals.push(x, y, z);
  }

  initBuffers() {
    this.vertexBuffer = gl.createBuffer();
    this.uvBuffer = gl.createBuffer();
    this.normalBuffer = gl.createBuffer();

    if (!this.vertexBuffer || !this.uvBuffer || !this.normalBuffer) {
      console.log("Failed to create sphere buffers");
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
    let rgba = this.color;

    gl.uniform1i(u_whichTexture, this.textureNum);
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    // Normal matrix for lighting
    let normalMatrix = new Matrix4();
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

    let n = this.vertices.length / 3;
    gl.drawArrays(gl.TRIANGLES, 0, n);
  }
}