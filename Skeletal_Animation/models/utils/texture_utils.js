import { Model } from "../model.js";

// {name: folder}
export const TextureType = Object.freeze({
    mod1: { folder: 'mod1', name: 'Mod 1', unit: 0 },
    mod2: { folder: 'mod2', name: 'Mod 2', unit: 1 },
    mod3: { folder: 'mod3', name: 'Mod 3', unit: 2 },
});

export class TextureUtils {

    static async loadTextures(model, basePath, mode = TextureType.mod1) {
        const gl = model.gl;
        gl.useProgram(model.program);
        const modePath = basePath + `${mode.folder}/`;

        const [color, normal, rough, metal, ao, disp, emiss] = await Promise.all([
            TextureUtils.loadTextureImage(model, modePath + 'diff.jpg'),
            TextureUtils.loadTextureImage(model, modePath + 'nor.jpg'),
            TextureUtils.loadTextureImage(model, modePath + 'rough.jpg'),
            TextureUtils.loadTextureImage(model, modePath + 'met.jpg'),
            TextureUtils.loadTextureImage(model, modePath + 'ao.jpg'),
            TextureUtils.loadTextureImage(model, modePath + 'disp.jpg'),
            TextureUtils.loadTextureImage(model, modePath + 'emiss.jpg')
        ]);

        return {
            color: color,
            normal: normal,
            metal: metal,
            rough: rough,
            ao: ao,
            disp: disp,
            emiss: emiss
        };

    }

    static mockedTexture(model, url) {
        const gl = model.gl;
        gl.useProgram(model.program);
        const tex = gl.createTexture();

        let fallbackColor = [128, 128, 128];

        if (url.includes('nor')) {
            console.info(`[${model.name}] No normal texture ${url}`);
            fallbackColor = [128, 128, 255];
        } else if (url.includes('rough')) {
            console.info(`[${model.name}] No roughness texture ${url}`);
            fallbackColor = [128, 128, 128];
        } else if (url.includes('met')) {
            // 0 no metal 
            console.info(`[${model.name}] No metal texture ${url}`);
            fallbackColor = [0, 0, 0];
        } else if (url.includes('disp')) {
            // 0 disp
            console.info(`[${model.name}] No displacement texture ${url}`);
            fallbackColor = [0, 0, 0];
        } else if (url.includes('ao')) {
            // ao 1
            console.info(`[${model.name}] No ao texture ${url}`);
            fallbackColor = [255, 255, 255];
        } else if (url.includes('emiss')) {
            // emissive 0
            console.info(`[${model.name}] No emissive texture ${url}`);
            fallbackColor = [0, 0, 0];
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
        return tex;
    }

    static async loadTextureImage(model, url) {
        if (!model instanceof Model)
            throw new Error("model must be an instance of Model");

        const gl = model.gl;
        gl.useProgram(model.program);
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                // TODO check GL nor.jpg
                //if (url.includes('nor.jpg'))
                //  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                const tex = gl.createTexture();

                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                if (url.includes('disp')) {
                    console.info(`[${model.name}]  uniforma in tex`, model.uniforms);
                    model.enableParallaxMap(false);
                }

                resolve(tex);
            };

            img.onerror = (err) => {


                const tex = TextureUtils.mockedTexture(model, url);

                resolve(tex);
            };
            // firefox bug
            img.src = url + "?v=" + Date.now();
        });
    }

    static crossProduct(n, t) {
        if (n.length !== 3 || t.length !== 3) {
            return;
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

            return null;
        }
        let bitangent = null;

        // Compute bitangent using Cross product
        bitangent = new Float32Array(normal.length);
        for (let i = 0; i < normal.length; i += 3) {
            const n = [normal[i], normal[i + 1], normal[i + 2]];
            const t = [tangent[i], tangent[i + 1], tangent[i + 2]];

            let b = TextureUtils.crossProduct(n, t)

            const len = Math.sqrt(b[0] * b[0] + b[1] * b[1] + b[2] * b[2]);
            if (len > 0) {
                bitangent[i] = b[0] / len;
                bitangent[i + 1] = b[1] / len;
                bitangent[i + 2] = b[2] / len;
            }
        }
        return bitangent;
    }

    // shader selected 
    static bindTexture(model, textures = null, init = false) {
        const gl = model.gl;
        gl.useProgram(model.program);

        const tex = textures !== null ? textures : model.textures;

        const units = [
            { tex: tex.color, uniform: 'albedoMap', unit: 0 },
            { tex: tex.normal, uniform: 'normalTex', unit: 1 },
            { tex: tex.metal, uniform: 'metallicMap', unit: 2 },
            { tex: tex.rough, uniform: 'roughnessMap', unit: 3 },
            { tex: tex.disp, uniform: 'dispTex', unit: 4 },
            { tex: tex.ao, uniform: 'aoMap', unit: 5 },
            { tex: tex.emiss, uniform: 'emissiveMap', unit: 6 }
        ];

        for (const { tex, uniform, unit } of units) {
            const uniformLoc = gl.getUniformLocation(model.program, uniform);

            if (uniformLoc !== null && tex) {
                // activate texture unit read port
                gl.activeTexture(gl.TEXTURE0 + unit);
                // select wich texture
                gl.bindTexture(gl.TEXTURE_2D, tex);
                // set 
                if (init) {
                    gl.uniform1i(uniformLoc, unit);
                }
            } else if (init) {
                console.warn(`[${model.name}] Texture ${uniform} skipped`, tex, uniformLoc);
            }
        }
    }


    static async getTexturesFromGltf(model, json, matIdx = 0) {

        const mat = json.materials[matIdx] || {};
        const pbr = mat.pbrMetallicRoughness || {};

        const getTex = async (texInfo) => {
            const tex = json.textures[texInfo.index];
            const img = json.images[tex.source];
            try {
                const textureMode = model.textureMode || TextureType.mod1;
                const uri = `models/assets/textures/${model.name}/${textureMode.folder}/` + img.uri;
                const texture = await TextureUtils.loadTextureImage(model, uri);
                return texture;
            } catch (error) {
                console.error(`[${model.name}] Error GLTF texture:`, img, error);
                return await TextureUtils.mockedTexture(model, img.uri);
            }
        };
        const textures = {
            color: pbr.baseColorTexture ? await getTex(pbr.baseColorTexture) : null,
            normal: mat.normalTexture ? await getTex(mat.normalTexture) : null,
            metal: pbr.metallicRoughnessTexture ? await getTex(pbr.metallicRoughnessTexture) : TextureUtils.mockedTexture(model, 'met'),
            rough: pbr.metallicRoughnessTexture ? await getTex(pbr.metallicRoughnessTexture) : TextureUtils.mockedTexture(model, 'rough'),
            ao: mat.occlusionTexture ? await getTex(mat.occlusionTexture) : null,
            disp: mat.displacementTexture ? await getTex(mat.displacementTexture) : null
        };

        return textures;
    }


    static unbindTexture(model) {
        const gl = model.gl;
        // gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS)

        // clean the current mode before the next 
        // TODO create a cache in order to active the specific units
        for (let i = 0; i < 6; i++) {

            gl.activeTexture(gl.TEXTURE0 + i);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }

    }

}