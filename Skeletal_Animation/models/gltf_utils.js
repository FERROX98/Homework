import { TextureUtils } from "./texture_utils.js";
import { Model } from "./model.js";
import { AnimationUtils } from "./animation_utils.js";
import { mat4 } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js";


const debug = false;  

export class GLTFUtils {

    // ok
    static async loadGLTF(model, url) {
        if (!model instanceof Model)
            throw new Error("model must be an instance of Model");
        
        if (debug) console.log(`[${model.name}] Starting GLTF load from: ${url}`);
        
        // load the gltf file
        const res = await fetch(url);
        const json = await res.json();
        model.json = json;

        // load the bin file 
        const basePathBin = url.split('/').slice(0, -1).join('/') + '/';
        const bin = await fetch(basePathBin + json.buffers[0].uri)
            .then((r) => r.arrayBuffer());
        model.bin = bin;

        // accessors indicate the type of data stored in the bin file 
        // and which bufferView they refer for each primitive
        model.accessors = json.accessors;;
        model.bufferViews = json.bufferViews;

        // joint objects in the scene 
        const allPrimitives =
            json.meshes.flatMap((mesh) => mesh.primitives);
        // console.log(`[${model.name}] allPrimitives length: ${allPrimitives.length}`);

        // Set animation data
        model.animations = json.animations || [];

        if (debug) console.log(`[${model.name}] Animations found: ${model.animated}`);
        
        if (model.animated)
            AnimationUtils.configureAnimationData(model, json, bin);

        // Skeletal
        this.getSkinData(model);

        await this.getPrimitivesData(allPrimitives,model);

    }

    //ok
    static getTypeFromAccessor(accessor) {
        switch (accessor.componentType) {
            case 5120:
                return Int8Array;
            case 5121:
                return Uint8Array;
            case 5122:
                return Int16Array;
            case 5123:
                return Uint16Array;
            case 5125:
                return Uint32Array;
            case 5126:
                return Float32Array;
            default:
                throw new Error(`Unsupported componentType ${accessor.componentType}`);
        }
    }

    // ok
    static getNumComponentsFromAccessor(accessor) {
        return {
            SCALAR: 1,
            VEC2: 2,
            VEC3: 3,
            VEC4: 4,
            MAT4: 16,
        } [accessor.type];
    }

    // ok
    static readArrayFromAccessor(accessor, model) {
        const bufferViews = model.bufferViews;
        const bin = model.bin;

        //  tells which bufferView contains the data in the bin file
        const bufferViewsIndex = accessor.bufferView;
        if (bufferViewsIndex === undefined) {
            throw new Error(`[${accessor.name}] Accessor  does not have a bufferView`);
        }

        // Get the bufferView from the bufferViews array
        const bufferView = bufferViews[bufferViewsIndex];
        const offset = (bufferView.byteOffset || 0);

        // tells how many elements to be read from the bin file
        const count = accessor.count;
        let arrayType = this.getTypeFromAccessor(accessor);
       
        // Get the number of components of the array
        const numComponents = this.getNumComponentsFromAccessor(accessor);
        const totalLength = count * numComponents;
        
        // Debug for laboratory model
        // if (model.name === 'laboratory' && count > 1000) {
        //     console.log(`[${model.name}] Large accessor: ${count} elements, type: ${arrayType.name}, components: ${numComponents}`);
        // }
        
        return new arrayType(bin, offset, totalLength);
    }

    // ok
    static getSkinData(model) {
        const accessors = model.accessors;
        const json = model.json;

        const skin = json.skins ? json.skins[0] : null;
        if (skin) {
            console.log(`[${model.name}] skin found:`, skin);

            // skin.inverseBindMatrices tell us where (in the bin file) to find the inverse bind 
            const ibmAccessor = accessors[skin.inverseBindMatrices];

            // retrieve the array of all inverse bind matrices (one for each joint)
            const ibmArray = this.readArrayFromAccessor(ibmAccessor, model);
            console.log(`[${model.name}] inverseBindMatrices count:`, ibmAccessor.count);
            for (let i = 0; i < ibmAccessor.count; i++) {
                // 4x4 matrix for each joint
                const matrixData = ibmArray.slice(i * 16, (i + 1) * 16);
                const matrix = mat4.fromValues(
                    matrixData[0], matrixData[1], matrixData[2], matrixData[3],
                    matrixData[4], matrixData[5], matrixData[6], matrixData[7],
                    matrixData[8], matrixData[9], matrixData[10], matrixData[11],
                    matrixData[12], matrixData[13], matrixData[14], matrixData[15]
                );
                model.inverseBindMatrices.push(matrix);
            }

            // Bones 
            model.jointNodes = skin.joints;
            // matrices for each joint
            model.jointMatrices = model.jointNodes.map(() => mat4.create());
        }
    }

    // ok
    static getDataFromPrimitive(attr, model, primitive) {
        const bufferViews = model.bufferViews;
        const accessors = model.accessors;
        const bin = model.bin;

        if (primitive.attributes[attr] === undefined)
            return null;
        
        const acc = accessors[primitive.attributes[attr]];
        const view = bufferViews[acc.bufferView];
        const offset = (view.byteOffset || 0);
        const numComponents = this.getNumComponentsFromAccessor(acc);
        let arrayType = this.getTypeFromAccessor(acc);

        return new arrayType(bin, offset, acc.count * numComponents);
    }
    
    // ok
    static async getPrimitivesData(allPrimitives, model) {
        const bufferViews = model.bufferViews;
        const accessors = model.accessors;
        const json = model.json;
        const bin = model.bin;
        let primitivesCount = 1;
        
        // joint all scene 
        // for all obj retrieve vertex and data (triangle) and store in the buffer
        for (const primitive of allPrimitives) {
            if (debug) console.log(`[${model.name}] Processing primitive:`, primitivesCount++);
            const position = this.getDataFromPrimitive('POSITION',model, primitive);
            const normal = this.getDataFromPrimitive('NORMAL', model, primitive);
            const texcoord = this.getDataFromPrimitive('TEXCOORD_0', model, primitive);
            let joints = this.getDataFromPrimitive('JOINTS_0', model, primitive);
            const weights = this.getDataFromPrimitive('WEIGHTS_0', model, primitive);

            // Convert in order to avoid issues with gl1 (TODO check if with gl2 can be solved)
            if (joints && !(joints instanceof Float32Array)) {
             //   console.warn(`[${model.name}] Converting joints from ${joints.constructor.name} to Float32Array`);
                joints = new Float32Array(joints);
            }
            
            if (debug) console.log(`[${model.name}] Joint length: ${joints ? joints.length : 'N/A'}`);
           
            // Retrieve vertex for each object 
            const indexAcc = accessors[primitive.indices];
            const indexView = bufferViews[indexAcc.bufferView];
            const indexOffset = (indexView.byteOffset || 0);
            const typeArray = this.getTypeFromAccessor(indexAcc);
            const indices = new typeArray(bin, indexOffset, indexAcc.count);
            
            // retrieve texture data
            const matIdx = primitive.material;
            
            if (matIdx === undefined) {
                console.warn(`[${model.name}] Primitive has no material assigned, using default material`);
            }
            
            const mat = json.materials[matIdx] || {};
            const pbr = mat.pbrMetallicRoughness || {};

            //console.log(`[${model.name}] Processing material ${matIdx}:`, mat.name || 'unnamed');

            const getTex = async (texInfo) => {
                try {
                    const tex = json.textures[texInfo.index];
                    const img = json.images[tex.source];
                    const uri = `models/assets/textures/${model.name}/` + img.uri;
                    if (debug) console.log(`[${model.name}] Attempting to load texture: ${uri}`);
                    const texture = await TextureUtils.loadTextureImage(model, uri);
                    return texture;
                } catch (error) {
                    console.warn(`[${model.name}] Failed to load texture:`, error.message);
                    return null;
                }
            };

            const textures = {
                color: pbr.baseColorTexture ? await getTex(pbr.baseColorTexture) : null,
                normal: mat.normalTexture ? await getTex(mat.normalTexture) : null,
                metalRough: pbr.metallicRoughnessTexture ? await getTex(pbr.metallicRoughnessTexture) : null,
                emission: mat.emissiveTexture ? await getTex(mat.emissiveTexture) : null,
            };
            
            if (debug)
                console.log(`[${model.name}] Texture loading results for material ${matIdx}:`, {
                    color: !!textures.color,
                    normal: !!textures.normal,
                    metalRough: !!textures.metalRough,
                    emission: !!textures.emission
                });

            model.buffersList.push({
                position,
                normal,
                texcoord,
                joints,
                weights,
                indices,
                indexCount: indexAcc.count,
                textures,
            });
        }
    }
}