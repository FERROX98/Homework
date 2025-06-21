import { Model } from './model.js';
import { CharacterAnimations } from '../controllers/character_animations.js';

const debug = false;

export class Character extends Model {
  constructor(gl, modelPath, animated = false, visible = true) {

    super(gl, modelPath, animated, visible);
        

    this.currentAnimation = null;
    this.chair = null;

    this.isMovingForward = false;
    this.isMovingBackward = false;
    this.animationSpeed = 1; 
   

    this.currentWalkType = 'normal';
  }

  onLoaded() {
    this.setAnimation('Idle');
  }

  get isMoving() {
    return this.isMovingForward || this.isMovingBackward;
  }

  getAnimationSpeed() {
    if (this.currentAnimation === null) 
      return this.animationSpeed;
    const animSpeed = this.animationSpeed * CharacterAnimations.getAnimationSensitivity(this.currentAnimation.name);
    return animSpeed;
  }

  setStartAnimationWalk(forward = true) {
    this.isMovingForward = forward;
    this.isMovingBackward = !forward;
    this.resetAllAnimationObjects();

    if(debug) console.log(`[${this.name}] Setting ${this.currentWalkType} start walk animation: ${forward ? 'forward' : 'backward'}`);
    if (forward) {
      const walkKey = CharacterAnimations.getWalkAnimationKeys(this.currentWalkType).start;
      if (debug) console.log(`[${this.name}] Setting ${this.currentWalkType} start walk animation: ${walkKey}`);
      this.setAnimation(walkKey);
    } else {
      const walkKey = CharacterAnimations.getWalkAnimationKeys(this.currentWalkType).revStart;
      if (debug) console.log(`[${this.name}] Setting ${this.currentWalkType} start reverse walk animation: ${walkKey}`);
      this.setAnimation(CharacterAnimations.getWalkAnimationKeys(this.currentWalkType).revStart);
    }
  }

  setEndAnimationWalk(forward = true) {
    if (this.currentAnimation.name === 'Idle')
      return;
    this.isMovingForward = false
    this.isMovingBackward = false;
    this.resetAllAnimationObjects();

    if (forward) {
      const walkKey = CharacterAnimations.getWalkAnimationKeys(this.currentWalkType).end;
      if (debug) console.log(`[${this.name}] Setting ${this.currentWalkType} end walk animation: ${walkKey}`);
      this.setAnimation(walkKey);
    } else {
      const walkKey = CharacterAnimations.getWalkAnimationKeys(this.currentWalkType).revEnd;
      if (debug) console.log(`[${this.name}] Setting ${this.currentWalkType} end reverse walk animation: ${walkKey}`);
      this.setAnimation(CharacterAnimations.getWalkAnimationKeys(this.currentWalkType).revEnd);
    }
  }

  resetAllAnimationObjects() {
    if (this.chair)
      this.chair.isVisible = false;
  }

  switchAnimation() {

    const switched = this.currentAnimation.next ? true : false;
    if (this.currentAnimation.next === 'Idle') 
          this.resetAllAnimationObjects();

    if (this.currentAnimation.next) {
      if (debug) console.log(`[${this.name}] Switching from ${this.currentAnimation.name} to next animation: ${this.currentAnimation.next}`);
      let anim = null;

      if (CharacterAnimations.isWalkAnimation(this.currentAnimation.next)) {
        anim = CharacterAnimations.getWalkAnimationByName(this.currentAnimation.next);
        if (debug) console.log(`[${this.name}] WalkAnimation ${this.currentAnimation.next} set.`);
      } else {
        anim = CharacterAnimations.getAnimationByName(this.currentAnimation.next);
        if (debug) console.log(`[${this.name}] Animation ${this.currentAnimation.next} set.`);
      }

      if (anim) {
        this.setAnimation(anim.name);
      } else {
        console.error(`[${this.name}] Animation ${this.currentAnimation.next} not found, setting to Idle.`);
        this.setAnimation('Idle');
      }

    } else if (debug) {
      console.warn(`[${this.name}] looping ${this.currentAnimation.name}.`);
      //this.setAnimation('Idle');
    }
    
    if (debug && switched) console.log(`[${this.name}] Animation switched to: ${this.currentAnimation.name} (switched : ${switched})`);
    return switched;
  }

  setAnimation(animationName) {
    if (debug) console.log(`[${this.name}] Setting animation: ${animationName}`);

    this.currentAnimation = CharacterAnimations.getAnimationByName(animationName);
    if (!this.currentAnimation) {
      console.error(`[${this.name}] Animation ${animationName} not found.`);
      this.currentAnimation = CharacterAnimations.getAnimationByName('Idle');
    }
    if (debug) console.log(`[${this.name}] Current animation set to: ${this.currentAnimation.name} (index: ${this.currentAnimation.index})`);
    this.selectAnimation(this.currentAnimation.index);
  }
}