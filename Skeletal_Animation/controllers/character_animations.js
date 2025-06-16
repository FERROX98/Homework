export const walkAnimations = [ 
    { name: 'WalkRelaxedLoop', index: 3, next: null, waitBefore: 0, waitAfter: 0 },
    { name: 'WalkRevRelaxedLoop', index: 4, next: null, waitBefore: 0, waitAfter: 0  },
    { name: 'WalkLoop', index: 5, next: null, waitBefore: 0, waitAfter: 0  },
    { name: 'WalkRevLoop', index: 6, next: null, waitBefore: 0, waitAfter: 0  },
    { name: 'WalkRelaxedStart', index: 10, next: 'WalkRelaxedLoop', waitBefore: 1000, waitAfter: 0  },
    { name: 'WalkRevRelaxedStart', index: 4, next: 'WalkRevRelaxedLoop', waitBefore: 0, waitAfter: 0  },
    { name: 'WalkEnd', index: 12, next: 'Idle', waitBefore: 0, waitAfter: 500  },
    { name: 'WalkRevEnd', index: 12, next: 'Idle', waitBefore: 0, waitAfter: 0  },
    { name: 'Default', index: 18, next: 'Idle', waitBefore: 0, waitAfter: 0  },
    { name: 'Idle', index: 23, next: null },
    { name: 'WalkRelaxedEnd', index: 26, next: 'Idle', waitBefore: 0, waitAfter: 2300  },
    // TODO fix 
    { name: 'WalkRevRelaxedEnd', index: 12, next: 'Idle', waitBefore: 0, waitAfter: 0  },
    { name: 'WalkStart', index: 27, next: 'WalkLoop', waitBefore: 1000, waitAfter: 0  },
    { name: 'WalkRevStart', index: 6, next: 'WalkRevLoop', waitBefore: 0, waitAfter: 0  },
];
 
export const animations = [
    { show: true, name: 'Shoot', description: 'Side shoot', icon: '🎯', index: 0, next: 'Idle', waitBefore: 0, waitAfter: 0  },
    { show: true, name: 'DrawGun', description: 'Draw gun from back', icon: '🔫', index: 7, next: 'Idle' , waitBefore: 0, waitAfter: 0 },
    { show: true, name: 'CoolShoot', description: 'Cool dual gun shoot', icon: '👉', index: 13, next: 'Idle', waitBefore: 0, waitAfter: 0  },
    { show: true, name: 'GunShoot', description: 'Gun shooting', icon: '🔫', index: 14, next: 'Idle', waitBefore: 0, waitAfter: 0  },
    { show: true, name: 'Dance', description: 'Aerobic dance', icon: '💃', index: 16, next: 'Idle', waitBefore: 0, waitAfter: 0  },
    { show: true, name: 'BreakDoor', description: 'Break door', icon: '🚪', index: 19, next: 'Idle', waitBefore: 0, waitAfter: 0  },
    { show: true, name: 'StandToSit', description: 'Stand to sit', icon: '🪑', index: 24, next: 'StandToSitRev', waitBefore: 0, waitAfter: 1000  },
    { show: false, name: 'StandToSitRev', description: 'Stand to sit (reverse)', icon: '🪑', index: 25, next: 'Idle', waitBefore: 0, waitAfter: 0  },
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
        //console.log(`Getting movement sensitivity for animation type: ${animationType}`);
        switch (animationType) {
            case 'relaxed':
                return 0.9;
            case 'normal':
                return 1.0;
            default:
                return 0.8;
        }
    }

    static getMovementPhase(animationType) {
       // console.log(`Getting movement phase for animation type: ${animationType}`);
        switch (animationType) {
            case 'WalkStart':
                return 0.1;
            case 'WalkLoop':
                return 1.0;
            case 'WalkEnd':
                return 0.9;
            case 'WalkRelaxedStart':
                return 0.8;
            case 'WalkRelaxedLoop':
                return 1.0;
            case 'WalkRelaxedEnd':
                return 0.9;
            default:
                return 1.0;
        }
    }

     static getAnimationSensitivity(animationType) {
        //console.log(`Getting animation sensitivity for animation type: ${animationType}`);
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
                revStart: 'WalkRevRelaxedLoop',
                revLoop: 'WalkRevLoop',
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
