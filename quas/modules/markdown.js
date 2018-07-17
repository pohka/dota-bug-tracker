---
/*
todo:
- tables
- embed youtube
- video
- hr tag

- async images
- parse multiple types of inline rules
- parse inline for all text in other rules
- option to disable inline rules for text e.g. quote with links and bold text disabled
*/

/*
notes:
---
rules can create conflicts if their patterns are similar.

example:
rule 1: [text](link)
rule 2: ![alt](src)

rule 1 will match the pattern and ignore rule 2
to prevent this conflict the rules should be in order of most complexity

the new order should be:
rule 1: ![alt](src)
rule 2: [text](link)

*/

/**
  # module
  ---
  Handling markdown
  ---

  rule types:
  - begin
  - multiline
  - block
  - inline
*/
export({

  init(){
    Markdown.rules = {}

    //heading
    Markdown.addRule("begin", {
      name : "heading",
      isInlineRulesEnabled : false,
      pattern : /#+\s*/,

      output : function(line){
        let headingSize = line.match(/#+/)[0].length
        let match = line.match(this.pattern)[0];
        let text = line.substr(match.length);

        let content
        if(this.isInlineRulesEnabled){
          content = Markdown.parseInlineRules(text);
        }
        else{
          content = [text];
        }

        let vdom = ["h"+headingSize, {}, content, []];

        return vdom;
      }
    });

    //code
    Markdown.addRule("block", {
      name : "code",
      isInlineRulesEnabled : false,
      pattern : /```+/,

      //text == text between open and close block
      output : function(lines){
        let codeLang  = lines[0].replace(this.pattern, "").trim();
        lines.shift(0);
        lines.pop();
        let code = lines.join("\n");
        return (
          #<pre>
            <code data-type="{codeLang}">{code}</code>
          </pre>
        );
      }
    });

    //lists
    Markdown.addRule("multiline", {
      name : "list",
      isInlineRulesEnabled : true,
      // matches * or - or 1.
      pattern : /\s*(-|\*|(\d\.))\s*/,
      output : function(lines){
        let isOrdered = false;
        //matches digits such as 1. or 2.
        let firstDigitMatch = lines[0].match(/\s*\d\.\s*/);

        if(firstDigitMatch != null && firstDigitMatch.index == 0){
          isOrdered = true;
        }

        let curDepth = 0;
        let items = [isOrdered]; //index zero is boolean, true if ordered list
        const depthLimit = 3;

        //created the nest data arrays
        for(let i=0; i<lines.length; i++){
          let spaceCount = lines[i].match(/\s*/)[0].length;
          let match = lines[i].match(this.pattern);
          let item = lines[i].substr(match[0].length);
          let nextDepth = parseInt(spaceCount/2);

          //deeper nesting, limited to 3
          if(curDepth < nextDepth && curDepth+1 < depthLimit){
            let firstDigitMatch = lines[i].match(/\s*\d\.\s*/);
            isOrdered = false;
            if(firstDigitMatch != null && firstDigitMatch.index == 0){
              isOrdered = true;
            }

            if(curDepth == 0){
              items.push([isOrdered]);
            }
            else if(curDepth == 1){
              items[items.length-1].push([isOrdered]);
            }

            curDepth++;
          }
          else{
            //escaping nesting nesting
            if(curDepth > nextDepth){
              curDepth = nextDepth;
            }
          }


          if(curDepth == 1){
            items[items.length-1].push(item);
          }
          else if(curDepth == 2){
            let nest = items[items.length-1];
            nest[nest.length-1].push(item);
          }
          else{
            items.push(item);
          }
        }

        //generate the template based on the generated data
        return this.template(items);
      },

      //recursively builds nested ordered and unordered lists
      template : function(items){
        let childNodes = [];
        let isOrdered = items[0];
        for(let i=1; i<items.length; i++){
          if(!Array.isArray(items[i])){
            if(this.isInlineRulesEnabled){
              let content = Markdown.parseInlineRules(items[i]);
              childNodes.push(#<li q-append="content"></li>);
            }
            else{
              childNodes.push(#<li>{items[i]}</li>);
            }
          }
          else{
            let nestedList = this.template(items[i]);
            childNodes.push(nestedList);
          }
        }

        let node;
        if(isOrdered){
          node = #<ol q-append="childNodes"></ol>;
        }
        else{
          node = #<ul q-append="childNodes"></ul>;
        }
        return node;
      }
    });

    //quote
    Markdown.addRule("multiline", {
      name : "quote",
      isInlineRulesEnabled : true,
      pattern : />\s*/,
      output : function(lines){
        let nodes = [];
        if(this.isInlineRulesEnabled){
          for(let i=0; i<lines.length; i++){
            let match = lines[i].match(this.pattern);
            let lineText = lines[i].substr(match[0].length);
            let vdoms = Markdown.parseInlineRules(lineText);
            for(let a in vdoms){
              nodes.push(vdoms[a]);
            }
            if(i < lines.length-1){
              nodes.push(["br", {}, [], []]);
            }
          }
        }
        else{
          for(let i=0; i<lines.length; i++){
            let match = lines[i].match(this.pattern);
            nodes.push(lines[i].substr(match[0].length));
            if(i < lines.length-1){
              nodes.push(["br", {}, [], []]);
            }
          }
        }

        return #<quote q-append="nodes"></quote>;
      }
    });

    //todo: allow option for async loading
    //image
    Markdown.addRule("inline", {
      name : "image",
      pattern : /!\[.*?\]\(.*?\)/,
      output : function(match){
        let els = match[0].substr(2, match[0].length-3).split("](");
        let alt = els[0];
        let src = els[1];
        let vdom =  #<div><img src="{src}" alt="{alt}"></img></div>

        return vdom;
      }
    });

    //link
    Markdown.addRule("inline", {
      name : "link",
      pattern : /\[.*?\]\(.*?\)/,
      output : function(match){
        let els = match[0].substr(1, match[0].length-2).split("](");
        let anchor = els[0];
        let link = els[1];

        let matchOrigin = link.match(location.origin);
        let isMatchingOrigin = (matchOrigin != null && matchOrigin.index == 0);
        if(!isMatchingOrigin && link.charAt(0) == "/"){
          isMatchingOrigin = true;
        }


        let vdom;
        //cross origin link should open in new tab
        if(!isMatchingOrigin){
          vdom =  #<a href="{link}" target="_blank">{anchor}</a>
        }
        else{
          vdom =  #<a href="{link}" target="push">{anchor}</a>
        }

        return vdom;
      }
    });

    //bold text
    Markdown.addRule("inline", {
      name : "bold",
      pattern : /(\*\*.*?\*\*)|__.*?__/,
      output : function(match){
        let text = match[0].substr(2, match[0].length-4);
        return #<b>{text}</b>;
      }
    });

    //italic text
    Markdown.addRule("inline", {
      name : "italic",
      pattern : /(\*.*?\*)|_.*?_/,
      output : function(match){
        let text = match[0].substr(1, match[0].length-2);
        return #<i>{text}</i>;
      }
    });

    //strike through text
    Markdown.addRule("inline", {
      name : "strikethrough",
      pattern : /~~.*?~~/,
      output : function(match){
        let text = match[0].substr(2, match[0].length-4);
        return #<s>{text}</s>;
      }
    });
  },

  /**
    ---
    Parses markdown text and returns a virtual dom
    ---

    @param {String} text - plain text

    @return {Array<AST>}
  */
  parseToVDOM(text){
    let vdoms = [];
    let lines = text.split(/\n/);
    let paragraph = "";

    //block rule variables
    let isInBlock = false; //true if within a block rule
    let blockName = ""; //name of the current block rule
    let blockLines = []; //lines collected within the current block

    //multiline rule variables
    let isInMultiline = false; //true if in a multiline rule
    let multilineName = ""; //name of the current multiline rule
    let multilineLines = []; //lines collected for a multiline rule

    //reused vairables in the loop
    let match,
        line,
        matchingRule,
        trimmedLine,
        rule;

    for(let i=0; i<lines.length; i++){
      line = lines[i];
      matchingRule = false;
      trimmedLine = line.trim();

      //empty line
      if(trimmedLine.length == 0){
        if(paragraph.length > 0){
          let nodes = Markdown.parseInlineRules(paragraph);
          vdoms.push(#<p q-append="nodes"></p>);
          paragraph = "";
        }

        if(isInMultiline){
          rule = Markdown.findRule(multilineName,"multiline");
          let node = rule.output(multilineLines);
          vdoms.push(node);
          isInMultiline = false;
          multilineName = "";
          multilineLines = [];
        }
      }
      else{
        if(!isInBlock){
          //multiline rule
          for(let a=0; a<Markdown.rules["multiline"].length && !matchingRule; a++){
            rule = Markdown.rules["multiline"][a];
            if(!rule.isDisabled && (!isInMultiline || (isInMultiline && rule.name == multilineName))){
              match = line.match(rule.pattern);
              if(match != null && match.index == 0){
                multilineLines.push(line);
                multilineName = rule.name;
                isInMultiline = true;
                matchingRule = true;
              }
            }
          }

          //end of multiline
          if(isInMultiline && !matchingRule){
            rule = Markdown.findRule(multilineName,"multiline");
            let node = rule.output(multilineLines);
            vdoms.push(node);
            isInMultiline = false;
            multilineName = "";
            multilineLines = [];
          }

          //begin rule
          for(let a=0; a<Markdown.rules["begin"].length && !matchingRule; a++){
            rule = Markdown.rules["begin"][a];
            if(!rule.isDisabled){
              match = line.match(rule.pattern);
              if(match != null && match.index == 0){
                let node = rule.output(line);
                vdoms.push(node);
                matchingRule = true;
              }
            }
          }
        }

        //block rule
        for(let a=0; a<Markdown.rules["block"].length && !matchingRule; a++){
          rule = Markdown.rules["block"][a];
          if(!rule.isDisabled){
            if(!isInBlock){
              match = line.match(rule.pattern);
              if(match != null && match.index == 0){
                isInBlock = true;
                matchingRule = true;
                blockName = rule.name;
              }
            }
            else if(isInBlock && blockName == rule.name){
              let match = line.match(rule.pattern);
              if(match != null && match.index == 0){
                isInBlock = false;
                matchingRule = true;
                blockLines.push(line);
                let node = rule.output(blockLines);
                vdoms.push(node);
                blockLines = [];
              }
            }
          }
        }

        //add line to block lines
        if(isInBlock){
          blockLines.push(line);
        }

        //no rule matched this line and not in a block rule
        if(!matchingRule && !isInBlock){
          paragraph += line;
        }
      }
    }

  //  console.log("markdown result:", vdoms);
    return vdoms;
  },

  //parses inline rules
  parseInlineRules(text){
    let vdoms = [];
    let matches = [];
    let hasMatch = true;
    let earliestRule = null;

    while(hasMatch){
      hasMatch = false;
      earliestRule = null;

      for(let a=0; a<Markdown.rules["inline"].length; a++){
        let rule = Markdown.rules["inline"][a];
        if(!rule.isDisabled){
          let match = text.match(rule.pattern);
          if(match != null){
            if(earliestRule == null || (match.index < earliestRule.match.index)){
              earliestRule = {match : match, ruleName : a};
              hasMatch = true;
            }
          }
        }
      }

      if(hasMatch){
          let rule = Markdown.rules["inline"][earliestRule.ruleName];
          let match = earliestRule.match;
          let inlineVDOM = rule.output(match);
          let beforeText = text.substr(0, match.index);
          var afterText = text.substr(match.index + match[0].length);
          if(match.index > 0){
            vdoms.push(beforeText);
          }
          vdoms.push(inlineVDOM);
          text = afterText;
      }
    }

    if(text.length > 0){
     vdoms.push(text);
    }

    return vdoms;
  },

  //find a rule by name with a given type
  findRule(name, type){
    if(!type){
      for(let a in Markdown.rules){
        for(let i=0; i<Markdown.rules[a].length; i++){
          if(Markdown.rules[a][i].name == name){
            return Markdown.rules[a][i];
          }
        }
      }
    }
    else{
      for(let i=0; i<Markdown.rules[type].length; i++){
        if(Markdown.rules[type][i].name == name){
          return Markdown.rules[type][i];
        }
      }
    }
  },

  //adding a rule
  addRule(type, obj){
    obj.isDisabled = false;
    if(type == "inline"){
      obj.supportsInlineRules = false;
    }
    if(!Markdown.rules[type]){
      Markdown.rules[type] = [obj];
    }
    else{
      Markdown.rules[type].push(obj);
    }
  },

  //remove a rule
  removeRule(name, type){
    let rules = Markdown.rules[type];
    for(let i=0; i<rules.length; i++){
      if(rules[i].name == name){
        rules.splice(i,1);
        return true;
      }
    }
    return false;
  },

  //enable or disable a rule
  setRuleDisabled(isDisabled, name, type){
    let rule = Markdown.findRule(name, type);
    if(rule !== undefined){
      rule.isDisabled = isDisabled;
      return true;
    }
    return false;
  },

  //set if a rule should allow the use of inline rules
  setInlineRulesEnabled(isEnabled, name, type){
    let rule = Markdown.findRule(name, type);
    if(rule !== undefined){
      rule.isInlineRulesEnabled = isEnabled;
      return true;
    }
    return false;
  }
});
