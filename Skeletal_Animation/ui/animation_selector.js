export class AnimationSelector {
  constructor() {
   // this.caracterController = caracterController;
    this.isVisible = false;
    this.selectedIndex = 0;
    this.animations = [
      { name: 'Idle', description: 'Default standing pose', key: '1', icon: '🧍' },
      { name: 'Walk', description: 'Walking animation', key: '2', icon: '🚶' },
      { name: 'Run', description: 'Running animation', key: '3', icon: '🏃' },
      { name: 'Jump', description: 'Jump animation', key: '4', icon: '🦘' },
      { name: 'Dance', description: 'Victory dance', key: '5', icon: '💃' },
      { name: 'Wave', description: 'Friendly wave', key: '6', icon: '👋' },
      { name: 'Point', description: 'Point gesture', key: '7', icon: '👉' },
      { name: 'Clap', description: 'Clapping hands', key: '8', icon: '👏' }
    ];

    this.animationSelector = document.getElementById('animation-selector-overlay');
    this.animationList = document.getElementById('animation-list');

    if (this.animationList) {
      this.animationList.innerHTML = '';

      this.animations.forEach((animation, index) => {
        const item = document.createElement('div');
        item.className = 'animation-item';
        item.innerHTML = `
          <span class="animation-icon">${animation.icon}</span>
          <span class="animation-name">${animation.name}</span>
          <span class="animation-description">${animation.description}</span>`;

        item.addEventListener('click', () => {
          this.selectAnimation(index);
          this.activateSelectedAnimation();
        });
        this.animationList.appendChild(item);
      });
    }

    if (this.animationSelector) {
      this.animationSelector.style.display = 'none';  
      this.animationSelector.addEventListener('click', (e) => {
        if (e.target === this.animationSelector) {
          this.toggle();
        }
      });
    }

    this.initControls();
  }

  initControls() {
    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'i') {
        this.toggle();
        e.preventDefault();
      }
    });
  }

  selectAnimation(index) {
    this.selectedIndex = index;
    const nameLabel = document.getElementById('selected-animation-name');
    nameLabel.textContent = this.animations[index].name;
    
  }

  activateSelectedAnimation() {
    const selected = this.animations[this.selectedIndex];
    const event = new CustomEvent('animationSelected', {
      detail: {
        animation: selected,
        index: this.selectedIndex
      }
    });
    window.dispatchEvent(event);

    // Update the character controller with the selected animation
    if (this.caracterController) {
      this.caracterController.setAnimation(selected.name);
    }
  }

  toggle() {
    this.isVisible = !this.isVisible;
    if (this.animationSelector) {
      this.animationSelector.style.display = this.isVisible ? 'block' : 'none';
    }
  }
}
