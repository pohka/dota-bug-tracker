---
export({
  //keys is a string array
  Enum(keys){
    let obj = {};
    for(let i=0; i<keys.length; i++){
      obj[keys[i]] = i;
    }
    Object.freeze(obj);
    return obj;
  }
})
