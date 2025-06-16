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
    this.animationSpeed = 0.4; 

    setTimeout(() => {
      if (this.isLoaded)
        this.setAnimation('Idle')
    }, 2000);

    this.currentWalkType = 'normal';
  }

  get isMoving() {
    return this.isMovingForward || this.isMovingBackward;
  }

  setStartAnimationWalk(forward = true) {
    this.isMovingForward = forward;
    this.isMovingBackward = !forward;
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
    this.isMovingForward = false
    this.isMovingBackward = false;

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

    if (CharacterAnimations.isWalkAnimation(animationName)) {
      this.currentAnimation = CharacterAnimations.getWalkAnimationByName(animationName);
    } else {
      this.currentAnimation = CharacterAnimations.getAnimationByName(animationName);
    }
    if (debug) console.log(`[${this.name}] Current animation set to: ${this.currentAnimation.name} (index: ${this.currentAnimation.index})`);
    this.selectAnimation(this.currentAnimation.index);
  }
}