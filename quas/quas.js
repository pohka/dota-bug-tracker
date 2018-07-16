/**
  # overview
  version : 1.0
*/


/**
  # class
  ---
  Super class for all components
  ---

  @prop {Object} props - All the properties for this component
  @prop {Boolean} isPure - If true the component won't update once mounted
  @prop {Element} dom - Root Element
  @prop {AST} vdom - Virtual dom for this component
  @prop {Object} events - all of the event listener functions
*/

class Component{
  /**
    # func
    @param {Object} props - All the properties for this component
  */
  constructor(props){
    if(props){
      this.props = props;
    }
    else{
      this.props = {}
    }
    this.isPure = false;
    if(typeof this.initTemplates == 'function'){
      this.initTemplates();
    }

    this._state = {};
    this.input = {};
    this.anims = {};
    let comp = this;

    //proxy to listen to the setting of state
    this.state = new Proxy(this._state, {
      set: function (target, key, value){
          //if there has a been a change, update render
          if(target[key] !== undefined && target[key] != value){
            target[key] = value;
            Quas.render(comp);
          }
          //initalizing a state
          else if(target[key] === undefined){
            target[key] = value;
          }

          return true;
      }
    });


  }

  addChildComponent(cls, props){
    if(!this.children){
      this.children = {};
    }
    if(!this.children[cls.constructor.name]){
      this.children[cls.constructor.name] = [new cls(props)];
    }
    else{
      this.children[cls.constructor.name].push(new cls(props));
    }
  }

  setStates(obj){
    let hasChange = false;
    for(let i in obj){
      if(!hasChange && this._state[i] !== undefined && this._state[i] != obj[i]){
        hasChange = true;
      }
        this._state[i] = obj[i];
    }

    if(hasChange){
      Quas.render(this);
    }
  }

  initStates(obj){
    for(let i in obj){
      this._state[i] = obj[i];
    }
  }

  addTemplate(key, callback){
    if(!this.templates){
      this.templates = {};
    }
    this.templates[key] = callback;
  }

  genTemplate(key, props, val){
    return this.templates[key](props, val);
  }


  /**
    # function
    ---
    Sets the properties and updates the component
    ---

    @param {Object} props - The properties to change or add

    ```
    myComp.setProps({
      name : "john",
      id : 123
    });
    ```
  */
  setProps(obj){
    for(let k in obj){
      this.props[k] = obj[k];
    }
  }


  /**
    ---
    Returns true if this component has been mounted to the DOM tree
    ---

    @return {Boolean}

    ```
    console.log(comp.isMounted()); //false;
    Quas.render(comp, "#app");
    console.log(comp.isMounted()); //true
    ```
  */
  isMounted(){
    return this.dom !== undefined;
  }

  /**
    # func
    Removes the component from the DOM tree
  */
  unmount(){
    if(this.dom){
      //animation exit
      if(Quas.hasModule("Animation") && this.anims.exit !== undefined){
        if(this.anims.exit.out === undefined){
          this.anims.exit.out = true;
        }

        Animation.play(this, "exit");

        let totalTime = this.anims.exit.duration;
        if(this.anims.exit.delay !== undefined){
          totalTime += this.anims.exit.delay;
        }
        //remove 30ms before the animation ends
        //this is to prevent flashing bug
        totalTime -= 0.03;

        setTimeout(()=>{
          this.dom.remove();
          this.dom = undefined;
          Quas.emitEvent("unmount", this);
        }, totalTime*1000);
      }
      //removing dom with no animation
      else{
        this.dom.remove();
        this.dom = undefined;
        Quas.emitEvent("unmount", this);
      }
    }
    //already removed dom
    else{
      this.vdom = undefined;
      Quas.emitEvent("unmount", this);
    }
  }

  mount(parent){
    this.dom = Quas.createElement(this.vdom, this);
    if(this.dom){
      //has enter animation
      if(Quas.hasModule("Animation") && this.anims.enter !== undefined){
        Animation.play(this, "enter");
      }

      parent.appendChild(this.dom);
    }
  }
}


/**
  # class - Quas
  ---
  Main Library
  ---

  @prop {Object} modules - all of the imported modules
  @prop {Array<Object>} customAttrs - the registered custom attributes
*/
const Quas = {



  /**
    ---
    Mounts a component to the DOM tree, however if the Component is already mounted it will update the component
    ---

    @param {Component} component - component to mount
    @param {String|Element} parent - the parent node


    ```
    //mount using the query selector (#id, .class, tag)
    Quas.render(myComp, "#app");

    //alternatively mount using a DOM Element
    let el = document.querySelector("#app");
    Quas.render(myComp, el);

    //update the component
    Quas.render(myComp);
    ```
  */
  render(comp, parent){
    //if parent passed is a query selector string
    if(parent && parent.constructor === String){
      parent = document.querySelector(parent);
    }


    /*
      first time rendering

      1. Get raw AST from the component
      2. Evaluate the custom attributes for the AST

      If the root should still be rendered
      3. Set the components vdom to the AST
      4. Create the DOM element for the component
      */
    if(!comp.isMounted() && parent !== null && parent){
      let rawVDOM = comp.render();
      if(rawVDOM === undefined){
        rawVDOM = "";
      }
      let shouldUse = Quas.evalVDOM(rawVDOM, comp);
      if(shouldUse){
        comp.vdom = rawVDOM;
        comp.mount(parent);
      }
    }

    //diff the vdom if mounted and not pure
    else if(comp.isMounted() && !comp.isPure){
      let newVDOM = comp.render();
      if(newVDOM === undefined){
        newVDOM = "";
      }
      let shouldUse = Quas.evalVDOM(newVDOM, comp);
      if(shouldUse){
        //root tag is different
        let hasDiff = Quas.diffRootVDOM(comp, comp.vdom, newVDOM);

        if(!hasDiff){
          Quas.diffVDOM(comp, comp.dom.parentNode, comp.dom, comp.vdom, newVDOM);
        }
        comp.vdom = newVDOM;
      }
      //root vdom has a false conditional
      else{
        comp.unmount();
      }
    }
  },

  /*
    ---
    diffs the root virtual dom
    returns true if a difference was found
    ---

     @param {Component} comp
     @param {AST} currentVDOM
     @param {AST} newVDOM

     @return {Boolean}
  */
  diffRootVDOM(comp, vdom, newVDOM){
    let hasDiff = false;


    if(newVDOM[0] != comp.vdom[0] || //diff tags
      Object.keys(vdom[1]).length != Object.keys(newVDOM[1]).length){ //diff attr count
      hasDiff = true;
    }

    //diff attrs value
    if(!hasDiff){
      for(let key in vdom[1]){
        if(!(newVDOM[1].hasOwnProperty(key) && vdom[1][key] == newVDOM[1][key])){
          hasDiff = true;
          break;
        }
      }
    }

    //swap out the root dom
    if(hasDiff){
      let newDOM = Quas.createElement(newVDOM, comp);
      comp.dom.parentNode.replaceChild(newDOM, comp.dom);
      comp.dom = newDOM;
    }
    return hasDiff;
  },

  /*
    ---
    recursively diffs the virtual dom of a component
    returns based on the changes to the real DOM tree:
    0 - if not change to the node
    1 - if added a node to the parent
    -1 - if this node was removed
    ---

     @param {Component} component
     @param {Element} parentNode
     @param {AST} currentVDOM
     @param {AST} newVDOM

     @return {Number}
  */
  diffVDOM(comp, parent, dom, vdom, newVDOM, ns){
    let returnVal = 0;

    if(newVDOM === undefined){
      if(parent && dom){
        parent.removeChild(dom);
      }
      return -1;
    }

    //text node
    if(!Array.isArray(newVDOM)){
      if(vdom === undefined){
        let text = document.createTextNode(newVDOM);
        parent.append(text);
        returnVal = 1;
      }
      else if(vdom != newVDOM){
        parent.replaceChild(document.createTextNode(newVDOM), dom);
      }
      return returnVal;
    }

    if(!ns){
      ns = Quas.namespace[newVDOM[0]];
    }
    let isInNS = (ns !== undefined);

    //old vdom is text node and new vdom is not a text node
    if(vdom !== undefined && vdom.constructor == String && newVDOM.constructor != String){
      let newDOM = Quas.createElement(newVDOM, comp, undefined, ns);
      parent.replaceChild(newDOM, dom);
      return returnVal;
    }

    //old vdom doesn't have this new dom element
    if(vdom === undefined){
      let newDOM = Quas.createElement(newVDOM, comp, undefined, ns);
      parent.appendChild(newDOM);
      returnVal = 1;
      return returnVal;
    }
    else{
      //diff tags
      if(vdom[0] != newVDOM[0]){
        let newDOM = Quas.createElement(newVDOM, comp, undefined, ns);
        if(!dom){
          parent.appendChild(newDOM);
          returnVal = 1;
        }
        else{
          parent.replaceChild(newDOM, dom);
        }
        return returnVal;
      }
      //same tag
      else{

        //clone attrs to keep track of newly added attrs
        let newAttrs = {};
        for(let a in newVDOM[1]){
          newAttrs[a] = newVDOM[1][a];
        }

        for(let a in vdom[1]){
          let prefix = a.substr(0,2);
          let isEvent = (prefix == "on");

          //removed attribute a
          if(newVDOM[1][a] === undefined){
            if(isEvent){
              let eventNames = a.substr(3).split("-");
              for(let e in eventNames){
                dom.removeEventListener(eventNames[e], comp.events[eventNames[e]]);
                delete comp.events[eventNames[e]];
              }
            }
            else{
              dom.removeAttribute(a);
            }
          }
          else{
            //diff attribute value
            if(vdom[1][a] != newVDOM[1][a]){
              //event
              if(isEvent){
                let eventNames = a.substr(3).split("-");
                for(let e in eventNames){
                  if(vdom[1][a] != newVDOM[1][a]){
                    dom.removeEventListener(eventNames[e], comp.events[eventNames[e]]);
                     comp.events[eventNames[e]] = (mouseEvent)=>{
                       return Quas.eventCallback(mouseEvent, newVDOM[1][a], comp);
                     };
                    dom.addEventListener(eventNames[e], comp.events[eventNames[e]]);
                  }
                }
              }
              //basic attribute
              else{
                dom.setAttribute(a, newVDOM[1][a]);
              }
            }
          }
          delete newAttrs[a];
        }
        //all the newly added attributes
        for(let a in newAttrs){
          if(a != 0){
            let prefix = a.substr(0,2);
            let isEvent = (prefix == "on");

            if(isEvent){
              let eventNames = a.substr(3).split("-");
              for(let e in eventNames){
                comp.events[eventNames[e]] = (mouseEvent)=>{
                  return Quas.eventCallback(mouseEvent, newAttrs[a], comp);
                };
                dom.addEventListener(eventNames[e], comp.events[eventNames[e]]);
              }
            }
            else{
              dom.setAttribute(a, newAttrs[a]);
            }
          }
        }
      }
    }

    //children
    if(dom && returnVal > -1){
      let oldChildren;
      if(vdom !== undefined){
        oldChildren = vdom[2];
      }
      let newChildren;
      if(newVDOM !== undefined){
        newChildren = newVDOM[2];
      }
      let change = 0;
      for(let c=0; (newVDOM && newVDOM[2] && c<newVDOM[2].length) || (vdom && vdom[2] && c<vdom[2].length); c++){
        let nextOldChild;
        if(oldChildren !== undefined && c < oldChildren.length){
          nextOldChild = oldChildren[c];
        }
        let nextNewChild;
        if(newChildren !== undefined){
          nextNewChild = newChildren[c];
        }
        let nextDOM;

        if(dom.childNodes !== undefined){
          nextDOM = dom.childNodes[c+change];
        }

        change += Quas.diffVDOM(comp, dom, nextDOM, nextOldChild, nextNewChild, ns);
      }
    }
    return returnVal;
  },

  eventCallback(e, val, comp){
    let deliIndex = val.indexOf(":");
    if(deliIndex > -1){
      let funcName = val.substr(0, deliIndex);
      let arg = val.substr(deliIndex+1);
      return comp[funcName](e, arg);
    }
    else{
      return comp[val](e);
    }
  },

  /**
    ---
    Creates a DOM Element using the vdom and adds it as a child to the parent.
    When called the parent parameter should be undefined
    ---

    ```
    Quas.createElement(vdom, comp);
    ```

    @param {AST} vdom - description of the element
    @param {Component} component - the component of the vdom
    @param {String|Element|undefined} parent - (exclude) parent vdom node

    @return {Element|String}
  */
  createElement(vdom, comp, parent, ns){
    //if a text node
    if(!Array.isArray(vdom)){
      if(!parent){
        return document.createTextNode(vdom);
      }
      else{
        parent.appendChild(document.createTextNode(vdom));
        return;
      }
    }

    let tag = vdom[0];
    let attrs = vdom[1];
    let children = vdom[2];
    let root, action;

    //dealing with namespaces for svg and html tags
    if(!ns){
      ns = Quas.namespace[tag];
    }
    let isInNS = (ns !== undefined);

    let el
    if(!isInNS){
      el = document.createElement(tag);
    }
    else{
      el = document.createElementNS(ns, tag);
    }


    //attributes
    for(let a in attrs){

      let prefix = a.substr(0,2);

      //event
      if(prefix == "on"){
        let eventNames = a.substr(3).split("-");
        if(!comp.events){
          comp.events = {};
        }
        for(let i in eventNames){
          comp.events[eventNames[i]] = (e)=>{
            return Quas.eventCallback(e, attrs[a], comp);
          };

          el.addEventListener(eventNames[i], comp.events[eventNames[i]]);
        }
      }
      //basic attr
      else{
        if(!isInNS){
          el.setAttribute(a, attrs[a]);
        }
        else{
          el.setAttributeNS(null, a, attrs[a]);
        }
      }
    }

    //link target = push
    if(Quas.hasModule("Router") && tag == "a" && attrs.target == "push"){
      //add on click eventlistener
      el.addEventListener("click", function(e){
        if(this.target && this.target == "push"){
          e.preventDefault();
          let path = this.href.replace(window.location.origin, "");
          let route = Router.findRouteByPath(path);
          if(!route && Router.route404){
            route = Router.route404;
            route.fullpath = path;
          }
          Router.push(route);
        }
      });
    }

    //children
    if(children !== undefined){
      for(let i=0; i<children.length; i++){
        let child = Quas.createElement(children[i], comp, el, ns);
        if(child !== undefined){
          el.appendChild(child);
        }
      }
    }

    return el;
  },

  /**
    # func
    ---
    An asynchronous HTTP request (AJAX)

    format of request object:
    {
      url : "myfile.php",
      type : "GET|POST",
      data : {
        key : "value"
      },
      return : "json|xml",
      success : (result)=>{},
      error : (Error) => {}
    }
    ---

    @param {Object} requestData - request data

    ```
    //most basic use to log the contents of a file
    Quas.ajax({
      url : "/myfile.txt",
      success : (result) => {
        console.log(result);
      }
    });

    //requesting and displaying a json file
    Quas.ajax({
      url : "/myfile.json",
      type : "GET", //GET is the default request type
      return : "json", //return type
      success : (data) => { //callback
        //data is a json object
        for(let i in data){
          console.log(data[i]);
        }
      },
      error : (err) => { //error callback
        console.error(err);
      }
    });

    //post request example for loading an article by id
    Quas.ajax({
      url : "/findArticle.php",
      type : "POST",
      data : {
        articleID : "1234"
      },
      return : "json", //return type
      success : (data) => { //callback
        console.log(data.author);
        console.log(data.text);
      },
      error : (err) => { //error callback
        console.error(err);
      }
    });
    ```
  */
  ajax(req){
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          if(req.success!==undefined){
            let result;
            if(req.return === undefined){
              result = this.responseText;
            }
            else{
              let returnType = req.return.toLowerCase();
              switch(returnType){
                case "json" :
                  try {
                    result = JSON.parse(this.responseText);
                  } catch(e){
                    result = "Failed to parse return text to JSON:\n" + this.responseText;
                  }
                  break;
                case "xml" :
                  try{
                    result = new DOMParser().parseFromString(this.responseText,"text/xml");
                  } catch(e){
                    result = "Failed to parse return text to XML:\n" + this.responseText;
                  }
                  break;
              }
            }

            req.success(result);
          }
        }
        else if(this.readyState == 4){
          if(req.error !== undefined){
            req.error(this);
          }
        }
    };
    let str = req.url + "?";
    let kvs = "";
    if(req.data!==undefined){
      for(let key in req.data){
        kvs += key + "=" + encodeURIComponent(req.data[key]) + "&"
      }
      kvs = kvs.slice(0,-1);
    }

    //post requests
    if(req.type == "POST"){
      xhr.open(req.type, req.url, true);
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      xhr.send(kvs);
    }
    //get requests
    else{
      if(!req.type){
        req.type = "GET";
      }
      xhr.open(req.type, req.url + "?" + kvs, true);

      //file uploading
      if(req.data !== undefined && req.data.constructor === FormData){
        xhr.send(req.data);
      }
      else{
        xhr.send();
      }
    }
  },



  /**
    # function
    ---
    fetch a resouce asynchronously, similar to Quas.ajax but it uses the fetch api with a promise
    if the file fails to load, it will throw an error
    ---

    @param {String} url - url to the resource
    @param {String} type - (optional) text, json, blob, buffer
    @param {Object} requestData - (optional) data for the request


    ```
    // Request data format, Default options are marked with *
    {
      body: JSON.stringify(data), // must match 'Content-Type' header
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, same-origin, *omit
      headers: {
        'user-agent': 'Mozilla/4.0 MDN Example',
        'content-type': 'application/json'
      },
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, cors, *same-origin
      redirect: 'follow', // manual, *follow, error
      referrer: 'no-referrer', // *client, no-referrer
    }

    //fetch and log a text file
    Quas.fetch("/myfile.txt")
      .then((result) = >{
        console.log("myfile.txt:" + result);
      })
      .catch((err) => console.error(err));

    //fetch a json file
    Quas.fetch("/myfile.json", "json")
      .then((data) =>{
        console.log("key count: " + Object.keys(data).length);
      })
      .catch((err) => console.error(err));
    ```
  */
  fetch(url, type, req){
    return fetch(url, req)
      .then((response) => {
        if (!response.ok) return new Error(response);

        if(!type || type == "text"){
          return response.text();
        }
        else if(type == "json"){
          return response.json();
        }
        else if(type == "blob"){
          return response.blob();
        }
        else if(type == "buffer"){
          return response.arrayBuffer();
        }
    });
  },

  /*
    ---
    Evaluates all the custom attributes for this vdom and also for of it's child nodes.
    This function should be called before Quas.createElement() as
    the component.render() just returns the raw AST and the custom attributes
    can modifiy this node and it's children

    Returns false if the root vdom shouldn't be rendered
    ---

    @param {AST} rootVDOM
    @param {Component} component

    @return {Boolean}
  */
  evalVDOM(rootVDOM, comp){
    //not a root vdom
    if(Array.isArray(rootVDOM)){

      //ignore all conditional statements for rootVDOM

      for(let a=0; a<rootVDOM[3].length; a++){
        Quas.evalCustomAttr(rootVDOM[3][a], rootVDOM, comp);
      }
      Quas.evalVDOMChild(rootVDOM, comp);
    }
    return true;
  },

  /*
  ---
  Recursively evaluates all the child nodes for the given vdom
  ---

  @param {AST} vdom
  @param {Component} component

  */
  evalVDOMChild(vdom, comp){
    //will be true if a true conditional statement has been found in this block
    let isConditionSolved = false;
    let removedChild;

    //loop through all the children of the given vdom
    for(let a=0; a<vdom[2].length; a++){
       removedChild = false;
      //not a text node
      let child = vdom[2][a];
      if(Array.isArray(child)){
        //remove any unused conditional statement blocks
        let condition = child[4];
        if(condition !== undefined){
          //q-if
          if(condition.key == "if"){
            //if statement block opened
            if(condition.val){
              isConditionSolved = true;
            }
            //false if statement
            else{
              isConditionSolved = false;
              removedChild = true;
              vdom[2].splice(a,1);
              a -= 1;
            }
          }
          //q-else-if
          else if(condition.key == "else-if"){
            //already solved
            if(isConditionSolved){
              removedChild = true;
              vdom[2].splice(a,1);
              a -= 1;
            }
            //not solved yet
            else{
              //else-if statement is true
              if(condition.val){
                isConditionSolved = true;
              }
              //else-if statement is false
              else{
                removedChild = true;
                vdom[2].splice(a,1);
                a -= 1;
              }
            }

          }
          //q-else
          //remove else statement if a condition has been solved
          else if(condition.key == "else" && isConditionSolved){
            removedChild = true;
            isConditionSolved = true;
            vdom[2].splice(a,1);
            a -= 1;
          }
        }

        //otherwise evaluate the childs custom attrs
        if(!removedChild){
          //if keeping this vdom
          for(let b=0; b<child[3].length; b++){
            Quas.evalCustomAttr(child[3][b], child, comp);
          }

          Quas.evalVDOMChild(child, comp);
        }
      }
    }
  },

  /*
    ---
    Evaluates a custom attribute and returns the action to take
    -1 : don't render the current vdom node
    0 : do nothing

    ---

    @param {String} key - the key name of the attr
    @param {String|?} data - the value of the attr
    @param {Array} parentVDOM - the vdom of this node
    @param {Component} component - the componet of this custom attribute
    @param {Element} dom - the com of the component

    @return {Number}


  */
  evalCustomAttr(attr, parentVDOM, comp){
    let arr = attr.key.split("-");
    let data = attr.val;
    let command = arr[0];
    let params = arr.slice(1);
    let children = [];

    //creates multiple child nodes of the given type
    //q-for-li=["item 1","item 2"]
    if(command == "for"){
      for(let i in data){
        let vdom = [params[0], {}, [], []];
        if(params.length == 1){
          vdom[2].push(data[i]);
          parentVDOM[2].push(vdom);
        }
        else if(params.length == 2){
          for(let j in data[i]){
            vdom[2].push([ params[1], {}, [ data[i][j] ], [] ]);
          }
          parentVDOM[2].push(vdom);
        }
      }
    }
    else if(command == "template"){
      if(params[0] && params[0] == "for"){
        for(let i=0; i<data[1].length; i++){
          let child;
          if(data[2]){
            child = comp.genTemplate(data[0], data[1][i], data[2]);
          }
          else{
             child = comp.genTemplate(data[0], data[1][i]);
          }

          if(child){
             parentVDOM[2].push(child);
          }
        }
      }
      else{
        let child = comp.genTemplate(data[0], data[1]);
        parentVDOM[2].push(child);
      }
    }

    //calls a function and passes the variable as a param
    else if(command === "bind"){
      if(params[0] === undefined){
        let vdom = data[0](data[1]);
        parentVDOM[2].push(vdom);
      }
      //bind-for, call the function for each variable in the array
      else if(params[0] === "for"){
        for(let o in data[1]){
          let vdom = data[0](data[1][o]);
          parentVDOM[2].push(vdom);
        }
      }
    }

    //appends or prepend a node or an array of nodes
    else if(command == "append" || command == "prepend"){
      //if a single node
      if( data.constructor == String ||
          (data[1] !== undefined && data[1].constructor == Object)){
            //append a single node
            if(command == "append"){
              parentVDOM[2].push(data);
            }
            //prepend a single node
            else{
              parentVDOM[2].unshift(data);
            }
       }
       else{
         //append array
         if(command == "append"){
           for(let i=0; i<data.length; i++){
               parentVDOM[2].push(data[i]);
           }
         }
         //prepend array
         else{
           for(let i=data.length-1; i>-1; i--){
               parentVDOM[2].unshift(data[i]);
           }
         }
       }
    }

    else if(command == "input"){
      if(comp.input[data] === undefined){
        comp.input[data] = "";
      }

      if(comp.onStoreInput === undefined){
        comp.onInputChanged = function(e, key){
          console.log(key);
         comp.input[key] = e.target.value;
         Quas.render(comp);
        };
      }
      parentVDOM[1]["on-change-keyup"] = "onInputChanged:" + data;

    }
    //developer designed custom attr
    else{
      Quas.customAttrs[command](params, data, parentVDOM, comp);
    }
  },

  /**
    ---
    Returns an object with the browser info:
      - name : browser name,
      - version : browser version,
      - isMobile : true if a mobile browser

    Note: the isMobile variable might not be 100% accurate
    ---

    @return {Object}
  */
  getBrowserInfo(){
    var ua=navigator.userAgent,tem,M=ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if(/trident/i.test(M[1])){
        tem=/\brv[ :]+(\d+)/g.exec(ua) || [];
        return {name:'IE ',version:(tem[1]||'')};
        }
    if(M[1]==='Chrome'){
        tem=ua.match(/\bOPR\/(\d+)/)
        if(tem!=null)   {return {name:'Opera', version:tem[1]};}
        }
    M=M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
    if((tem=ua.match(/version\/(\d+)/i))!=null) {M.splice(1,1,tem[1]);}
    return {
      name: M[0],
      version: M[1],
      isMobile : /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    };
  },




  /**
  # func
  ---
  Returns true if using the router module
  ---

  @return {Boolean}
  */
  hasModule(name){
    return (typeof Quas.modules[name] !== "undefined");
  },

  addListener(obj, eventName){
    if(!Quas.eventListeners[eventName]){
      Quas.eventListeners[eventName] = [obj];
    }
    else{
      Quas.eventListeners[eventName].push(obj);
    }
  },

  emitEvent(eventName, val){
    for(let i in Quas.eventListeners[eventName]){
      Quas.eventListeners[eventName][i].onEvent(eventName, val);
    }
  }
}

Quas.customAttrs = {}; //custom attributes
Quas.modules = {}; //container for all the modules
Quas.eventListeners = {}; //a collection of objects listening to events
Quas.namespace = {
  svg : "http://www.w3.org/2000/svg",
  html : "http://www.w3.org/1999/xhtml"
};


//calls the ready function once the document is loaded
document.addEventListener("DOMContentLoaded", function(event) {
  if(typeof ready === "function" && typeof Dev == "undefined"){
    ready();
  }
});
