import {
  mat4,
  quat,
  vec3,
} from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js";

import { Model } from "../model.js";
import { GLTFUtils } from "./gltf_utils.js";

const debug = false;

export class AnimationUtils {

  static interpolateVec3(track, t) {
    const times = track.times;
    const values = track.values;

    if (!times || !values || times.length === 0 || values.length === 0) {
      console.warn("Invalid track data for vec3 interpolation");
      return [0, 0, 0];
    }

    // not started kf 
    if (t <= times[0]) return vec3.fromValues(values[0], values[1], values[2]);

    // at end
    if (t >= times[times.length - 1]) {
      const lastIdx = (times.length - 1) * 3;
      return vec3.fromValues(
        values[lastIdx],
        values[lastIdx + 1],
        values[lastIdx + 2]
      );
    }

    let i = 0;

    // select keyframe 
    while (i < times.length - 1 && t > times[i + 1]) i++;

    // start k
    const t0 = times[i];
    // end k 
    const t1 = times[i + 1];

    // time interpolation factor
    const alpha = (t - t0) / (t1 - t0);

    // values are stored as flat array 
    // start 
    const v0 = vec3.fromValues(
      values[i * 3],
      values[i * 3 + 1],
      values[i * 3 + 2]
    );
    // end 
    const v1 = vec3.fromValues(
      values[(i + 1) * 3],
      values[(i + 1) * 3 + 1],
      values[(i + 1) * 3 + 2]
    );

    return vec3.lerp(vec3.create(), v0, v1, alpha);
  }

  static interpolateQuat(track, t) {
    const times = track.times;
    const values = track.values;

    if (!times || !values || times.length === 0 || values.length === 0) {
      console.warn("Invalid track data for quat interpolation");
      return [0, 0, 0, 1];
    }

    // not started kf
    if (t <= times[0])
      return quat.fromValues(values[0], values[1], values[2], values[3]);

    // at end
    if (t >= times[times.length - 1]) {
      const lastIdx = (times.length - 1) * 4;
      return quat.fromValues(
        values[lastIdx],
        values[lastIdx + 1],
        values[lastIdx + 2],
        values[lastIdx + 3]
      );
    }

    // select kf
    let i = 0;
    while (i < times.length - 1 && t > times[i + 1]) i++;

    const t0 = times[i];
    const t1 = times[i + 1];
    const alpha = (t - t0) / (t1 - t0);

    // start kf A
    const q0 = quat.fromValues(
      values[i * 4],
      values[i * 4 + 1],
      values[i * 4 + 2],
      values[i * 4 + 3]
    );

    // end kf B
    const q1 = quat.fromValues(
      values[(i + 1) * 4],
      values[(i + 1) * 4 + 1],
      values[(i + 1) * 4 + 2],
      values[(i + 1) * 4 + 3]
    );

    return quat.slerp(quat.create(), q0, q1, alpha);
  }

  static configureAnimationData(model) {

    if (!model instanceof Model)
      throw new Error("model must be an instance of Model");

    if (debug) console.log(`[${model.name}] Configuring animation data...`);
    const json = model.json;
    const bin = model.bin;

    if (!json.animations || json.animations.length === 0) {
      console.warn(`[${model.name}] No animations found in the model`);
      return null;
    }

    const animPreproc = []

    //  Keyframe
    if (debug) console.log(`[${model.name}] has ${json.animations.length} animations`, json.animations.map(a => a.name || "none"));
    for (const animation of json.animations) {
      const animData = {};

      // Animation data structure (node --> timeFrame start and end, keyframe values)
      const animationTracks = new Map();
      let animationLength = 0;

      if (debug) console.log(`processing: ${animation.name || "default"}`);

      // channel tell us which node to animate and which sampler(keyframe interval) to use and the type of transformation
      for (const channel of animation.channels) {
        // each sampler defines a start and an end keyframe and which interpolation method to use
        // and the transformation pointer
        const sampler = animation.samplers[channel.sampler];

        // target is the node (bone) that will be animated
        const target = channel.target;
        const nodeIndex = target.node;

        // type of transformation
        const path = target.path;

        // keyframe (time)
        const inputAccessor = json.accessors[sampler.input];
        // transformation to apply
        const outputAccessor = json.accessors[sampler.output];

        // read the values from the binary
        const inputView = json.bufferViews[inputAccessor.bufferView];
        const outputView = json.bufferViews[outputAccessor.bufferView];

        const typeArrayInput = GLTFUtils.getTypeFromAccessor(inputAccessor);
        const numComponentsInput = GLTFUtils.getNumComponentsFromAccessor(inputAccessor);

        // all in float otherwise gl explodes 
        const inputArray = new typeArrayInput(
          bin,
          (inputView.byteOffset || 0),
          inputAccessor.count * numComponentsInput
        );

        const typeArrayOutput = GLTFUtils.getTypeFromAccessor(outputAccessor);
        const numComponentsOutput = GLTFUtils.getNumComponentsFromAccessor(outputAccessor);

        const outputArray = new typeArrayOutput(
          bin,
          (outputView.byteOffset || 0),
          outputAccessor.count * numComponentsOutput
        );

        if (debug) console.log(`[${model.name}] Animation track for node ${nodeIndex} at path ${path}:`, inputArray, outputArray);
        if (!animationTracks.has(nodeIndex)) {
          animationTracks.set(nodeIndex, {});
        }

        // type transformation -->  {times: start time, end time, values: transformation values}
        animationTracks.get(nodeIndex)[path] = {
          times: inputArray,
          values: outputArray,
        };

        //  animation length
        const endTime = inputArray[inputArray.length - 1];
        animationLength = Math.max(animationLength, endTime);
      }

      animData.animationTracks = animationTracks;
      animData.animationLength = animationLength;
      animData.name = animation.name;
      animPreproc.push(animData);
    }

    // skeleton
    const nodes = json.nodes;
    console.log(`[${model.name}] Found ${nodes.length} nodes (bones) in the model`);

    let nodeParents = [];
    // Build list parents
    for (let i = 0; i < nodes.length; i++) {
      for (let j = 0; j < nodes.length; j++) {
        // if the node has parent
        if (nodes[j].children && nodes[j].children.includes(i)) {
          // set the parent index j at index child i
          nodeParents[i] = j;
          break;
        }
      }
    }
    model.nodeParents = nodeParents;

    console.log(`[${model.name}] Node parents:`, nodeParents);

    model.animPreproc = animPreproc;
  }

  static updateJointMatrices(model) {
    let jointMatrices = model.jointMatrices;
    const gl = model.gl;
    gl.useProgram(model.program);

    if (!jointMatrices || jointMatrices.length === 0)
      return;

    const jointMatrixLoc = model.uniforms.jointMatrices;

    if (jointMatrixLoc !== -1 && jointMatrixLoc !== null) {
      const flatJointData = new Float32Array(model.jointMatrices.length * 16);
      for (let i = 0; i < model.jointMatrices.length; i++) {
        flatJointData.set(model.jointMatrices[i], i * 16);
      }
      gl.uniformMatrix4fv(jointMatrixLoc, false, flatJointData);
    }
  }

  static updateAnimation(t, model) {
    if (!model.jointNodes || model.jointNodes.length === 0 || !model.animationTracks.size) {
      return false;
    }

    if (debug) console.log(`[${this.name}] Updating animation at time: ${t.toFixed(2)}s for model: ${model.name}`, model.currentAnimation);

    // check switccg
    if (model.animationLength > 0 && t >= model.animationLength) {
      const switched = model.switchAnimation();
      if (switched) {
        if (debug) console.warn(`[${model.name}] Animation completed ${model.currentAnimation.name} a full cycle, switching to next animation. ${t}`);
        let now = performance.now();

        let elapsedSeconds = (now - model.startTime) / 1000;
        let animTime = elapsedSeconds * model.getAnimationSpeed();

        t = animTime;
        if (debug) console.warn(`[${this.name}] Animation time reset to: ${t.toFixed(2)}s`);
      }
    }

    t = t % model.animationLength
    model.currentAnimationTime = t;
    const localTransforms = model.jointNodes.map(() => mat4.create());
    const jointWorld = model.jointNodes.map(() => mat4.create());

    // [pseudo] for(bone in bones) (already topological sorted by blender)
    for (let i = 0; i < model.jointNodes.length; i++) {

      const nodeIndex = model.jointNodes[i];

      //  track: transformation values
      const track = model.animationTracks.get(nodeIndex);
      if (!track) {
        if (debug) console.warn(`[${model.name}] No animation track found for node (bone) ${nodeIndex}`);
        continue;
      }

      // console.log(`[${model.name}] track for node ${nodeIndex}:`, track);

      // interpolate
      const translation = track.translation
        ? AnimationUtils.interpolateVec3(track.translation, t)
        : [0, 0, 0];

      //spherical linear interpolation and it is necessary for correctly interpolating a quaternion-based rotation
      const rotation = track.rotation
        ? AnimationUtils.interpolateQuat(track.rotation, t)
        : [0, 0, 0, 1];

      const scale = track.scale
        ? AnimationUtils.interpolateVec3(track.scale, t)
        : [1, 1, 1];

      const T = mat4.create();
      const R = mat4.create();
      const S = mat4.create();

      mat4.fromTranslation(T, translation);
      mat4.fromQuat(R, rotation);
      mat4.fromScaling(S, scale);

      const TR = mat4.create();
      mat4.multiply(TR, T, R);

      // [pseudo] localMatrix
      mat4.multiply(localTransforms[i], TR, S);

      const parent = model.nodeParents[model.jointNodes[i]];

      //  [pseudo] if(bone is not the root)
      if (parent != null) {
        const parentIndex = model.jointNodes.indexOf(parent);
        if (parentIndex !== -1) {
          //[pseudo]  boneResults[bone].worldMatrix = boneResults[bone.parent].worldMatrix * localMatrix
          mat4.multiply(jointWorld[i], jointWorld[parentIndex], localTransforms[i]);
        } else {
          // [pseudo] boneResults[bone].worldMatrix = localMatrix
          mat4.copy(jointWorld[i], localTransforms[i]);
        }
      } else {
        // [pseudo] if is the root 
        // [pseudo] boneResults[bone].worldMatrix = localMatrix
        mat4.copy(jointWorld[i], localTransforms[i]);
      }

      const skinMatrix = mat4.create();

      // the inverse bindpose matrix brings each vertex in joint space,
      // [pseudo] boneResults[bone].offsetMatrix = bone.inverseBindpose * boneResults[bone].worldMatrix
      mat4.multiply(skinMatrix, jointWorld[i], model.inverseBindMatrices[i]);
      model.jointMatrices[i] = skinMatrix;
    }

    this.updateJointMatrices(model);
    return false;
  }

}
