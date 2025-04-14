
// Ensure your build system supports importing GLSL files if needed.


// This function takes the projection matrix, the translation, and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// The given projection matrix is also a 4x4 matrix stored as an array in column-major order.
// You can use the MatrixMult function defined in project4.html to multiply two 4x4 matrices in the same format.
// Ensure that the MatrixMult function is properly defined or imported before using it.
function GetModelViewProjection( projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY )
{
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
 
	let mvp = MatrixMult(projectionMatrix, intermediateMatrix);

	return mvp;
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
		//this.mvpMatrix = mvp; 
		//InitShaderProg().then(prog => this.prog = prog);
		this.initialize().then(() => {
			console.log("Shader program initialized");
			// buffer 
			this.position_buffer = gl.createBuffer();
			this.text_coord_buffer = gl.createBuffer();

			// vertex
			this.pos = gl.getAttribLocation(this.prog, 'pos');
			this.trans = gl.getUniformLocation(this.prog, 'trans');
			this.textureCoords = gl.getAttribLocation(this.prog, 'textureCoords');
			this.flgSwap = gl.getUniformLocation(this.prog, 'flgSwap');

			// fragment 
			this.flgShowTexture = gl.getUniformLocation(this.prog, 'flgShowTexture');
			this.textureSampler = gl.getUniformLocation(this.prog, 'textureSampler');

			// init some uniforms
			gl.useProgram(this.prog);
			gl.uniform1i(this.flgShowTexture, true);
			gl.uniform1i(this.flgSwap, false);

		});
 
	

	//	gl.bindBuffer(gl.ARRAY_BUFFER, this.color_buffer);

		//this.mvp = gl.getUniformLocation(this.prog, "mvp");

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
	// The arguments of this function is an array of 3D vertex positions
	// and an array of 2D texture coordinates.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords )
	{
	 
		// Set all data and send to gpu 

		// Bind and send to gpu 
		gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.text_coord_buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		this.numTriangles = vertPos.length /3;
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		console.log("swap", swap);

		gl.useProgram(this.prog);
		gl.uniform1i(this.flgSwap, swap); 	}
	
	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw( trans )
	{

		if (!this.prog) {
			console.warn("Shader program not initialized!"); 
			return;
		}

		console.log("Drawing mesh");

		gl.clear(gl.COLOR_BUFFER_BIT );
		gl.useProgram( this.prog ); 

		
		// Since it is constant across all vertices is not necessary to bind
		gl.uniformMatrix4fv( this.trans, false, trans)

		//bind (select which buffer to use/interpret)
		gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
		// Say for each tuple of 3 element store in pos and run in parallel vertex shader main()
		gl.vertexAttribPointer(this.pos, 3, gl.FLOAT, false, 0, 0);
		// say pull data from buffer how indicated above
		gl.enableVertexAttribArray(this.pos);


		gl.bindBuffer(gl.ARRAY_BUFFER, this.text_coord_buffer);
		gl.vertexAttribPointer(this.textureCoords, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.textureCoords);


		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles ); 
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{

		gl.useProgram(this.prog);

		// [TO-DO] Bind the texture
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		// You can set the texture image data using the following command.
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img );
		gl.generateMipmap(gl.TEXTURE_2D);		

		// [TO-DO] Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.
		gl.activeTexture(gl.TEXTURE0); 

		gl.uniform1i(this.textureSampler, 0); 
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		console.log("Show texture", show);

		gl.useProgram(this.prog);
		gl.uniform1i(this.flgShowTexture, show); 
	}
	
}