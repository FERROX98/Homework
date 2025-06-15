import { Model } from './model.js';
import { CharacterAnimations } from '../controllers/character_animations.js';

const debug = true;

export class Character extends Model {
  constructor(gl, modelPath, animated = false, visible = true) {
    super(gl, modelPath, animated, visible);
    this.currentAnimation = null;
    this.chair = null;

    this.isMovingForward = false;
    this.isMovingBackward = false;

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

    if (forward) {
      this.setAnimation(CharacterAnimations.getWalkAnimationKeys(this.currentWalkType).start);
    } else {
      this.setAnimation(CharacterAnimations.getWalkAnimationKeys(this.currentWalkType).revStart);
    }
  }

  setEndAnimationWalk(forward = true) {
    this.isMovingForward = false
    this.isMovingBackward = false;

    if (forward) {
      this.setAnimation(CharacterAnimations.getWalkAnimationKeys(this.currentWalkType).end);
    } else {
      this.setAnimation(CharacterAnimations.getWalkAnimationKeys(this.currentWalkType).revEnd);
    }
  }

  switchAnimation() {
    if (this.currentAnimation.next) {
      if (debug) console.log(`[${this.name}] Switching from ${this.currentAnimation.name} to next animation: ${this.currentAnimation.next}`);
      let anim = null;
      if (this.currentAnimation.name === 'StandToSitRev')
        this.chair.isVisible = false;

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
        console.warn(`[${this.name}] Animation ${this.currentAnimation.next} not found, setting to Idle.`);
        this.setAnimation('Idle');
      }

    } else if (debug) {
      console.warn(`[${this.name}] looping ${this.currentAnimation.name}.`);
      //this.setAnimation('Idle');
    }

    return this.currentAnimation.next;
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