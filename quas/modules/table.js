---
export(
  /*
  let t = new Table({
    name : "Name",
    age : "Age",
    type : "Make of Car"
  });
  t.addRow(data);
  */
  class Table{
    constructor(headings){
      this.headings = headings;
      this.rowData = [];

      this.structure = [];
      for(let i in headings){
        this.structure.push({
          key : i,
          title : headings[i],
          isDisabled : false
        });
      }
    }

    //add a row of data
    addRow(row){
      this.rowData.push(row);
    }

    //add an array of rows of data
    addRows(r){
      for(let i=0; i<r.length; i++){
        this.rowData.push(r[i]);
      }
    }

    //disable/enable a column
    setColumnDisabled(key, isDisabled){
      for(let i in this.structure){
        if(this.structure[i].key == key){
          this.structure[i].isDisabled = isDisabled;
          break;
        }
      }
    }

    /*
      add an opteration to a row.
      This isfor rows with data that is not a string or
      when you want to display something more than just text
    */
    addRowOperation(columnKey, func){
      for(let i in this.structure){
        if(this.structure[i].key == columnKey){
          this.structure[i].operation = func;
          break;
        }
      }
    }

    /*
      empties the current row data and adds the new data
    */
    setRows(rows){
      this.rowData = rows;
    }

    //empties the row data
    emptyRows(){
      this.rowData = [];
    }

    //accending by default
    sortBy(columnKey, isDecending){
      if(isDecending){
        this.rowData = this.rowData.sort((b, a) => {
          return a[columnKey].localeCompare(b[columnKey]);
        });
      }
      else{
        this.rowData = this.rowData.sort((a, b) => {
          return a[columnKey].localeCompare(b[columnKey]);
        });
      }
    }

    //generate the vdoms for the table heading and body
    gen(){
      let th = [];
      for(let i in this.structure){
        if(!this.structure[i].isDisabled){
          th.push(#<th>{this.structure[i].title}</th>);
        }
      }

      let head = [
        "thead", {}, [
          ["tr", {}, th, []]
        ], []
      ];

      let rows = [];

      for(let i in this.rowData){
        let data = [];
        for(let a in this.structure){
          if(!this.structure[a].isDisabled){
            let key = this.structure[a].key;
            let text;
            if(this.structure[a].operation !== undefined){
              text = this.structure[a].operation(this.rowData[i][key]);
            }
            else{
              text = this.rowData[i][key];
            }
            if(text === undefined){
              text = "";
            }
            data.push(#<td>{text}</td>);
          }
        }
        rows.push(["tr", {}, data, []]);
      }

      let body = [
        "tbody", {}, rows, []
      ];

      return [head, body];
    }
  }
);
