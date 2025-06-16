import json

# Animation indices from rb4.gltf:
# 0: "Armature.001|walk01_loop_251104"
# 1: "Armature.002|walk01_start_251151"
# 2: "Armature.003|Default"
# 3: "Armature.004|crouch_walk_r_againstwall"
# 4: "Armature.005|aerobic-dance_315220"
# 5: "Armature.006|cc02_sideshoot"
# 6: "Armature.007|dual_gun_muzdn_mov_cool_shoot_279383"
# 7: "Armature.008|hold_gun_break_door_279385"
# 8: "Armature.009|idle_251087"
# 9: "Armature.010|hold_gun_fastrun_forward_end_279362"
# 10: "Armature.011|hold_gun_fastrun_forward_loop_279387"
# 11: "Armature.012|hold_gun_fastrun_forward_start_279410"
# 12: "Armature.013|hold_gun_shooting_279354"
# 13: "Armature.014|dual_gun_draw_gun_behind_back_279371"
# 14: "Armature.015|stand-to-sit_251123"
# 15: "Armature.016|walk-relaxed_end_251010"
# 16: "Armature.017|walk-relaxed_loop_251148"
# 17: "Armature.018|walk-relaxed_start_251114"
# 18: "Armature|walk01_end_251138"

#   static walkAnimations = {
#       Idle: 8,                // idle_251087
#       WalkStart: 1,           // walk01_start_251151
#       WalkLoop: 0,            // walk01_loop_251104  
#       WalkEnd: 18,            // walk01_end_251138
#       WalkRevStart: 18,       // walk01_end_251138 (reversed)
#       WalkRevLoop: 0,         // walk01_loop_251104 (reversed)
#       WalkRevEnd: 1,          // walk01_start_251151 (reversed)
#       WalkRelaxedStart: 17,   // walk-relaxed_start_251114
#       WalkRelaxedLoop: 16,    // walk-relaxed_loop_251148
#       WalkRelaxedEnd: 15,     // walk-relaxed_end_251010
#       FastRunStart: 11,       // fast run start
#       FastRunLoop: 10,        // fast run loop  
#       FastRunEnd: 9,          // fast run end
#       Default: 2              // Default
#   };
walk_anim_list = { 
                'walk01_loop': 'WalkLoop',
                'walk01_start': 'WalkStart',
                'walk01_end': 'WalkEnd',
                'walk-relaxed_loop': 'WalkRelaxedLoop',
                'walk-relaxed_start': 'WalkRelaxedStart',
                'walk-relaxed_end': 'WalkRelaxedEnd',
                'idle': 'Idle',
                'default': 'Default'}

general_anim_map = {
        'crouch_walk': 'CrouchWalk',
        'aerobic-dance': 'Dance',
        'cc02_sideshoot': 'Shoot',
        'dual_gun_muzdn_mov_cool_shoot': 'CoolShoot',
        'hold_gun_break_door': 'BreakDoor',
        'hold_gun_fastrun_forward_end': 'FastRunEnd',
        'hold_gun_fastrun_forward_loop': 'FastRunLoop',
        'hold_gun_fastrun_forward_start': 'FastRunStart',
        'hold_gun_shooting': 'GunShoot',
        'dual_gun_draw_gun_behind_back': 'DrawGun',
        'stand-to-sit': 'StandToSit'
    }


def load_name_animation(name):
    import os
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    gltf_path = os.path.join(project_root, 'models', 'assets', f'{name}.gltf')
    
    with open(gltf_path, "r") as file:
        data = json.load(file)
    print(f"Successfully loaded: {gltf_path}")

    walk_animations = {}
    general_animations = {}
    
    # Debug: print all available animations
    print(f"Found {len(data['animations'])} animations:")
    for i, anim in enumerate(data["animations"]):
        print(f"  {i}: {anim['name']}")
        
        anim_full_name = anim['name']
        if '|' in anim_full_name:
            anim_name = anim_full_name.split('|')[1].lower()
        else:
            anim_name = anim_full_name.lower()
       # print(f"    Processed name: {anim_name}")
        # Check if this is a reverse animation
        is_reverse = anim_full_name.endswith('.reverse')
       #$ print(f"    Is reverse: {is_reverse}")
        if is_reverse:
            # Remove .reverse suffix for matching
            base_anim_name = anim_name[:-8]  # Remove '.reverse'
        else:
            base_anim_name = anim_name
       # print(f"    Base animation name: {base_anim_name}")
        walking_keywords = ['walk', 'idle', 'default']
        is_walking = any(keyword in base_anim_name
                         for keyword in walking_keywords)
        print(f"    Is walking: {is_walking}")
        if is_walking:
            for k, v in walk_anim_list.items():
                if k in base_anim_name:
                    if is_reverse:
                        print(f"    Found reverse walking animation: "
                              f"{base_anim_name}"f" k ={k}, v = {v}")
                        # Map to reverse animation name
                        
                        if v.startswith('Walk'):
                            rev_name = v.replace('Walk', 'WalkRev', 1)
                            print(f"    Reverse name: {rev_name}")
                            walk_animations[rev_name] = i
                    else:
                        walk_animations[v] = i
                    break
        
        else:
            for k, v in general_anim_map.items():
                if k in base_anim_name:
                    if is_reverse:
                        print(f"    Found reverse general animation: "
                              f"{base_anim_name}")
                        # Map to reverse animation name by adding "Rev" suffix
                        reverse_name = v + "Rev"
                        general_animations[reverse_name] = i
                    else:
                        general_animations[v] = i
                    break
    
    print()
    return walk_animations, general_animations


def generate_js_animation_mapping(name):
    walk_mapping, general_mapping = load_name_animation(name)
    
    if not walk_mapping and not general_mapping:
        print("No animations found.")
        return
    
    js_code = f"// Animation mapping for {name}\n"

    js_code += "static walkAnimations = [\n"
    
    # Define next mappings for walk animations
    walk_next_mapping = {
        'WalkStart': 'WalkLoop',
        'WalkLoop': 'null',
        'WalkEnd': 'Idle',
        'WalkRevStart': 'WalkRevLoop',
        'WalkRevLoop': 'null',
        'WalkRevEnd': 'Idle',
        'WalkRelaxedStart': 'WalkRelaxedLoop',
        'WalkRelaxedLoop': 'null',
        'WalkRelaxedEnd': 'Idle',
        'WalkRevRelaxedStart': 'WalkRevRelaxedLoop',
        'WalkRevRelaxedLoop': 'null',
        'WalkRevRelaxedEnd': 'Idle',
        'Idle': 'null',
        'Default': 'Idle'
    }
    
    for anim_name, index in walk_mapping.items():
        next_anim = walk_next_mapping.get(anim_name, 'null')
        next_str = f"'{next_anim}'" if next_anim != 'null' else 'null'
        js_code += f"    {{ name: '{anim_name}', index: {index}, next: {next_str} }},\n"

    js_code += "];\n\n"
    
    js_code += "static animations = [\n"
    
    ui_mapping = {
        'Idle': {'icon': '🧍', 'description': 'Default standing pose'},
        'CrouchWalk': {'icon': '🤲', 'description': 'Crouch walk'},
        'CrouchWalkRev': {'icon': '🤲', 'description': 'Crouch walk (reverse)'},
        'Dance': {'icon': '💃', 'description': 'Aerobic dance'},
        'DanceRev': {'icon': '💃', 'description': 'Aerobic dance (reverse)'},
        'Shoot': {'icon': '🎯', 'description': 'Side shoot'},
        'ShootRev': {'icon': '🎯', 'description': 'Side shoot (reverse)'},
        'CoolShoot': {'icon': '👉', 'description': 'Cool dual gun shoot'},
        'CoolShootRev': {'icon': '👉', 'description': 'Cool gun (reverse)'},
        'BreakDoor': {'icon': '🚪', 'description': 'Break door'},
        'BreakDoorRev': {'icon': '🚪', 'description': 'Break door (reverse)'},
        'FastRunEnd': {'icon': '🏃‍♂️', 'description': 'Fast run end'},
        'FastRunEndRev': {'icon': '🏃‍♂️', 'description': 'Fast run end (rev)'},
        'FastRunLoop': {'icon': '🏃', 'description': 'Fast run loop'},
        'FastRunLoopRev': {'icon': '🏃', 'description': 'Fast run loop (rev)'},
        'FastRunStart': {'icon': '🏃‍♀️', 'description': 'Fast run start'},
        'FastRunStartRev': {'icon': '🏃‍♀️', 'description': 'Fast start (rev)'},
        'GunShoot': {'icon': '🔫', 'description': 'Gun shooting'},
        'GunShootRev': {'icon': '🔫', 'description': 'Gun shooting (reverse)'},
        'DrawGun': {'icon': '🔫', 'description': 'Draw gun from back'},
        'DrawGunRev': {'icon': '🔫', 'description': 'Draw gun (reverse)'},
        'StandToSit': {'icon': '🪑', 'description': 'Stand to sit'},
        'StandToSitRev': {'icon': '🪑', 'description': 'Stand to sit (reverse)'}
    }

    for anim_name, index in general_mapping.items():
        if anim_name in ui_mapping:
            ui_info = ui_mapping[anim_name]
            # Define next animation for general animations
            if anim_name == 'StandToSit':
                next_anim = 'StandToSitRev'  # Loops to itself
            else:
                next_anim = 'Idle'  # Most animations return to idle
            
            line = f"    {{ name: '{anim_name}', description: '"
            line += f"{ui_info['description']}', icon: '{ui_info['icon']}', "
            line += f"index: {index}, next: '{next_anim}' }},\n"
            js_code += line

    js_code += "];\n"

    return js_code


if __name__ == "__main__":
    walk_anims, general_anims = load_name_animation("rb4")
    print("Walk animations:", walk_anims)
    print("General animations:", general_anims)
    print("\n" + "="*50)
    print("JavaScript mapping:")
    print(generate_js_animation_mapping("rb5"))
