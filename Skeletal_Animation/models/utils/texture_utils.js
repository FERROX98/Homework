import { Model } from "../model.js";

const debug = false;

export class TextureUtils {

    static async loadTextureImage(model, url) {
        if (!model instanceof Model)
            throw new Error("model must be an instance of Model");
        
        if (!model.fallbackTextures) {
            this.createFallbackTextures(model);
        }

        return new Promise((resolve, reject) => {
            const gl = model.gl;
            gl.useProgram(model.program);
            const tex = gl.createTexture();
            const img = new Image();
                        
            img.onload = () => {
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
                if (debug) console.log(`[${model.name}] Successfully loaded texture: ${url}`);
                resolve(tex);
            };

            img.onerror = (err) => {
                console.error(`[${model.name}] Error loading texture: ${url}`, err);
                console.error(`[${model.name}] Image error details:`, {
                    src: img.src,
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight,
                    complete: img.complete
                });
                gl.deleteTexture(tex);
                reject(new Error(`Failed to load texture: ${url}`));
            };
             
            if (debug) console.log(`[${model.name}] Setting img.src to: ${url}`);
            img.src = url;
        }
        );
    }

    static createFallbackTextures(model) {
        const gl = model.gl;
        gl.useProgram(model.program);
        const make1x1 = (r, g, b, a = 255) => {
            const tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                        new Uint8Array([r, g, b, a]));
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            return tex;
        };
        
        model.fallbackTextures = {
            color: make1x1(0, 0, 0),
            normal: make1x1(0, 0, 0),
            metalRough: make1x1(0, 0, 0),
            emission: make1x1(0,0, 0),
        };
    }

    static setTexture(model, textures, init=false) {
        const gl = model.gl;
        gl.useProgram(model.program);

        const units = [
            { tex: textures.color, fallback: model.fallbackTextures.color, uniform: 'colorTex', unit: 0 },
            { tex: textures.metalRough, fallback: model.fallbackTextures.metalRough, uniform: 'metalRoughTex', unit: 1 },
            { tex: textures.emission, fallback: model.fallbackTextures.emission, uniform: 'emissionTex', unit: 2 },
            { tex: textures.normal, fallback: model.fallbackTextures.normal, uniform: 'normalTex', unit: 3 },
        ];
        
        for (const {tex, fallback, uniform, unit} of units) {
            const uniformLoc = gl.getUniformLocation(model.program, uniform);
            if (uniformLoc !== null && (tex || fallback)) {
                gl.activeTexture(gl.TEXTURE0 + unit);
                gl.bindTexture(gl.TEXTURE_2D, tex || fallback);
                if (init)
                     gl.uniform1i(uniformLoc, unit);

            } 
        }
        model.toggleTextures(true);
    }

}
