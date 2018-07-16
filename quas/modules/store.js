---
//shared storage
export({
  data : {},
  _state : {},
  observers : {},
  observerCount : 0,

  init(){
    Quas.addListener(Store, "unmount");

    //observe prototype function for components
    Component.prototype.observe = function(state){
      this.observerID = Store.observerCount;
      Store.observerCount++;
      if(!Store.observers[state]){
        Store.observers[state] = [this];
      }
      else{
        Store.observers[state].push(this);
      }
    }

    //proxy for overriding state setter
    Store.state = new Proxy(Store._state, {
      set: function (target, key, value){
          //if there has a been a change, update render
          if(target[key] !== undefined && target[key] != value){
            target[key] = value;
            Store.emitStateChange(key);
          }
          //initalizing a state
          else if(target[key] === undefined){
            target[key] = value;
          }

          return true;
      }
    });
  },

  //emits the state change to all the observers
  emitStateChange(stateName){
    for(let i in Store.observers[stateName]){
      Quas.render(Store.observers[stateName][i]);
    }
  },

  //triggered by unmount event
  //removes observer when they are unmounted
  onEvent(eventName, comp){
    if(comp.observerID === undefined || eventName != "unmount") return;

    for(let state in Store.observers){
      for(let i=0; i<Store.observers[state].length; i++){
        if(comp.observerID == Store.observers[state][i].observerID){
          Store.observers[state].splice(i,1);
          i-=1;
        }
      }
    }
  }
});
