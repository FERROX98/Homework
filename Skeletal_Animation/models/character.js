import { Model } from './model.js';
import { CharacterAnimations } from '../controllers/character_animations.js';

const debug = false;

export class Character extends Model {
  constructor(gl, modelPath, animated = false, visible = true, loadTexFromGlT= false) {

    super(gl, modelPath, animated, visible, loadTexFromGlT);
        

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


    if (forward) {
      const walkKey = CharacterAnimations.getWalkAnimationKeys(this.currentWalkType).start;

      this.setAnimation(walkKey);
    } else {
      const walkKey = CharacterAnimations.getWalkAnimationKeys(this.currentWalkType).revStart;

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

      this.setAnimation(walkKey);
    } else {
      const walkKey = CharacterAnimations.getWalkAnimationKeys(this.currentWalkType).revEnd;

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

      let anim = null;

      if (CharacterAnimations.isWalkAnimation(this.currentAnimation.next)) {
        anim = CharacterAnimations.getWalkAnimationByName(this.currentAnimation.next);

      } else {
        anim = CharacterAnimations.getAnimationByName(this.currentAnimation.next);

      }

      if (anim) {
        this.setAnimation(anim.name);
      } else {
        console.error(`[${this.name}] Animation ${this.currentAnimation.next} not found, setting to Idle.`);
        this.setAnimation('Idle');
      }

    } else {
      console.warn(`[${this.name}] looping ${this.currentAnimation.name}.`);
      //this.setAnimation('Idle');
    }
    
    if (debug && switched) console.log(`[${this.name}] Animation switched to: ${this.currentAnimation.name} (switched : ${switched})`);
    return switched;
  }

  setAnimation(animationName) {


    this.currentAnimation = CharacterAnimations.getAnimationByName(animationName);
    if (!this.currentAnimation) {
      console.error(`[${this.name}] Animation ${animationName} not found.`);
      this.currentAnimation = CharacterAnimations.getAnimationByName('Idle');
    }

    this.selectAnimation(this.currentAnimation.index);
  }
}