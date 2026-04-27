class Cylinder {
  constructor() {
    this.color = [1, 1, 1, 1];
    this.matrix = new Matrix4();
    this.segments = 24;
  }

  render() {
    var rgba = this.color;

    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    var angleStep = 360 / this.segments;

    for (var angle = 0; angle < 360; angle += angleStep) {
      var angle1 = angle * Math.PI / 180;
      var angle2 = (angle + angleStep) * Math.PI / 180;

      var x1 = Math.cos(angle1) * 0.5;
      var z1 = Math.sin(angle1) * 0.5;
      var x2 = Math.cos(angle2) * 0.5;
      var z2 = Math.sin(angle2) * 0.5;

      // Front cap
      drawTriangle3D([
        0, 0, 0,
        x1, z1, 0,
        x2, z2, 0
      ]);

      // Back cap
      drawTriangle3D([
        0, 0, 1,
        x2, z2, 1,
        x1, z1, 1
      ]);

      // Side face triangle 1
      drawTriangle3D([
        x1, z1, 0,
        x1, z1, 1,
        x2, z2, 1
      ]);

      // Side face triangle 2
      drawTriangle3D([
        x1, z1, 0,
        x2, z2, 1,
        x2, z2, 0
      ]);
    }
  }
}