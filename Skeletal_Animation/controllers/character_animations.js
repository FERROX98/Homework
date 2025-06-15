export const walkAnimations = [ 
    { name: 'WalkRelaxedLoop', index: 3, next: null },
    { name: 'WalkRevRelaxedLoop', index: 4, next: null },
    { name: 'WalkLoop', index: 5, next: null },
    { name: 'WalkRevLoop', index: 6, next: null },
    { name: 'WalkRelaxedStart', index: 10, next: 'WalkRelaxedLoop' },
    { name: 'WalkRevRelaxedStart', index: 11, next: 'WalkRevRelaxedLoop' },
    { name: 'WalkEnd', index: 12, next: 'Idle' },
    { name: 'Default', index: 18, next: 'Idle' },
    { name: 'Idle', index: 23, next: null },
    { name: 'WalkRelaxedEnd', index: 26, next: 'Idle' },
    { name: 'WalkStart', index: 27, next: 'WalkLoop' },
    { name: 'WalkRevStart', index: 28, next: 'WalkRevLoop' },
];

export const animations = [
    { name: 'Shoot', description: 'Side shoot', icon: '🎯', index: 0, next: 'Idle' },
    { name: 'FastRunLoop', description: 'Fast run loop', icon: '🏃', index: 2, next: 'Idle' },
    { name: 'DrawGun', description: 'Draw gun from back', icon: '🔫', index: 7, next: 'Idle' },
    { name: 'FastRunStart', description: 'Fast run start', icon: '🏃‍♀️', index: 9, next: 'Idle' },
    { name: 'CoolShoot', description: 'Cool dual gun shoot', icon: '👉', index: 13, next: 'Idle' },
    { name: 'GunShoot', description: 'Gun shooting', icon: '🔫', index: 14, next: 'Idle' },
    { name: 'Dance', description: 'Aerobic dance', icon: '💃', index: 16, next: 'Idle' },
    { name: 'BreakDoor', description: 'Break door', icon: '🚪', index: 19, next: 'Idle' },
    { name: 'FastRunEnd', description: 'Fast run end', icon: '🏃‍♂️', index: 21, next: 'Idle' },
    { name: 'StandToSit', description: 'Stand to sit', icon: '🪑', index: 24, next: 'StandToSitRev' },
    { name: 'StandToSitRev', description: 'Stand to sit (reverse)', icon: '🪑', index: 25, next: 'Idle' },
];


export class CharacterAnimations {

    static getAnimationByName(name) {
        return animations.find(animation => animation.name === name);
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


    // TODO fix
    static getMovementSensitivity(animationType) {
        switch (animationType) {
        case 'relaxed':
            this.moveSpeed = this.baseSpeed * 0.7; // Slower for relaxed walk
            break;
        case 'fast':
            this.moveSpeed = this.baseSpeed * 1.5; // Faster for running
            break;
        case 'normal':
        default:
            this.moveSpeed = this.baseSpeed; // Normal speed
            break;
        }
    }

    static getWalkAnimationKeys(type = 'normal') {
        switch (type) {
            case 'relaxed':
                return {
                start: 'WalkRelaxedStart',
                loop: 'WalkRelaxedLoop', 
                end: 'WalkRelaxedEnd',
                revStart: 'WalkRelaxedLoop',
                revLoop: 'WalkRevLoop',
                revEnd: 'WalkRelaxedEnd'
                };
            case 'fast':
                return {
                start: 'FastRunStart',
                loop: 'FastRunLoop',
                end: 'FastRunEnd',
                revStart: 'FastRunRevStart',
                revLoop: 'FastRunRevLoop',
                revEnd: 'FastRunEnd'
                };
            case 'normal':
            default:
                return {
                start: 'WalkStart',
                loop: 'WalkLoop',
                end: 'WalkEnd', 
                revStart: 'WalkRevStart',
                revLoop: 'WalkRevLoop',
                revEnd: 'WalkEnd'
                };
            }
    }
}
