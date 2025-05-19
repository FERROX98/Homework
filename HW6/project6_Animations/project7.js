

// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
{
	// [TO-DO] Modify the code below to form the transformation matrix.
	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];

	// Rotation x
	let rotationXMatrix = Array( 1, 0, 0, 0, 
								0, Math.cos(rotationX), Math.sin(rotationX), 0,
								0, -Math.sin(rotationX), Math.cos(rotationX), 0,
								0, 0, 0, 1); 
	// Rotation Y
	let rotationYMatrix = Array( Math.cos(rotationY), 0, -Math.sin(rotationY), 0,
								0, 1, 0, 0,
								Math.sin(rotationY), 0, Math.cos(rotationY), 0,
								0, 0, 0, 1); 


	let rotatedMatrix = MatrixMult(rotationYMatrix, rotationXMatrix); 

	let intermediateMatrix = MatrixMult(trans, rotatedMatrix);
 
	return intermediateMatrix;
}
 

async function InitShaderProg()
{
	// Helper function to load shader files
    async function loadShaderFile(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
            return await response.text();
        } catch (error) {
            console.error('Error loading shader:', error);
            return null;
        }
    }

    // Load shader sources
    const vs_source = await loadShaderFile("shaders/vertex.glsl");
	console.log("Founded vertex shader source code");

    const fs_source = await loadShaderFile("shaders/fragment.glsl");
	console.log("Founded fragment shader source code");

    if (!vs_source || !fs_source) return null;

	const vs = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vs, vs_source);
	gl.compileShader(vs);

	if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
		console.error('Error compiling vertex shader:', gl.getShaderInfoLog(vs));
		gl.deleteShader(vs);
		return null;
	}
	
	const fs = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fs, fs_source);
	gl.compileShader(fs);

	if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
		console.error('Error compiling fragment shader:', gl.getShaderInfoLog(fs));
		gl.deleteShader(fs);
		return null;
		
	}

	const prog = gl.createProgram();
	gl.attachShader(prog, vs);
	gl.attachShader(prog, fs);
	gl.linkProgram(prog);

	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
		console.error('Error linking shader program:', gl.getProgramInfoLog(prog));
		return null;
	}
	console.log("Shader program linked successfully");
	return prog;
}
// [TO-DO] Complete the implementation of the following class.

class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		this.initialize().then(() => {
			console.log("Shader program initialized");
			// buffer 
			this.positionBuffer = gl.createBuffer();
			this.textCoordBuffer = gl.createBuffer();
			this.normalBuffer = gl.createBuffer();

			// vertex
			this.pos = gl.getAttribLocation(this.prog, 'pos');
			this.matrixMVP = gl.getUniformLocation(this.prog, 'matrixMVP');
			this.textureCoords = gl.getAttribLocation(this.prog, 'textureCoords');
			this.flgSwap = gl.getUniformLocation(this.prog, 'flgSwap');
			// vertex normal
			this.normal = gl.getAttribLocation(this.prog, 'normal');
			this.matrixMV = gl.getUniformLocation(this.prog, 'matrixMV');
			this.invTranspMV = gl.getUniformLocation(this.prog, 'invTranspMV');

			// fragment 
			this.flgShowTexture = gl.getUniformLocation(this.prog, 'flgShowTexture');
			this.textureSampler = gl.getUniformLocation(this.prog, 'textureSampler');
			this.lightDirection = gl.getUniformLocation(this.prog, 'lightDirection');
			this.shininess = gl.getUniformLocation(this.prog, 'shininess');

			// fragment normal
			//this.normal = gl.getAttribLocation(this.prog, 'normal');


			// init some uniforms
			gl.useProgram(this.prog);
			gl.uniform1i(this.flgShowTexture, true);
			gl.uniform1i(this.flgSwap, false);
			gl.uniform1f(this.shininess, 10); 
			gl.uniform3f(this.lightDirection, 0.0,0.0,-1.0);


		});
 
	}
	
	async initialize() {
        try {
            this.prog = await InitShaderProg();
            if (!this.prog) {
                throw new Error("Shader program failed to initialize");
            }
            console.log("Shader program ready");
        } catch (error) {
            console.error("Initialization error:", error);
        }
	}

	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three ocnsecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords, normals )
	{
		// Set all data and send to gpu 
		// Bind and send to gpu 
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.textCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

		this.numTriangles = vertPos.length /3;
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		gl.useProgram(this.prog);
		gl.uniform1i(this.flgSwap, swap); 
	}

	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		if (!this.prog) {
			console.warn("Shader program not initialized!"); 
			return;
		}


		gl.clear(gl.COLOR_BUFFER_BIT );
		gl.useProgram( this.prog ); 
		
		
		// Since it is constant across all vertices is not necessary to bind
		gl.uniformMatrix4fv(this.matrixMVP, false, matrixMVP)
		gl.uniformMatrix4fv(this.matrixMV, false, matrixMV)
		gl.uniformMatrix3fv(this.invTranspMV, false, matrixNormal)

		//bind (select which buffer to use/interpret)
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
		gl.vertexAttribPointer(this.pos, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.pos);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.textCoordBuffer);
		gl.vertexAttribPointer(this.textureCoords, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.textureCoords);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.vertexAttribPointer(this.normal, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.normal);


		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles ); 
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		gl.useProgram(this.prog);

		// [TO-DO] Bind the texture
		const texture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0); 
		gl.bindTexture(gl.TEXTURE_2D, texture);


		// You can set the texture image data using the following command.
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img );
		gl.generateMipmap(gl.TEXTURE_2D);		
		
		
		// [TO-DO] Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.

		gl.uniform1i(this.textureSampler, 0); 
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify if it should use the texture.

		gl.useProgram(this.prog);
		gl.uniform1i(this.flgShowTexture, show); 
	}
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the light direction.
		gl.useProgram(this.prog);
		gl.uniform3f(this.lightDirection, x, y, z);
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the shininess.
		gl.useProgram(this.prog);
		gl.uniform1f(this.shininess, shininess);
	}
}



// This function is called for every step of the simulation.
// Its job is to advance the simulation for the given time step duration dt.
// It updates the given positions and velocities.
function SimTimeStep( dt, positions, velocities, springs, stiffness, damping, particleMass, gravity, restitution )
{
	var forces = Array( positions.length ); // The total for per particle

	let gravityForce = gravity.mul(particleMass);
	debug = false;
 
	// [TO-DO] Compute the total force of each particle
	for (let i = 0; i<springs.length; i++){
		
		let p0 = springs[i].p0; 
		let p1 = springs[i].p1;

		if (forces[p0] == null){
			forces[p0] = new Vec3(0, 0, 0);
		}
		if (forces[p1] == null){
			forces[p1] = new Vec3(0, 0, 0); 
		}

		// Spring force
		let restLength = springs[i].rest; 
		let delta = positions[p1].sub(positions[p0]); 
		let springLength = delta.len();  
		let springDirection = (delta).div(springLength); 
		let springForce = springDirection.mul(stiffness * ( springLength - restLength));
		
		if (debug)
			console.log("springForce", springForce);

		// Spring dampling force
		let speedChangeLength = (velocities[p1].sub(velocities[p0])).dot(springDirection);
		let dampingForce = springDirection.mul(speedChangeLength).mul(damping);  
		
		if (debug)
			console.log("dampingForce", dampingForce);

		let totalForce = springForce.add(dampingForce); 
		if (debug)
			console.log("totalForce", totalForce);

		forces[p0].inc(totalForce); 
		forces[p1].dec(totalForce);  
		
	}
	
	// [TO-DO] Update positions and velocities
	let acceleration = Array( positions.length ); // The total for per particle
	
	for (let i = 0; i<positions.length; i++){
 
		if (acceleration[i] == null){
			acceleration[i] = new Vec3(0, 0, 0);
		}
		// calculate acceleration  
		acceleration[i].inc((forces[i].add(gravityForce)).div(particleMass));

		// calculate velocity 
		velocities[i].inc(acceleration[i].mul(dt));

		// calculate position
		positions[i].inc(velocities[i].mul(dt));

		// [TO-DO] Handle collisions
		if ((positions[i].x**2)>1) {
			collisionHandler(positions, velocities, i, restitution, "x");
		}

		if ((positions[i].y**2)>1) {
			collisionHandler(positions, velocities, i, restitution, "y");
		}
 
		if ((positions[i].z**2)>1) {
			collisionHandler(positions, velocities, i, restitution, "z");
		}

	}

}

function collisionHandler(positions, velocities, i, restitution,axis){

			let h; 
			let v; 
			let position; 
			let velocity;
		
			if (axis == "x"){
				h = (Math.abs(positions[i].x) - 1); 
				v = (velocities[i].x);
				position = positions[i].x;
				velocity = velocities[i].x;
			} else if (axis == "y"){
				h = (Math.abs(positions[i].y) - 1); 
				v = (velocities[i].y);
				position = positions[i].y;
				velocity = velocities[i].y;
			} else if (axis == "z"){
				h = (Math.abs(positions[i].z) - 1); 
				v = (velocities[i].z); 
				position = positions[i].z;
				velocity = velocities[i].z;
			} else {
				console.log("Error: axis not defined")
			} 

			let h_upd = restitution * h; 
			let v_upd = restitution * v * -1;
			velocity = v_upd;

			if (position< 0){
				// allign the position
				position += h; 
				// sum the bounce
				position += h_upd;
			} else {
				// allign the position
				position -= h;
				// sum the bounce
				position -= h_upd;
			}

			if (axis == "x"){
				positions[i].x = position;
				velocities[i].x = velocity;
			} else if (axis == "y"){
				positions[i].y = position;
				velocities[i].y = velocity;
			} else if (axis == "z"){
				positions[i].z = position;
				velocities[i].z = velocity;
			} 
			
		
}

