

export class StaticLoader {
  static get loader() {
    return document.getElementById('loader');
  }


  constructor() {
  }

  static show() {
    this.loader.classList.remove('hidden');

  }

  static hide() {
    this.loader.classList.add('hidden');

  }

  static doAction(callback, timeout = 5000) {
    this.show();

    setTimeout(() => {

      callback();
      this.hide();
    }, timeout);

  }
}