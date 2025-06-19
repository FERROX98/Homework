import { Model } from "../model.js";

const debug = false;

export class TextureUtils {

    // no shader selection
    static async loadTextureImage(model, url) {
        if (!model instanceof Model)
            throw new Error("model must be an instance of Model");
        const gl = model.gl;
        return new Promise((resolve, reject) => {
            const tex = gl.createTexture();
            const img = new Image();

            img.onload = () => {
                // TODO check GL nor.jpg
                //if (url.includes('nor.jpg'))
                  //  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                if (debug) console.log(`[${model.name}] Successfully loaded texture: ${url}`);
                resolve(tex);
            };

            img.onerror = (err) => {
                console.warn(`[${model.name}] Error loading texture: ${url}`, err);
                
                let fallbackColor = [128, 128, 128];
                
                if (url.includes('nor')) {
                    fallbackColor = [128, 128, 255];
                } else if (url.includes('rough')) {
                    fallbackColor = [128, 128, 128];
                } else if (url.includes('met')) {
                    // 0 no metal 
                    fallbackColor = [0, 0, 0];
                } else if (url.includes('disp')) {
                    // 0 disp
                    fallbackColor = [0, 0, 0];
                } else if (url.includes('ao')) {
                    // ao 1
                    fallbackColor = [255, 255, 255]; 
                }
                
                // 1x1 pixel
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE,
                                new Uint8Array(fallbackColor));
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                
                resolve(tex);
            };
            // firefox bug
            img.src = url+ "?v=" + Date.now();
        });
    }

    static crossProduct(n, t) {
        if (n.length !== 3 || t.length !== 3) {
            console.error("Both n and t must be arrays of length 3");
        }
        let b = [];
        for (let j = 0; j < 3; j++) {
            const j1 = (j + 1) % 3;
            const j2 = (j + 2) % 3;
            b[j] = n[j1] * t[j2] - n[j2] * t[j1];
        }
        return b;
    }

    static computeBitangent(model, normal, tangent) {
        
        if (!tangent || tangent.length === 0) {
            console.warn(`[${model.name}] No tangent data found for primitive`);
            return null;
        }
        let bitangent = null;
        
        // Compute bitangent using Cross product
        bitangent = new Float32Array(normal.length);
        for (let i = 0; i < normal.length; i += 3) {
            const n = [normal[i], normal[i+1], normal[i+2]];
            const t = [tangent[i], tangent[i+1], tangent[i+2]];
            
            let b = TextureUtils.crossProduct(n, t) 
            
            const len = Math.sqrt(b[0]*b[0] + b[1]*b[1] + b[2]*b[2]);
            if (len > 0) {
                bitangent[i] = b[0] / len;
                bitangent[i+1] = b[1] / len;
                bitangent[i+2] = b[2] / len;
            }
        }
        return bitangent;
    }

    // shader selected (if init)
    static bindTexture(model, textures = null,  init = false) {
        const gl = model.gl;
        const tex = model.textures || textures || {};
        const units = [
            { tex: tex.color, uniform: 'albedoMap', unit: 0},
            { tex: tex.normal, uniform: 'normalTex', unit: 1},
            { tex: tex.metal, uniform: 'metallicMap', unit: 2},
            { tex: tex.rough, uniform: 'roughnessMap', unit: 3},
            { tex: tex.disp, uniform: 'dispTex', unit: 4},
            { tex: tex.ao, uniform: 'aoMap', unit: 5},
        ];

        for (const { tex, uniform, unit } of units) {
            const uniformLoc = gl.getUniformLocation(model.program, uniform);

            if (uniformLoc !== null && tex) {
                // activate 
                gl.activeTexture(gl.TEXTURE0 + unit);
                // select 
                gl.bindTexture(gl.TEXTURE_2D, tex);
                // set 
                if (init){
                    gl.useProgram(model.program);
                    gl.uniform1i(uniformLoc, unit);
                }
            }
        }
    }

}