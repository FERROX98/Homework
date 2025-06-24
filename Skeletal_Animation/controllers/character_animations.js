
// waitBefore for the velocity (wait before to move to max velocity)
// waitAfter for the animation/movement duration (wait after keyup to stop movement)

export const walkAnimations = [
    { name: 'WalkRelaxedEnd', index: 2, next: 'Idle', waitBefore: 0, waitAfter: 2000    , show: true },
    { name: 'WalkRelaxedLoop', index: 3, next: null, waitBefore: 0, waitAfter: 0, show: true },
    { name: 'WalkRevRelaxedLoop', index: 5, next: null, waitBefore: 1000, waitAfter: 0, show: true },
    { name: 'WalkRevRelaxedStart', index: 6, next: 'WalkRevRelaxedLoop', waitBefore: 2000, waitAfter: 0, show: true },
    { name: 'WalkLoop', index: 7, next: null, waitBefore: 0, waitAfter: 0, show: true },
    { name: 'WalkRevLoop', index: 8, next: null, waitBefore: 0, waitAfter: 0, show: true },
    { name: 'WalkRevRelaxedEnd', index: 11, next: 'Idle', waitBefore: 0, waitAfter: 6000, show: true },
    { name: 'WalkRelaxedStart', index: 12, next: 'WalkRelaxedLoop', waitBefore: 1000, waitAfter: 0, show: true },
    { name: 'WalkEnd', index: 13, next: 'Idle', waitBefore: 0, waitAfter: 500, show: true },
    { name: 'WalkRevStart', index: 15, next: 'WalkRevLoop', waitBefore: 1000, waitAfter: 0, show: true },
    { name: 'Idle', index: 22, next: null, waitBefore: 0, waitAfter: 0, show: true },
    { name: 'WalkRevEnd', index: 26, next: 'Idle', waitBefore: 0, waitAfter: 500, show: true },
    { name: 'WalkStart', index: 27, next: 'WalkLoop', waitBefore: 1000, waitAfter: 0, show: true },
];

export const animations = [
    { name: 'Shoot',  icon: '🎯', index: 0, next: 'Idle', 'waitBefore': 0, 'waitAfter': 0, 'show': true },
    { name: 'DrawGun', icon: '🔫', index: 9, next: 'Idle', 'waitBefore': 0, 'waitAfter': 0, 'show': true },
    { name: 'CoolShoot', icon: '👉', index: 16, next: 'Idle', 'waitBefore': 0, 'waitAfter': 0, 'show': true },
    { name: 'GunShoot', icon: '🔫', index: 17, next: 'Idle', 'waitBefore': 0, 'waitAfter': 0, 'show': true },
    { name: 'Dance', icon: '💃', index: 18, next: 'Idle', 'waitBefore': 0, 'waitAfter': 0, 'show': true },
    { name: 'BreakDoor', icon: '🚪', index: 20, next: 'Idle', 'waitBefore': 0, 'waitAfter': 0, 'show': true },
    { name: 'StandToSit', icon: '🪑', index: 23, next: 'StandToSitRev', 'waitBefore': 0, 'waitAfter': 1000, 'show': true },
    { name: 'StandToSitRev', icon: '🪑', index: 24, next: 'Idle', 'waitBefore': 0, 'waitAfter': 0, 'show': false },
];

export class CharacterAnimations {

    static getAnimationByName(name) {
        if (animations.some(animation => animation.name === name)) {
            return animations.find(animation => animation.name === name);
        } else { 
            return walkAnimations.find(animation => animation.name === name);
        }
    }

    static getAnimationByIndex(index) {
        return animations.find(animation => animation.index === index);
    }
    static getWalkAnimationByName(name) {
        return walkAnimations.find(animation => animation.name === name);
    }
    static getWalkAnimationByIndex(index) {
        return walkAnimations.find(animation => animation.index === index);
    }
    static isWalkAnimation(name) {
        return walkAnimations.some(animation => animation.name === name);
    }

    static getMovementSensitivity(animationType) {
        switch (animationType) {
            case 'relaxed':
                return 0.6;
            case 'normal':
                return 1.0;
            default:
                return 0.8;
        }
    }

    static getMovementPhase(animationType) {
        switch (animationType) {
            case 'WalkStart':
                return 0.1;
            case 'WalkLoop':
                return 1.0;
            case 'WalkEnd':
                return 0.9;
            case 'WalkRelaxedStart':
                return 0.9;
            case 'WalkRelaxedLoop':
                return 1.0;
            case 'WalkRelaxedEnd':
                return 0.6;
            default:
                return 1.0;
        }
    }

     static getAnimationSensitivity(animationType) {
        switch (animationType) {
        case 'Idle':
            return 0.5;
        case 'normal':
            return 1;
        case 'StandToSit': 
            return 0.5;
        default:
            if (CharacterAnimations.isWalkAnimation(animationType)) 
                return 1; 
            return 0.6; 
        }
    }

    static getWalkAnimationKeys(type = 'normal') {
        switch (type) {
            case 'relaxed':
                return {
                start: 'WalkRelaxedStart',
                loop: 'WalkRelaxedLoop', 
                end: 'WalkRelaxedEnd',
                revStart: 'WalkRevRelaxedStart',
                revLoop: 'WalkRevRelaxedLoop',
                revEnd: 'WalkRevRelaxedEnd'
                };
            case 'normal':
            default:
                return {
                start: 'WalkStart',
                loop: 'WalkLoop',
                end: 'WalkEnd', 
                revStart: 'WalkRevStart',
                revLoop: 'WalkRevLoop',
                revEnd: 'WalkRevEnd'
                };
            }
    }
}
