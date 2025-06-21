
import { animations } from '../controllers/character_animations.js';


const debug = false;
export class AnimationSelector {

  constructor(caracterController) {
    this.animationToShow = animations.filter(animation => animation.show);


    this.caracterController = caracterController;

    if (!this.caracterController) {
      console.warn('CharacterController is undefined in AnimationSelector constructor');
    }

    this.isVisible = false;
    this.selectedIndex = 0;

    this.animationSelector = document.getElementById('animation-selector-overlay');
    this.animationList = document.getElementById('animation-list');


    this.initControls();
  }

  initControls() {

    if (this.animationSelector) {
      this.animationSelector.style.display = 'none';
      this.animationSelector.addEventListener('click', (e) => {
        if (e.target === this.animationSelector) {
          this.toggle();
        }
      });
    }

    if (this.animationList) {
      this.animationList.innerHTML = '';

      this.animationToShow.forEach((animation, index) => {
        const item = document.createElement('div');
        item.className = 'animation-item';
        item.innerHTML = ` 
          <span class="animation-icon">${animation.icon}</span>
          <span class="animation-name">${animation.name}</span>`;

        // circle  = R * 2 *pi
        const anglePerItem = 2 * Math.PI / this.animationToShow.length;
        // 2 pi / the num of el 
        const angle = (index + 1) * anglePerItem;
        const radius = 240;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        item.style.left = `calc(50% + ${x}px - 55px)`;
        item.style.top = `calc(50% + ${y}px - 55px)`;

        item.addEventListener('click', () => {
          this.selectAnimation(index);
          this.activateSelectedAnimation();
          this.toggle();
        });

        this.animationList.appendChild(item);
      });

      this.updateSelectedVisual();
    }

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
    nameLabel.textContent = this.animationToShow[index].name;
    this.updateSelectedVisual();
  }

  updateSelectedVisual() {
    const items = this.animationList.querySelectorAll('.animation-item');
    items.forEach(item => item.classList.remove('selected'));

    if (items[this.selectedIndex]) {
      items[this.selectedIndex].classList.add('selected');
    }
  }

  activateSelectedAnimation() {
    const selected = this.animationToShow[this.selectedIndex];

    if (this.caracterController) {
      this.caracterController.setAnimation(selected.name);
    }
  }

  toggle() {
    this.isVisible = !this.isVisible;
    if (this.animationSelector) {
      this.animationSelector.style.display = this.isVisible ? 'flex' : 'none';
    }
  }

}
