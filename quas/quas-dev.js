/*
This script is used for transpiling and bundling development builds
For production use a static build and remember to remove links to this script
*/

/*
  Object to help manipulate the (AST) Abstract Syntax Tree data of the vdom

structure of vdom:
 ["tag", { key, "val" }, [], []]
 [ tag, attrs, children, customAttrs]
 */
const VDOM = {
  /**
    ---
    returns the tag of the given vdom
    ---

    @param {AST} vdom

    @return {String}
  */
  tag(vdom){
    return vdom[0];
  },
  /**
    ---
    returns the attributes for the given vdom
    ---

    @param {AST} vdom

    @return {Object}
  */
  attrs(vdom){
    return vdom[1];
  },

  /**
    ---
    returns all the child nodes of the given vdom
    ---

    @param {AST} vdom

    @return {Array<AST|String>}
  */
  childNodes(vdom){
    return vdom[2];
  },

  /**
    ---
    Adds a child node to the given AST
    ---

    @param {AST} vdom
    @param {AST|String} child
  */
  addChild(vdom, childNode){
    vdom[2].push(childNode);
  },
  /**
    ---
    returns the last child node of the given AST
    ---

    @param {AST} vdom

    @return {AST|String}
  */
  getLastChild(vdom){
    return vdom[2][vdom[2].length-1];
  },
  /**
    ---
    creates a vdom AST
    ---

    ```
    //equivilant of: <div id="myid"></div>
    VDOM.createNode("div", { id : "myid" });
    ```

    @param {String} tag
    @param {Object} attributes - (optional)
    @param {Array<Object>} children - (optional)
    @param {Array<Object>} customAttrs - (optional) key, value

    @return {AST}
  */
  createNode(tag, attrs, children, customAttrs){
    if(!attrs){
      attrs = {};
    }
    if(!children){
      children = [];
    }
    if(!customAttrs){
      customAttrs = [];
    }
    let node = [tag, attrs, children, []];
    for(let i=0; i<customAttrs.length; i++){
      let attr = {
        key : customAttrs[i].key.replace(/q-/, ""),
        val : customAttrs[i].val
      };
      if(attr.key == "if" || attr.key == "else" || attr.key == "else-if"){
        node[4] = attr;
      }
      else{
        node[3].push(attr);
      }
    }
    return node;
  },

  /**
    ---
    returns true if the vdom node passed is a text node
    ---

    @param {AST|String} vdom

    @return {Boolean}
  */
  isTextNode(vdom){
    return !Array.isArray(vdom);
  },

  /**
  ---
  returns the custom attributes for the given vdom AST
  ---

  @param {AST} vdom

  @return {Array<Object>}
  */
  customAttrs(vdom){
    return vdom[3];
  },

  addCustomAttr(vdom, key, val){
    let attr = {
      key : key.replace(/q-/, ""),
      val : val
    };

    if(attr.key == "if" || attr.key == "else" || attr.key == "else-if"){
      vdom[4] = attr;
    }
    else{
      vdom[3].push(attr);
    }
  },

  /**
    ---
    Returns the conditional custom attribute i.e. q-if
    ---

    @param {AST} vdom

    @return {Object}
  */
  condition(vdom){
    return vdom[4];
  }
}


const Dev = {};

//tags that require no closing tag
Dev.noClosingTag = ["img", "source", "br", "hr", "area", "track", "link", "col", "meta", "base", "embed", "param", "input"];

//all he imported files
Dev.imports = {
  "js" : {
    content : [],
    importsLeft : 0,
  }
};

Dev.bundle = {};

Dev.customAttrsValueIsString = ["input"];

/*
  ---
  Transpiles a JavaScript file with HTML syntax into thr AST syntax
  ---

  @param {String} fileContents

  @return {String}
*/
Dev.transpile = (bundle) => {
  let lines = bundle.split("\n");

  let inCommentBlock = false;
  let result = "";
  let quoteRegex = /"(.*?)"|`(.*?)`|'(.*?)'/;
  let hasCommentBlockChange;
  let inHtmlBlock = false;
  let hasHtmlBlockChanged = false;
  let htmlText = "";
  let vdom;
  let depth = 0;

  let tagContent = "";
  let inMultiLineTag = false;
  let prevLine = "";
  let lastLineWasEmpty = false;


  for(let i=0; i<lines.length; i++){
    let lineContents = lines[i].split(quoteRegex).join(" ");
    let hasCommentBlockChange = false;
    let curLine = "";


    //remove comment block
    if(!inCommentBlock && lineContents.indexOf(/\/\*(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/) > -1){
      let arr = lines[i].split(/\/\*(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/);
      curLine += arr[0];
      inCommentBlock = true;
      hasCommentBlockChange = true;
    }
    if(inCommentBlock && lineContents.indexOf(/\*\/(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/) > -1){
      let arr = lines[i].split(/\*\/(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/);
      curLine += " " + arr[1];
      inCommentBlock = false;
      hasCommentBlockChange = true;
    }

    //no code blocks, so just use the raw line
    if(!hasCommentBlockChange){
      curLine = lines[i];
    }

    if(!inCommentBlock){
      //remove end of line comment
      curLine = prevLine.split(/\/\/(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/)[0] + curLine.split(/\/\/(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/)[0];
      prevLine = "";

      //find start of html parse
      if(!inHtmlBlock && curLine.indexOf("#<") > -1){
        depth = 0;
        inHtmlBlock = true;
        //add js to result
        let arr = curLine.split("#<");
        result += arr[0];
        htmlString = "";

        curLine = "<" + arr[1];
        hasHtmlBlockChanged = true;
      }

      if(inHtmlBlock){
        let curLineNoQuotes = curLine.replace(new RegExp(quoteRegex, "g"), "");
        let change = 0;

        let openBrackets = Dev.matchesForBracket(curLineNoQuotes, "<");
        change += openBrackets;
        let closeBrackets = Dev.matchesForBracket(curLineNoQuotes, ">");
        change -= closeBrackets;

        //has at least 1 full tag on this line
        if(change == 0 && openBrackets > 0 && closeBrackets > 0){
          let tags = curLineNoQuotes.match(/<.*?>/g);

          if(tags){
            for(let t=0; t<tags.length; t++){
              let tagName = tags[t].substr(1, tags[t].length-2).split(/\s/)[0];
              //dont count for when no closing tag is required
              if(Dev.requiresClosingTag(tagName)){
                //is closing
                if(tags[t].charAt(1) == "/"){
                  //if using closing tag when no required
                  if(Dev.requiresClosingTag(tagName.substr(1))){
                    depth -= 1;
                  }
                }
                //is opening
                else{
                  depth += 1;
                }
              }
            }
            if(tags.length > 1 && depth == 0){
              hasHtmlBlockChanged = false;
            }
          }
          htmlString += curLine;
        }
        else if(change > 0){
          tagContent = Dev.getStringAfterLastOpenBraket(curLine);
          inMultiLineTag = true;
        }
        //in multiline tag
        else if(inMultiLineTag){

          //end of multiline
          if(change < 0){
            inMultiLineTag = false;
            //split curline by end of multiLine tag
            let arr = Dev.splitByEndMultiLineTag(curLine);

            //add tag content for multiline tag
            htmlString += tagContent + arr[0] + ">";

            //add the rest on the prevLine
            prevLine = arr[1];
            tagContent = "";
            depth += 1;
          }
          //within multiline tag, but not ending on this line
          else{
            tagContent += curLine;
          }
        }
        else if(!inMultiLineTag && change == 0){
          htmlString += curLine
        }

        //end of html block
        if(!inMultiLineTag && depth <= 0 && !hasHtmlBlockChanged){
          result += Dev.transpileHTMLBlock(htmlString);
          let els = lines[i].split(/<\/.*?>/);
          if(els.length > 0){
            result += els[els.length-1];
          }

          inHtmlBlock = false;
        }
        if(hasHtmlBlockChanged){
          hasHtmlBlockChanged = false;
        }
      }
      //add curLine, but dont allow multiple empty lines
      else {
        if(curLine.trim().length == 0){
          if(!lastLineWasEmpty){
            lastLineWasEmpty = true;
            result += "\n";
          }
        }
        else{
          lastLineWasEmpty = false;
          result += curLine + "\n";
        }
      }
    }
  }
  return result;
}

/*
  ---
  Takes a string with html syntax and returns a valid js array matching the vdom AST
  ---

  @param {String} html

  @return {String}
*/
Dev.transpileHTMLBlock = (html) => {
  let res = Dev.convertHTMLStringToVDOM(html);
  return Dev.stringifyVDOM(res, 1);
}


/*
  ---
  Converts a html string to a vdom AST
  ---

  @param {String} html

  @return {AST}
*/
Dev.convertHTMLStringToVDOM = (html) =>{
  let inQuote = false;
  let quoteType;
  let char, lastChar = "";
  let tagContent = "";
  let insideTag = false;
  let hasEndedTag = false;
  let text = "";
  let parent;
  let root;
  const escapeChars = ["<", ">"];
  let changedToQuote = false;

  const states = Object.freeze({
      other : 0,
      insideTag : 1,
    });
  let state  = states.other;
  let depth = 0;

  for(let i=0; i<html.length; i++){
    hasEndedTag = false;
    changedToQuote = false;

    char = html.charAt(i);
    if(!inQuote && lastChar != "\\" && char.match(/"|'|`/)){
      inQuote = true;
      quoteType = char;
      changedToQuote = true;
    }

    //parse tags
    if(!inQuote){
      //start of tag
      if(char == "<" && lastChar != "\\"){
        state = states.insideTag;
        tagContent = "";

        //add text node before new child node
        let trimmed = text.trim();
        if(trimmed.length > 0){
          VDOM.addChild(parent, text);
        }
        text = "";
      }
      //end of tag
      else if(char == ">" && lastChar != "\\"){
        let tagVDOM = Dev.tagStringToVDOM(tagContent);
        state = states.other;
        hasEndedTag = true;

        //end of opening tag
        if(tagVDOM){

          if(Dev.requiresClosingTag(VDOM.tag(tagVDOM))){
            depth++;
            //add root tag
            if(!root){
              root = tagVDOM
              parent = root;
            }
            //add child tag and set new parent
            else{
              VDOM.addChild(parent, tagVDOM);
              parent = parent[2][parent[2].length-1];
            }
          }
          //no closing tag required
          else{
            VDOM.addChild(parent, tagVDOM);
          }
        }
        //end of closing tag
        else{
          let tagName = tagContent.substr(tagContent.indexOf("/") + 1).trim();

          //set parent to parent node
          if(Dev.requiresClosingTag(tagName)){

            //add text node before end of node
            let trimmed = text.trim();
            if(trimmed.length > 0){
              VDOM.addChild(parent, text);
            }
            text = "";

            depth -= 1;

            //end of root tag
            if(depth == 0){
              break;
            }
            else{
              parent = root;
              for(let d=1; d<depth; d++){
                parent = VDOM.getLastChild(parent); //last child
              }
            }
          }
        }
      }

      //inside tag text e.g. div id="myID"
      else if(state == states.insideTag){
        tagContent += char;
      }
    }

    //keep track of text between tags
    if(state == states.other && !hasEndedTag){
      //check if escapable character
      if(escapeChars.indexOf(char) > -1 && lastChar == "\\"){
          text = text.slice(0, -1);
      }
      text += char;
    }


    if(inQuote){
      tagContent += char;
    }

    if(inQuote && !changedToQuote && char == quoteType && lastChar != "\\"){
      inQuote =false;
    }

    lastChar = char;
  }

  return root;
}


/*
  ---
  Converts a vdom AST to String
  ---

  @param {AST} vdom
  @param {Number} startingTabs

  @return {String}
*/
Dev.stringifyVDOM = (vdom, tabs, isChild) => {
  if(!Array.isArray(vdom)){
    let res = Dev.parseProps(vdom.trimExcess())
    return Dev.tabs(tabs) + res;
  }
  let str = "";
  str += Dev.tabs(tabs) + "[\n";
  str += Dev.tabs(tabs + 1) + "\"" + VDOM.tag(vdom) + "\",\n";

  //attributes
  let attrs = VDOM.attrs(vdom);
  let attrCount = Object.keys(attrs).length;
  let children = VDOM.childNodes(vdom);
  let customAttrs = VDOM.customAttrs(vdom);
  let condition = VDOM.condition(vdom);

  if(attrCount == 0 && children.length == 0 && customAttrs.length == 0 && condition === undefined){
    str += "{}, [], []";
  }
  else{
    if(attrCount == 0){
      str += Dev.tabs(tabs + 1) + "{},\n";
    }
    else{
      str += Dev.tabs(tabs + 1) + "{\n";
      let count = 0;

       //collects the shorthand class attributes and appends them at the end of the attribute loop
      let classesShorthand = [];
      let hasShortHand = false;

      for(let a in attrs){
        let val;
        let key = a;
        hasShortHand = false;
        let firstChar = key.charAt(0);
        //pattern attr edge case
        if(a == "pattern"){
          val = "\"" + attrs[a] + "\"";
        }
        //#id
        else if(firstChar == "#"){
          val = "\"" + key.substr(1) + "\"";
          key = "id";
        }
        //.class
        else if(firstChar == "."){
          classesShorthand.push(key.substr(1));
          hasShortHand = true;
        }
        else{
          if(attrs[a] == "\"\""){
            val = attrs[a];
          }
          else{
            val = Dev.parseProps(attrs[a]);
          }
        }

        if(val !== undefined){
          str += Dev.tabs(tabs + 2) + "\"" + key + "\":" + val;
        }
        count++;
        if(count != attrCount && !hasShortHand){
          str += ",\n";
        }
      }

      //add the shorthand classes
      if(classesShorthand.length > 0){
        let val = classesShorthand.join(" ");
        if(count - classesShorthand.length > 0){
          str += ",\n";
        }
        str += Dev.tabs(tabs + 2) + "\"class\":\"" + val + "\"";
      }


      str += "\n" + Dev.tabs(tabs + 1) + "},\n";
    }

    //child nodes
    if(children.length == 0){
      str += Dev.tabs(tabs + 1) + "[],\n";
    }
    else{
      str += Dev.tabs(tabs + 1) + "[\n";
      for(let i=0; i<children.length; i++){
        str += Dev.stringifyVDOM(children[i], tabs+2, true);
        if(i < children.length-1){
          str +=  ",\n";
        }
      }
      str += "\n" + Dev.tabs(tabs + 1) + "],\n"; //close child nodes
    }


    //custom attributes
    if(customAttrs.length == 0){
      str += Dev.tabs(tabs + 1) + "[]\n";
    }
    else{
      str += Dev.tabs(tabs + 1) + "[\n";

      for(let i=0; i<customAttrs.length; i++){
        if(customAttrs[i].val == ""){
          customAttrs[i].val = "\"\"";
        }

        str +=  Dev.tabs(tabs + 2) + "{\n" +
                Dev.tabs(tabs + 3) + "key: \"" + customAttrs[i].key + "\",\n";

        //true if the custom attr value should be a string
        let startOfKey = customAttrs[i].key.split("-")[0];
        if(Dev.customAttrsValueIsString.indexOf(startOfKey) > -1){
          str += Dev.tabs(tabs + 3) + "val: \"" + customAttrs[i].val + "\"\n";
        }
        //add as javascript
        else{
        str += Dev.tabs(tabs + 3) + "val: (" + customAttrs[i].val + ")\n";
        }
        str += Dev.tabs(tabs + 2) + "}";

        if(i < customAttrs.length){
          str += ",\n";
        }
      }

      str += "\n" + Dev.tabs(tabs + 1) + "]"; //end of custom attrs
    }

    if(condition !== undefined){
      if(condition.key == "else"){
        condition.val = "\"\"";
      }
      str += ",\n" + Dev.tabs(tabs + 1) + "{\n"+
              Dev.tabs(tabs + 2) + "key: \"" + condition.key + "\",\n" +
              Dev.tabs(tabs + 2) + "val: " + condition.val + "\n" +
              Dev.tabs(tabs + 1) + "}";
    }
  }


  str += "\n" + Dev.tabs(tabs) + "]"; //close current node

  if(!isChild){
    str += "\n";
  }

  return str;
}

//helper function for stringifyVDOM() for creating tabs
Dev.tabs = (num) => {
  let s = "";
  for(let i=0; i<num; i++){
    s += "  ";
  }
  return s;
}

/*
  ---
  Parses the props out a string for use with stringifyVDOM()
  ---

  @param {String} text

  @return {String}
*/
Dev.parseProps = (text) => {
  let char,
      lastChar = "",
      fullText = "",
      propText = "",
      inProp = false,
      openIndex = -1,
      startsWithProp = false,
      endsWithProp = false,
      scopeDepth = 0;
  for(let i=0; i<text.length; i++){
    let char = text.charAt(i);
    if(char == "{"  && lastChar != "\\"){
      if(!inProp){
        openIndex = i;
        inProp = true;
      }
      //entering a deeper scope
      else{
        scopeDepth += 1;
        propText += char;
      }
    }
    else if(inProp && char == "}" && lastChar != "\\"){
      //end of props
      if(scopeDepth == 0){
        inProp = false;

        if(openIndex >= 1){
          fullText += "\"+"
        }
        else{
          startsWithProp = true;
        }
        fullText += propText;
        if(i != text.length-1){
          fullText += "+\"";
        }
        else{
          endsWithProp = true;
        }
        propText = "";
      }
      //escaping a deeper scope
      else{
        scopeDepth -= 1;
        propText += char;
      }
    }
    //add char to propText
    else if(inProp){
      propText += char;
    }

    //add char to fullText
    else{
      fullText += char;
    }
    lastChar = char;
  }
  if(!startsWithProp){
    fullText = "\"" + fullText;
  }
  if(!endsWithProp){
    fullText += "\"";
  }
  return fullText;
}

/*
  ---
  Returns true if the tag requires a closing tag
  ---

  @param {String} tag

  @param {Boolean}
*/
Dev.requiresClosingTag = (tagName) => {
  return (Dev.noClosingTag.indexOf(tagName) == -1);
}



/*
  ---
  Converts the text between tags to a vdom AST
  e.g. div id="myid"   =>   ["div", { id : "myid" }, []]
  ---

  @param {String} str

  @return {AST}
*/
Dev.tagStringToVDOM = (str) => {
  str = str.trim();
  //return undefined if closing tag
  if(str.charAt(0) == "/"){
    return;
  }

  //split by space but no in quotes
  let arr = Dev.splitBySpaceButNotInQuotes(str);
  let tagName = arr[0];
  let vdom = [tagName, {}, [], []];

  //get all the attrs
  for(let i=1; i<arr.length; i++){
    let attr = arr[i].split("=");
    let key = attr[0];
    attr.shift();
    let val = attr.join("=");
    if(val.length > 2){
      //remove quotes
      val = val.substr(1, val.length-2);
    }
    let prefix = key.substr(0,2);
    if(prefix == "q-"){
      VDOM.addCustomAttr(vdom, key, val);
    }
    else{
      VDOM.attrs(vdom)[key] = val;
    }
  }
  return vdom;
}

/*
  ---
  Splits a string by /\s+/ spaces, but not if the space(s) are in quotes
  ---

  @param {String} str

  @return {Array}
*/
Dev.splitBySpaceButNotInQuotes = (str) => {
  let inQuote = false;
  let quoteType, char, lastChar = "";
  let lastCharWasSpace = false, charIsSpace;
  let el = "";
  let arr = [];
  for(let i=0; i<str.length; i++){
    char = str.charAt(i);
    if(char.match(/"|'|`/) && lastChar != "\\"){
      inQuote = !inQuote;
    }

    charIsSpace = (!inQuote && char.match(/\s/));

    if(charIsSpace && !lastCharWasSpace){
      arr.push(el);
      el = "";
    }

    if(!charIsSpace){
      el += char;
    }

    lastChar = char;
    lastCharWasSpace = charIsSpace;
  }
  arr.push(el);
  return arr;
}

/*
  ---
  Calculates the HTML tag depth change of the currently line
  ---

  @param {String} line

  @return {Number}
*/
Dev.calcTagDepthChange = (line) => {
  //ignore all text in quotes
 let quoteRegex = /"(.*?)"|`(.*?)`|'(.*?)'/;
 line = line.split(quoteRegex).join("");
  let count = 0;
  let curLineWithoutQuotes = line.split(quoteRegex).join("");
  let tags = curLineWithoutQuotes.match(/<.*?>/g);


  if(tags){
    for(let t=0; t<tags.length; t++){
      let tagName = tags[t].substr(1, tags[t].length-2).split(/\s/)[0];
      //dont count for when no closing tag is required
      if(Dev.requiresClosingTag(tagName)){
        if(tags[t].charAt(1) == "/"){
          //if using closing tag when no required
          if(Dev.requiresClosingTag(tagName.substr(1))){
            count -= 1;
          }
        }
        else{
          count += 1;
        }
      }
    }
  }
  return count;
}

/*
  ---
  Countes the number of matches for a character with no escape
  ---

  @param {String} str
  @param {String} type

  @return {Number}
*/
Dev.matchesForBracket = (str, type) =>{
  let char, lastChar = "";
  let count = 0;
  for(let i=0; i<str.length; i++){
    char = str.charAt(i);
    if(lastChar != "\\" &&  char == type){
      count++;
    }
    lastChar = char;
  }
  return count;
}


/*
  ---
  Splits a line by the first occurance of >
  ---

  @param {String} line

  @return {Array}
*/
Dev.splitByEndMultiLineTag = (line) => {
  let inQuote = false;
  let quoteType, char, lastChar = "";
  for(let i=0; i<line.length; i++){
    char = line.charAt(i);
    if(lastChar != "\\"){
      if(!inQuote && char.match(/"|'|`/)){
        inQuote = true;
        quoteType = char;
      }
      else if(inQuote && char == quoteType){
        inQuote = false;
      }
      else if(char == ">" && lastChar != "\\"){
        return [line.substr(0, i), line.substr(i+1)];
      }
    }

    lastChar = char;
  }
}

/*
  ---
  Returns the string after <
  ---

  @param {String} line

  @return {String}
*/
Dev.getStringAfterLastOpenBraket = (line) => {
  let indexOfLastBracket = -1;
  let inQuote = false;
  let quoteType;
  let char;
  let lastChar = "";
  let quote = /"|`|'/;

  for(let i=0; i<line.length; i++){
    char = line.charAt(i);


    if(!inQuote && char.match(quote)){
      quoteType = char;
      inQuote = true;
    }
    else if(inQuote && quoteType == char && lastChar != "\\"){
      inQuote = false;
    }
    else if(!inQuote && char == "<" && lastChar != "\\"){
      indexOfLastBracket = i;
    }

    lastChar = char;
  }

  return line.substr(indexOfLastBracket);
}




/**
  ---
  Returns a string with the excess white spacing removed, for use with text nodes
  ---

  @return {String}
*/
String.prototype.trimExcess = function(){
  let end = "";
  let start = "";

  if(this.charAt(0) == " "){
    start = " ";
  }
  if(this.charAt(this.length-1) == " "){
    end = " ";
  }
  let removedSpace = this.replace(/[\n\r]+|[\s]{2,}/g, ' ');
  if(removedSpace == ""){
    return "";
  }
  return start + removedSpace + end;
}


/**
  ---
  Exports file(s) for a static build
  ---

  @param {String[]} content
  @param {String} filename
*/
Dev.exportToFile = function(content, filename){
  let text = "";
  for(let i in content){
    text += content[i] + "\n";
  }

  let element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + text);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

/*
  ---
  Loads a file asynchronously and adds it to Dev.imports
  ---

  @param {String} path - path to the file
  @param {String} type - extention of the file
  @param {String} key - key name for the import in modules
*/
Dev.import = function(path, type, leftSide){
  if(Dev.imports[type] === undefined){
    Dev.imports[type] = {
      content : {},
      importsLeft : 1
    };
  }
  else{
    Dev.imports[type].importsLeft += 1;
  }
  Quas.ajax({
    url : path,
    type : "GET",
    success : (file) => {
      if(type == "js"){
        Dev.parseImports(path, file, leftSide);
      }
      else if(type == "css"){
        cssContent = Dev.imports[type].content;
        if(!cssContent[path]){
          cssContent[path] = file;
        }
      }

      Dev.imports[type].importsLeft -= 1;

      //check if all the files loaded of this type have been completed
      if(Dev.imports[type].importsLeft == 0){
        Dev.addImports(type);
      }
    },
    error : (e) => {
      Dev.imports[type].importsLeft -= 1;
    }
  });
}

/*
  ---
  Concatanates and adds the imported files to the head of the document
  ---

  @param {String} type - extention of the file
*/
Dev.addImports = function(type){
  let bundle = "";
  if(type == "js"){
    let jsContent = Dev.imports.js.content;
    let keys = "";
    for(let i=0; i<jsContent.length; i++){
      //root file is not a module
      if(jsContent[i].path == Dev.main){
        bundle +=
          "/*---------- " + jsContent[i].path + " ----------*/\n" +
          jsContent[i].file.trim() + "\n\n";
      }
      else{
        bundle += "/*---------- " + jsContent[i].path + " ----------*/\n";

        //replace all "export(" with "Quas.modules[key] = ("
        let exportMatch = jsContent[i].file.match(/export\s+\(|export\(/);

        let key = Dev.convertKebabCaseToTitleCase(jsContent[i].key);

        if(exportMatch){
          let setModule = "Quas.modules['" + key + "'] = (";
          jsContent[i].file = jsContent[i].file.replace(exportMatch[0], setModule);
        }

        bundle += jsContent[i].file + "\n";
        keys += jsContent[i].leftSide + "Quas.modules['" + key + "'];\n"
      }
    }

    //add all the references to modules to the end
    //e.g. const Card = Quas.modules["Card"];
    bundle += keys +  "\nfor(let i in Quas.modules){ \n  "+
      "if(typeof Quas.modules[i].init == 'function'){\n    Quas.modules[i].init(i);\n  }\n}";

    bundle = Dev.transpile(bundle);
    Dev.bundle.js = bundle;
    bundle += "\nif(typeof ready==='function'){ready();}";

  //  console.log(bundle);
    var script = document.createElement("script");
    script.type = 'text/javascript';
    script.textContent = bundle;
    document.getElementsByTagName('head')[0].appendChild(script);
  }
  else if(type == "css"){
    for(let i in Dev.imports.css.content){
      bundle +=
        "/*---------- " + i + " ----------*/\n\n" +
        Dev.imports.css.content[i].trim() + "\n\n";
    }
    Dev.bundle.css = bundle;
    var style = document.createElement("style");
    style.textContent = bundle;
    document.getElementsByTagName("head")[0].appendChild(style);
  }
}

Dev.main = "/main.js";

/*
  ---
  Dynamically loads the bundle.
  This is only for development builds and will run much slower than a static export
  ---
*/
Dev.load = function(){
  let mainFile;
  if(!Dev.main){
    mainFile = "/main.js";
  }
  else{
    mainFile = Dev.main;
  }

  Quas.ajax({
    url : mainFile,
    type : "GET",
    success : (file) => {
      let hasImport = Dev.parseImports(mainFile, file, "");

      //if no imports just add the root
      if(!hasImport){
        Dev.addImports("js");
      }
    },
    error : (e) => {
      console.error("Root file not found: " + mainFile);
    }
  });
}

Dev.convertTitleCaseToKebabCase = (name) => {
  name = name.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`);
  if(name.charAt(0) == "-"){
    return name.substr(1);
  }
  return name;
}

Dev.convertKebabCaseToTitleCase = (name) => {
  let arr = name.split("-");
  for(let i in arr){
   arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].substr(1);
  }
  return arr.join("");
}

/*
  ---
  Checks a JavaScript file to see if it has any imports
  ---

  @param {String} filename - file path
  @param {String} file - file content
  @param {String} key - key name for the import in modules
*/
Dev.parseImports = (filename, file, importLeftSide) => {
  let arr = filename.split("/");
  let srcKey = arr[arr.length-1].split(".")[0];

  //check if this file key has already been imported
  for(let i=0; i<Dev.imports.js.content.length; i++){
    if(Dev.imports.js.content[i].key == srcKey){
      return false;
    }
  }

  let lines = file.split("\n");

  const importRegex = /import\s+.*?/
  const quoteRegex = /".*?"|'.*?'|`.*?`/;
  let multiLineCommentOpen = false;
  let parsedFile = "";
  let hasImport = false;
  let isInImportHeader = true;

  for(let i=0; i<lines.length; i++){
    let validLine = "";
    if(lines[i].indexOf("/*") > -1){
      multiLineCommentOpen = true;
      validLine += lines[i].split("/*")[0];
    }

    if(lines[i].indexOf("*/") > -1){
      multiLineCommentOpen = false;
      validLine += lines[i].split("*/")[1];
    }

    if(!multiLineCommentOpen && validLine == ""){
      validLine = lines[i].split("//")[0];
    }
    else if(!multiLineCommentOpen && validLine != ""){
      validLine = validLine.split("//")[0];
    }


    let headerEndMatch = validLine.match(/---+/);
    if(headerEndMatch != null && headerEndMatch.index == 0){
      isInImportHeader = false;
    }
    else if(isInImportHeader){
      let importMatch = validLine.match(importRegex);
      //console.log("matching import: ", validLine);

      if(importMatch){
        let els = validLine.split(importRegex);
        let leftSide = els[0];
        let rightSide = els[1].trim();
        let quoteMatch = rightSide.match(quoteRegex);

        //css or js import
        if(quoteMatch){
          let path = quoteMatch[0].substr(1, quoteMatch[0].length-2);
          let pathInfo = path.split(".");
          let extention = pathInfo[pathInfo.length-1];

          //javascipt
          if(extention == "js"){
            hasImport = true;
            Dev.import(path, extention, leftSide);
          }

          //css
          else{
            Dev.import(path, extention);
          }
        }
        //built in modules
        //import Quas.Router
        else{
          let arr = rightSide.split(/\s+|;/)[0].split(".");

          let scope = Dev.convertTitleCaseToKebabCase(arr[0]);
          let moduleFileName = Dev.convertTitleCaseToKebabCase(arr[1]);
          let moduleName = "";
          if(moduleFileName !== undefined){
            moduleName = Dev.convertKebabCaseToTitleCase(moduleFileName);
          }

          let left = "const " + moduleName + " = ";
          let path = "/" + scope + "/modules/" + moduleFileName + ".js";
          let extention = "js";
          hasImport = true;

          //console.log("LEFT:", left);
          Dev.import(path, extention, left);
        }


        //if not a css import
        hasImport = true;
      }
      else{
        parsedFile += lines[i] + "\n";
      }
    }
    else{
      parsedFile += lines[i] + "\n";
    }
  }

  let data = filename.split("/");
  let key = data[data.length-1].split(".")[0];


  //add file
  Dev.imports.js.content.push({
    path : filename,
    key : key,
    leftSide : importLeftSide,
    file : parsedFile
  });

  return hasImport;
}

/**
  ---
  Export the current bundle
  ---

  ```
  //downloads both bundle.css and bundel.js
  Dev.build();

  //downloads both sample.css and sample.js
  Dev.build("sample");

  //downloads JavaScript bundle as bun.js
  Dev.build("bun", "js");

  //downloads Css bundle as mystyle.css
  Dev.build("mystyle", "css");
  ```

  @param {String} fileOutName - (optional) name of the output file
  @param {String} extentionName - (optional) js or css, by default it will do both

*/
Dev.build = function(filename, extention){
  if(!filename){
    var filename = "bundle";
  }
  let types = Dev.bundle;
  if(extention !== undefined){
    types = [extention];
  }

  for(let i in types){
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + types[i]);
    element.setAttribute('download', filename+"."+i);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
}

//dynamicly load and build the project
document.addEventListener("DOMContentLoaded", function(event) {
  Dev.load();
});
