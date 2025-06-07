
function createShader(gl, type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

function createProgram(gl, vs_source, fs_source) {
  // console.log("vs_source:", vs_source);
  // console.log("fs_source:", fs_source);
  const vs = createShader(gl, gl.VERTEX_SHADER, vs_source);
	const fs = createShader(gl, gl.FRAGMENT_SHADER, fs_source);

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(prog));
	//console.log("Shader program linked successfully", prog);
  return prog;
}

function initBuffers() {
  vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  function bindAttrib(data, loc, size, type, int = false) {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc);
    if (int)
      gl.vertexAttribIPointer(loc, size, type, 0, 0);
    else
      gl.vertexAttribPointer(loc, size, type, false, 0, 0);
  }

  bindAttrib(
      buffers.position, gl.getAttribLocation(program, 'position'), 3, gl.FLOAT);
  bindAttrib(
      buffers.normal, gl.getAttribLocation(program, 'normal'), 3, gl.FLOAT);
  bindAttrib(
      buffers.texcoord, gl.getAttribLocation(program, 'texcoord'), 2, gl.FLOAT);
  bindAttrib(
      buffers.weights, gl.getAttribLocation(program, 'weights'), 4, gl.FLOAT);
  bindAttrib(
      buffers.joints, gl.getAttribLocation(program, 'joints'), 4,
      gl.UNSIGNED_BYTE, true);

  indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, buffers.indices, gl.STATIC_DRAW);

  gl.bindVertexArray(null);
}

async function initShaderProg(path) {
  async function loadShaderFile(url) {
    try {
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`Failed to load ${url}: ${response.status}`);
      return await response.text();
    } catch (error) {
      console.error('Error loading shader:', error);
      return null;
    }
  }
  let source = await loadShaderFile(path);   
  return await source;
}



async function initShader(gl, vsPath, fsPath) {
  let vs = await initShaderProg(vsPath)
  let fs = await initShaderProg(fsPath)
  //console.log('Shaders initialized:', vs, fs);
    
  let program = createProgram(gl, vs, fs);
  gl.useProgram(program);

  return await program;
}


export { initShaderProg , initShader, createProgram };