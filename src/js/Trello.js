'use strict';

export default class Trello {
  constructor(container) {
    this.container = container;
    this.columns = ['TO DO', 'IN PROGRESS', 'DONE'];
    this.drawing = false;
    this.currentItem = null;
    this.shadowItem = null;
  }

  init() {
    this.creatColumns();
    this.loadFromLocalStorage();
    this.addNewCardEventListener();
    this.focusCardEventListener();
    this.mouseMoveCardEventListener();
  }

  addNewCardEventListener() {
    this.container.addEventListener('click', event => {
      if (event.target.tagName === 'BUTTON' && event.target.classList.contains('add-card-btn')) {
        this.createItemInput(event.target.parentNode);
      } else if (event.target.tagName === 'A' && event.target.classList.contains('close-add-new-card')) {
        this.removeNewCardOpenedWindow();
      } else if (event.target.tagName === 'INPUT' && event.target.classList.contains('js-add-card')) {
        const cardTextarea = document.querySelector('.card-textarea').value;
        if (cardTextarea.length > 0) {
          this.createItem(cardTextarea, event.target.parentNode.parentNode.parentNode);
          this.removeNewCardOpenedWindow();
          this.mouseMoveCardEventListener();
          this.saveToLocalStorage();
        }
      } else if (event.target.tagName === 'SPAN' && event.target.classList.contains('icon-close')) {
        event.target.parentNode.remove();
        this.saveToLocalStorage();
      }
    })
  }

  focusCardEventListener() {
    this.container.addEventListener('mouseover', event => {
      if (event.target.tagName === 'LI' && event.target.classList.contains('list-card')) {
        event.target.classList.add('active-card');
      }
    });
    this.container.addEventListener('mouseout', event => {
      if (event.target.tagName === 'LI'
        && event.target.classList.contains('list-card')
        && event.relatedTarget.tagName !== 'SPAN') {
        event.target.classList.remove('active-card');
      }
    });
  }

  mouseMoveCardEventListener() {
    document.querySelectorAll('li.list-card').forEach(e => {
      e.addEventListener('mousedown', event => {
        if (event.target.classList.contains('list-card')) {
          event.preventDefault();
          this.drawing = true;
          this.currentItem = event.target;

          this.shadowItem = this.currentItem.cloneNode(true);
          this.shadowItem.style.opacity = '0';
          this.shadowItem.classList.add('clone');

          this.currentItem.classList.add('dragged');
          this.currentItem.style.left = `${ event.pageX - this.currentItem.offsetWidth / 2 }px`;
          this.currentItem.style.top = `${ event.pageY - this.currentItem.offsetHeight / 2 }px`;

          this.container.addEventListener('mousemove', event => {
            event.preventDefault();
            if (this.drawing === true && this.currentItem) {
              this.currentItem.style.left = `${ event.pageX - this.currentItem.offsetWidth / 2 }px`;
              this.currentItem.style.top = `${ event.pageY - this.currentItem.offsetHeight / 2 }px`;

              const closestItem = document.elementFromPoint(event.clientX, event.clientY);
              if (closestItem.parentNode.classList.contains('list')) {
                closestItem.parentNode.querySelector('ul').insertAdjacentElement('beforeend', this.shadowItem);
              } else if (closestItem.tagName === 'LI' && !closestItem.classList.contains('clone')) {
                closestItem.insertAdjacentElement('afterend', this.shadowItem);
              } else if (closestItem.parentNode.classList.contains('list-items')) {
                closestItem.parentNode.insertAdjacentElement('beforeend', this.shadowItem);
              }
            }
          })

          this.container.addEventListener('mouseup', event => {
            event.preventDefault();
            const closestItem = document.elementFromPoint(event.clientX, event.clientY);
            if (this.drawing === true && this.currentItem) {
              if (closestItem.parentNode.classList.contains('list')) {
                this.cardMove(closestItem.parentNode.querySelector('ul'), event);
              } else if (closestItem.parentNode.classList.contains('list-items')) {
                this.cardMove(closestItem.parentNode, event)
              } else if (closestItem.tagName === 'LI' && !closestItem.classList.contains('clone')) {
                this.cardMove(closestItem, event);
              }
            }
          })
        }
      })
    })
  }

  cardMove(closestItem, event) {
    this.shadowItem.remove();
    closestItem.insertAdjacentElement('beforeend', this.currentItem);
    this.currentItem.classList.remove('dragged');
    this.currentItem.removeAttribute("style");
    this.currentItem = null;
    this.drawing = false;
    this.saveToLocalStorage();
  }

  creatColumns() {
    const section  = document.createElement('section');
    section.className = 'lists-container';
    this.container.insertAdjacentElement('beforeend', section);

    for (let column of this.columns) {
      const listContainer = document.createElement('div');
      listContainer.className = 'list'
      section.insertAdjacentElement('beforeend', listContainer);

      const header = document.createElement('h3');
      header.className = 'list-title';
      header.innerHTML = `${ column }`;
      listContainer.insertAdjacentElement('beforeend', header);

      const list = document.createElement('ul');
      list.className = 'list-items';
      listContainer.insertAdjacentElement('beforeend', list);
      listContainer.insertAdjacentHTML('beforeend', '<button class="add-card-btn btn">Add a card</button>');
    }
  }

  removeNewCardOpenedWindow() {
    const newCardOpenedWindow = document.querySelector('.new-card');
    if (newCardOpenedWindow) {
      newCardOpenedWindow.remove();
    }
  }

  createItemInput(listContainer) {
    this.removeNewCardOpenedWindow();
    listContainer.querySelector('UL').insertAdjacentHTML('beforeend', `
      <div class="new-card">
        <textarea class="card-textarea" placeholder="Ввести заголовок для этой карточки" style="overflow: hidden; word-wrap: break-word; height: 60px;"></textarea>
        <div>
          <input class="nch-button nch-button--primary confirm mod-compact js-add-card" type="submit" value="Добавить карточку">
          <a class="icon-lg icon-close dark-hover js-cancel close-add-new-card" href="#"></a>
        </div>
      </div>
    `)
  }

  createItem(text, column) {
    column.insertAdjacentHTML('beforeend', `
      <li class="list-card js-member-droppable ui-droppable">${ text }
        <span class="icon-lg icon-close list-card-operation dark-hover js-open-quick-card-editor js-card-menu"></span>
      </li>  
    `)
  }

  // localstorage
  saveToLocalStorage() {
    this.layers = [];
    document.querySelectorAll('div.list').forEach(e => {
      this.cards = [];
      let columnName = e.querySelector('H3').innerHTML;
      e.querySelectorAll('li').forEach(e => {
        this.cards.push(e.textContent);
      })
      this.layers.push([columnName, this.cards]);
    })
    localStorage.setItem('trello', JSON.stringify(this.layers));
  }

  loadFromLocalStorage() {
    try {
      const layers = JSON.parse(localStorage.getItem('trello'));
      if ( layers !== null ) {
        let columns = document.querySelectorAll('div.list');
        for (let layer of layers) {
          for (let column of columns) {
            if (column.querySelector('H3').innerHTML === layer[0]) {
              let columnList = column.querySelector('ul');
              for (let text of layer[1]) {
                this.createItem(text, columnList);
              }
            }
          }
        }
      }
    } catch(e) {
    }
  }
}
