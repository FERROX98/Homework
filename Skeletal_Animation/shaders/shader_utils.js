//ok
function createShader(gl, type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

//ok
function createProgram(gl, vs_source, fs_source) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vs_source);
	const fs = createShader(gl, gl.FRAGMENT_SHADER, fs_source);

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(prog));
   return prog;
}

// ok
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

// ok
async function initShader(gl, vsPath, fsPath) {
  let vs = await initShaderProg(vsPath)
  let fs = await initShaderProg(fsPath)
  
  let program = createProgram(gl, vs, fs);
  gl.useProgram(program);

  return await program;
}

//ok
async function shaderPathExists(path) {
  try {
    const res = await fetch(path, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

//ok
async function resolveShaderPaths(name) {
  const basePath = `shaders/obj/${name}/`;
 
  const vsPath = basePath + 'vertex.glsl';
  const fsPath = basePath + 'fragment.glsl';
  
  const vsExists = await shaderPathExists(vsPath);
  const fsExists = await shaderPathExists(fsPath);
  
  const finalVS = vsExists ? vsPath : 'shaders/obj/default/vertex.glsl';
  const finalFS = fsExists ? fsPath : 'shaders/obj/default/fragment.glsl';

  console.log(`Using shaders: ${finalVS}, ${finalFS}`);

  return  { vs: finalVS, fs: finalFS };
}


export { initShaderProg , initShader, createProgram, resolveShaderPaths};