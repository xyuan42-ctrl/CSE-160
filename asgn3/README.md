# Assignment 3: Creating a Virtual World

## asgn3.html
Main webpage that contains the WebGL canvas, project title, FPS display, control instructions, and loads all required project scripts.

## asgn3.js
Main JavaScript file that controls the Assignment 3 virtual world. It handles WebGL setup, shader setup, texture loading, camera movement, mouse rotation, rendering, the 32x32 world map, add/delete block controls, FPS updates, and the simple “find the lost pig” game goal.

## Cube.js
Defines the Cube class used to render the ground, sky box, walls, and cube-based parts of the pig. This file also supports UV texture coordinates so cubes can use wall, grass, and sky textures.

## Cylinder.js
Defines the Cylinder class used to render the pig’s round snout as a non-cube primitive.

## Triangle.js
Contains helper functions used to draw 3D triangles. These triangle functions are the base for rendering cube faces and other 3D objects.

## Camera.js
Extra camera file included in the project folder. The main camera class is currently written directly inside `asgn3.js`, so this file is not required unless the camera code is separated later.

## lib/cuon-matrix.js
Matrix and vector math library used for WebGL transformations, including model, view, projection, translation, rotation, and scaling matrices.

## lib/cuon-utils.js
Utility file used to initialize WebGL shaders and connect shader programs.

## lib/webgl-debug.js
WebGL debugging helper library. It is included in the project folder for debugging support.

## textures/grass.jpg
Texture image used for the ground/terrain surface.

## textures/sky.jpg
Texture image used for the large sky cube surrounding the world.

## textures/wall.png
Texture image used for the cube walls in the 32x32 virtual world.

## README.md
This file. It explains the purpose of each major file in the project.

# Controls

## Movement
- `W` moves the camera forward.
- `S` moves the camera backward.
- `A` moves the camera left.
- `D` moves the camera right.

## Rotation
- `Q` turns the camera left.
- `E` turns the camera right.
- Mouse drag rotates the camera.

## Block Editing
- `F` deletes a block in front of the camera.
- `G` adds a block in front of the camera.

## Extra Interaction
- `P` toggles the pig animation.
- Shift-click triggers the pig poke animation.