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

// TODO remove
async function loadTextures(gl, name, json) {
 const basePath = `models/assets/textures/${name}/`;
 console.log(`[${this.name}] texture load: ${basePath}`);
 
  let textures = {
    color: null,
    normal: null,
    metalRough: null,
    emission: null,
  };

  const tryLoadTexture = async (texInfo, target) => {
    try {
      const tex = json.textures[texInfo.index];
      const img = json.images[tex.source];
      const uri = basePath + img.uri;
      console.log(`[${this.name}] Loading ${target} texture from: ${uri}`);
      textures[target] = await loadTextureImage(gl, uri);
    } catch (err) { 
      console.warn(`[${this.name}] Failed to load ${target} texture:`, err);
    }
  };

  if (json.materials && json.materials.length > 0) {
    for (const mat of json.materials) {
      const pbr = mat.pbrMetallicRoughness || {};
      
      if (!textures.color && pbr.baseColorTexture)
        await tryLoadTexture(pbr.baseColorTexture, 'color');

      if (!textures.normal && mat.normalTexture)
        await tryLoadTexture(mat.normalTexture, 'normal');

      if (!textures.metalRough && pbr.metallicRoughnessTexture)
        await tryLoadTexture(pbr.metallicRoughnessTexture, 'metalRough');

      if (!textures.emission && mat.emissiveTexture)
        await tryLoadTexture(mat.emissiveTexture, 'emission');

      if (textures.color && textures.normal &&
          textures.metalRough && textures.emission) {
        break;
      }
    }
  }

  if (!textures.color) {
    console.warn(`No color texture found for ${name}, using default color.`);
    const defaultColor = new Uint8Array([200, 200, 200, 255]); // Light gray
    textures.color = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textures.color);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0,
      gl.RGBA, gl.UNSIGNED_BYTE, defaultColor
    );
  }

  return textures;
}

// TODO remove
async function loadTextureImage(gl, url) {
    return new Promise((resolve, reject) => {
      const tex = gl.createTexture();
      const img = new Image();
      img.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
        resolve(tex);
      };
      img.onerror = () => reject(new Error(`Failed to load texture: ${url}`));
      img.src = url;
    });
  }


export { initShaderProg , initShader, createProgram, resolveShaderPaths};