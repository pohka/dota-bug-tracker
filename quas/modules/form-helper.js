---
/*
form helper

helps get data from a form when submitted
*/
export({
  //prevents default and returns the data of all the form inputs
  onSubmit(e){
    e.preventDefault();
    return FormHelper.getData(e.target);
  },

  //returns the data for all the child nodes in the given form element
  getData(formEl){
    let result = {};
    for(let i=0; i<formEl.childNodes.length; i++){
      let node = formEl.childNodes[i];
      let data = FormHelper.getDataRecur(node);
      FormHelper.updateData(result, data);
    }

    return result;
  },

  //returns the input data of a node and also the gets data in the child nodes with recursion
  getDataRecur(node){
    let data = {};
    if(node.attributes && node.name !== undefined && node.name!=""){
      if(node.type == "checkbox"){
        if(node.checked){
          if(data[node.name] === undefined){
            data[node.name] = [node.value];
          }
          else{
            data[node.name].push(node.value);
          }
        }
      }
      else if(node.type == "radio"){
        if(node.checked){
          data[node.name] = node.value;
        }
      }
      else{
        data[node.name] = node.value;
      }
    }

    else if(node.childNodes.length > 0){
      for(let i=0; i<node.childNodes.length; i++){
        let nestedData = FormHelper.getDataRecur(node.childNodes[i]);
        FormHelper.updateData(data, nestedData);
      }
    }

    return data;
  },

  //updates the data with new data
  updateData(data, newData){
    for(let i in newData){
      //checkboxes edge case
      if(data[i] !== undefined && Array.isArray(newData[i])){
        for(let j=0; j<newData[i].length; j++){
          data[i].push(newData[i][j]);
        }
      }
      else{
        data[i] = newData[i];
      }
    }
  }
});
