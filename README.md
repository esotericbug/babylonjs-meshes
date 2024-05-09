To run the project you need node.js 

- npm i
- npm run dev

or for a production build run => npm run build & run the index.html in dist folder

##Problem Solving Approach

- Firstly I created some helper components and hooks to help me render a scene.
- Added a WebGL compatibilty checker component to check if device supports.
- Then I created multiple mesh geometries and overlapped them.
- After I imported a .obj file and added the mesh to the scene.
- After that I created a helper function to return the mesh upon hovering the scene which returns mesh objects if finds any.
- After that I created a vertex shader and fragment shader to highlight the selected object and loaded into the script. I was not able to create the desired behaviour as written in the assignment as it only highlights the meshes and not outlines them.

- I had added a Color picker but removed it since it didn't make sense as I was not able to achieve outline and variable outline width around an object.