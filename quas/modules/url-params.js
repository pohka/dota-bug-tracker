---
export({
  /**
    ---
    Returns the data from the url in as an object, it will also decode the URI
    ---
    @return {Object}

    ```
    // url: /home?key=val&foo=bar
    // => {key : "val", foo : "bar"}
    ```
  */
  get(){
    let str = window.location.search;
    if(str.charAt(0)=="?"){
      str = str.substr(1, str.length-1);
    }
    let variables = str.split("&");
    let data = {};
    for(let i = 0; i<variables.length; i++){
      if(variables[i]!==""){
        let item = variables[i].split("=");
        data[item[0]] = decodeURI(item[1]);
      }
    }
    return data;
  },

  /**
    ---
    Set or change variables in the url
    If the value == "" then the value is removed form the url
    By default the page won't reload the page unless the reload parameter is set to true

    Note: values will be encoded so they are allowed to have spaces
    ---

    @param {Object} values - new url values
    @param {Boolean} reload - (optional)


    ```
    //url: /home
    Quas.setUrlValues({
      name:"john"
    });
    //updated: /home?name=john

    Quas.setUrlValues({
      name:""
    });
    //updated: /home

    Quas.setUrlValues({
      search :"the mouse"
    });
    //updated: /home?search=the%20mouse
    ```
  */
  set(newVals, reload){
    let data = UrlParams.get();
    for(let key in newVals){
      data[key] = encodeURI(newVals[key]);
    }
    let str = "?";
    for(let key in data){
      if(data[key] != "")
        str += key + "=" + data[key] + "&";
    }
    str = str.slice(0,-1);

    if(reload){
      window.location = window.origin + window.location.pathname + str;
    }
    else if(history.pushState){
      let newurl = window.origin + window.location.pathname + str;
      if(newurl !== window.location.href){
        window.history.pushState(newVals,'',newurl);
      }
    }
  }
});
