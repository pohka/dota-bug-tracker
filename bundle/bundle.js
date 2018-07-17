/*---------- /main.js ----------*/
function ready(){
  Quas.render(new Navbar(), "#app");
  let loader = new Loader();
  Quas.render(loader, "#app");

  let url = "https://www.reddit.com/r/DotA2/search.json?q=bug&sort=new&restrict_sr=on";
  Quas.fetch(url, "json")
  .then((res)=>{
    let postsData = res.data.children;
    for(let i in postsData){
      let data = postsData[i].data;
      let props = {
        title : data.title,
        url : data.url,
        text : data.selftext,
        score : data.score,
        num_comments : data.num_comments,
        author : data.author,
        timestamp : data.created_utc
      }
      loader.state.loading = false;
      Quas.render(new Post(props), "#app");
    }
  });

  let img = new Image();
  img.onload = function(){
    document.documentElement.style =
      "background: url('"+this.src+"') no-repeat center center fixed; background-size: cover;";
  }
  img.src = "/bg_battlecup.jpg";
}

class Loader extends Component{
  constructor(){
    super();
    this.state.loading = true;
  }
  render(){
    if(this.state.loading){
      return(
          [
    "div",
    {
      "class":"loader-con"
    },
    [
      [
        "div",
        {
          "class":"loader loader1"
        },
        [],
        []

      ],
      [
        "div",
        {
          "class":"loader loader2"
        },
        [],
        []

      ],
      [
        "div",
        {
          "class":"loader loader3"
        },
        [],
        []

      ],
      [
        "div",
        {
          "class":"loader loader4"
        },
        [],
        []

      ]
    ],
    []

  ]
      );
    }
  }
}

class Post extends Component{
  constructor(props){
    super(props);
    this.props.thumbnail = findMatch(props.title, props.text);
  }

  render(){
    const maxText = 365;
    let hasMore = false;
    let text = this.props.text;
    if(text.length > maxText){
      text = text.substr(0,maxText) + " .....\n";
      hasMore = true;
    }
    let textVDOMs = Markdown.parseToVDOM(text);

    let date = new Date(this.props.timestamp*1000);
    let timeStr = date.fromNow();
    let thumbnail = "/heroes/npc_dota_hero_"+this.props.thumbnail+".png";

    return (
        [
    "a",
    {
      "href":this.props.url,
      "target":"_blank",
      "class":"post-con"
    },
    [
      [
        "div",
        {
          "class":"post-thumbnail"
        },
        [
          [
            "div",
            {
              "class":"img-con"
            },
            [
              [
                "img",
                {
                  "src":"/heroes/npc_dota_hero_default.png"
                },
                [],
                [
                  {
                    key: "async-src",
                    val: (thumbnail)
                  },

                ]
              ]
            ],
            []

          ],
          [
            "div",
            {
              "class":"post-author"
            },
            [
              this.props.author
            ],
            []

          ]
        ],
        []

      ],
      [
        "div",
        {
          "class":"post-text"
        },
        [
          [
            "h1",
            {},
            [
              this.props.title
            ],
            []

          ],
          [
            "p",
            {},
            [],
            [
              {
                key: "append",
                val: (textVDOMs)
              },

            ]
          ]
        ],
        []

      ],
      [
        "div",
        {
          "class":"timestamp-con"
        },
        [
          [
            "div",
            {
              "class":"timestamp"
            },
            [
              timeStr
            ],
            []

          ]
        ],
        []

      ],
      [
        "div",
        {
          "class":"post-more"
        },
        [
          "See More"
        ],
        []
,
        {
          key: "if",
          val: hasMore
        }
      ]
    ],
    []

  ]
    );
  }
}

class Navbar extends Component{
  render(){
    return (
        [
    "nav",
    {},
    [
      [
        "h1",
        {},
        [
          "Dota 2 - Bug Tracker"
        ],
        []

      ],
      [
        "div",
        {
          "class":"nav-link"
        },
        [
          [
            "a",
            {
              "href":"https://twitter.com/PohkaDota",
              "target":"_blank"
            },
            [
              [
                "svg",
                {
                  "aria-hidden":"true",
                  "data-prefix":"fab",
                  "role":"img",
                  "viewBox":"0 0 512 512"
                },
                [
                  [
                    "path",
                    {
                      "fill":"currentColor",
                      "d":"M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"
                    },
                    [],
                    []

                  ]
                ],
                []

              ]
            ],
            []

          ],
          [
            "a",
            {
              "href":"https://github.com/pohka/dota-bug-tracker",
              "target":"_blank"
            },
            [
              [
                "svg",
                {
                  "aria-hidden":"true",
                  "data-prefix":"fab",
                  "role":"img",
                  "viewBox":"0 0 512 512"
                },
                [
                  [
                    "path",
                    {
                      "fill":"currentColor",
                      "d":"M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"
                    },
                    [],
                    []

                  ]
                ],
                []

              ]
            ],
            []

          ]
        ],
        []

      ]
    ],
    []

  ]
    );
  }
}

function findMatch(title, text){
  let titleWords = title.toLowerCase().split(/\s+/);
  let matches = [];
  for(let a=0; a<titleWords.length; a++){
    if(ignoreWords.indexOf(titleWords[a]) == -1){
      for(let i in heroes){
        let heroWords = heroes[i].split("_");
        let foundMatchThisHero = false;
        for(let j=0; j<heroWords.length && !foundMatchThisHero; j++){
          if(heroWords[j] == titleWords[a] && titleWords[a] != "the" && titleWords[a] != "of"){
            matches.push(heroes[i]);
            foundMatchThisHero = true;
          }
        }
      }

      for(let i in aliases){
        if(i == titleWords[a] && titleWords[a] != "the" && titleWords[a] != "of"){
          matches.push(aliases[i]);
        }
      }
    }
  }

  if(matches.length > 0){
    return matches[0];
  }
  else return "weaver";
}

const ignoreWords = [
  "the",
  "of",
  "king",
  "spirit",
  "assassin",
  "shadow"
];

const heroes = [
  "abaddon",
  "alchemist",
  "ancient_apparition",
  "antimage",
  "arc_warden",
  "axe",
  "bane",
  "batrider",
  "beastmaster",
  "bloodseeker",
  "bounty_hunter",
  "brewmaster",
  "bristleback",
  "broodmother",
  "centaur",
  "chaos_knight",
  "chen",
  "clinkz",
  "crystal_maiden",
  "dark_seer",
  "dark_willow",
  "dazzle",
  "death_prophet",
  "disruptor",
  "doom",
  "dragon_knight",
  "drow_ranger",
  "earth_spirit",
  "earthshaker",
  "elder_titan",
  "ember_spirit",
  "enchantress",
  "enigma",
  "faceless_void",
  "furion",
  "gyrocopter",
  "huskar",
  "invoker",
  "jakiro",
  "juggernaut",
  "keeper_of_the_light",
  "kunkka",
  "legion_commander",
  "leshrac",
  "lich",
  "life_stealer",
  "lina",
  "lion",
  "lone_druid",
  "luna",
  "lycan",
  "magnus",
  "medusa",
  "meepo",
  "mirana",
  "monkey_king",
  "morphling",
  "naga_siren",
  "necrophos",
  "shadow_fiend",
  "night_stalker",
  "nyx_assassin",
  "outworld_devourer",
  "ogre_magi",
  "omniknight",
  "oracle",
  "pangolier",
  "phantom_assassin",
  "phantom_lancer",
  "phoenix",
  "puck",
  "pudge",
  "pugna",
  "queen_of_pain",
  "clockwerk",
  "razor",
  "riki",
  "rubick",
  "sand_king",
  "shadow_demon",
  "shadow_shaman",
  "silencer",
  "wraith_king",
  "skywrath_mage",
  "slardar",
  "slark",
  "sniper",
  "spectre",
  "spirit_breaker",
  "storm_spirit",
  "sven",
  "techies",
  "templar_assassin",
  "terrorblade",
  "tidehunter",
  "timbersaw",
  "tinker",
  "tiny",
  "treant",
  "troll_warlord",
  "tusk",
  "underlord",
  "undying",
  "ursa",
  "vengefulspirit",
  "venomancer",
  "viper",
  "visage",
  "warlock",
  "weaver",
  "windranger",
  "winter_wyvern",
  "io",
  "witch_doctor",
  "zeus"
];

const aliases = {
  alch : "alchemist",
  aa : "ancient_apparition",
  am : "antimage",
  "anti-mage" : "antimage",
  bat : "batrider",
  bm : "beastmaster",
  bounty : "bounty_hunter",
  brood : "broodmother",
  ck : "chaos_knight",
  cm : "crystal_maiden",
  willow : "dark_willow",
  dp : "death_prophet",
  dk : "dragon_knight",
  drow : "drow_ranger",
  shaker : "earthshaker",
  et : "elder_titan",
  "void" : "faceless_void",
  kotl : "keeper_of_the_light",
  lc : "legion_commander",
  lesh : "leshrac",
  naix : "life_stealer",
  nightstalker : "night_stalker",
  omni : "omniknight",
  pa : "phantom_assassin",
  pl : "phantom_lancer",
  qop : "queen_of_pain",
  clock : "clockwerk",
  sk : "sand_king",
  wk : "wraith_king",
  sky : "skywrath_mage",
  storm : "storm_spirit",
  cancer : "techies",
  "vengeful_spirit" : "vengefulspirit",
  venge : "vengefulspirit",
  veno : "venomancer",
  windrunner : "windranger",
  wr : "windranger",
  ww : "winter_wyvern",
  wisp : "io",
  wd : "witch_doctor",
  sf : "shadow_fiend"
};

/*---------- /quas/modules/markdown.js ----------*/
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
Quas.modules['Markdown'] = ({

  init(){
    Markdown.rules = {}

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

    Markdown.addRule("block", {
      name : "code",
      isInlineRulesEnabled : false,
      pattern : /```+/,

      output : function(lines){
        let codeLang  = lines[0].replace(this.pattern, "").trim();
        lines.shift(0);
        lines.pop();
        let code = lines.join("\n");
        return (
            [
    "pre",
    {},
    [
      [
        "code",
        {
          "data-type":codeLang
        },
        [
          code
        ],
        []

      ]
    ],
    []

  ]
        );
      }
    });

    Markdown.addRule("multiline", {
      name : "list",
      isInlineRulesEnabled : true,

      pattern : /\s*(-|\*|(\d\.))\s*/,
      output : function(lines){
        let isOrdered = false;

        let firstDigitMatch = lines[0].match(/\s*\d\.\s*/);

        if(firstDigitMatch != null && firstDigitMatch.index == 0){
          isOrdered = true;
        }

        let curDepth = 0;
        let items = [isOrdered]; 
        const depthLimit = 3;

        for(let i=0; i<lines.length; i++){
          let spaceCount = lines[i].match(/\s*/)[0].length;
          let match = lines[i].match(this.pattern);
          let item = lines[i].substr(match[0].length);
          let nextDepth = parseInt(spaceCount/2);

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

        return this.template(items);
      },

      template : function(items){
        let childNodes = [];
        let isOrdered = items[0];
        for(let i=1; i<items.length; i++){
          if(!Array.isArray(items[i])){
            if(this.isInlineRulesEnabled){
              let content = Markdown.parseInlineRules(items[i]);
              childNodes.push(  [
    "li",
    {},
    [],
    [
      {
        key: "append",
        val: (content)
      },

    ]
  ]
);            }
            else{
              childNodes.push(  [
    "li",
    {},
    [
      items[i]
    ],
    []

  ]
);            }
          }
          else{
            let nestedList = this.template(items[i]);
            childNodes.push(nestedList);
          }
        }

        let node;
        if(isOrdered){
          node =   [
    "ol",
    {},
    [],
    [
      {
        key: "append",
        val: (childNodes)
      },

    ]
  ]
;        }
        else{
          node =   [
    "ul",
    {},
    [],
    [
      {
        key: "append",
        val: (childNodes)
      },

    ]
  ]
;        }
        return node;
      }
    });

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

        return   [
    "quote",
    {},
    [],
    [
      {
        key: "append",
        val: (nodes)
      },

    ]
  ]
;      }
    });

    Markdown.addRule("inline", {
      name : "image",
      pattern : /!\[.*?\]\(.*?\)/,
      output : function(match){
        let els = match[0].substr(2, match[0].length-3).split("](");
        let alt = els[0];
        let src = els[1];
        let vdom =    [
    "div",
    {},
    [
      [
        "img",
        {
          "src":src,
          "alt":alt
        },
        [],
        []

      ]
    ],
    []

  ]

        return vdom;
      }
    });

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

        if(!isMatchingOrigin){
          vdom =    [
    "a",
    {
      "href":link,
      "target":"_blank"
    },
    [
      anchor
    ],
    []

  ]
        }
        else{
          vdom =    [
    "a",
    {
      "href":link,
      "target":"push"
    },
    [
      anchor
    ],
    []

  ]
        }

        return vdom;
      }
    });

    Markdown.addRule("inline", {
      name : "bold",
      pattern : /(\*\*.*?\*\*)|__.*?__/,
      output : function(match){
        let text = match[0].substr(2, match[0].length-4);
        return   [
    "b",
    {},
    [
      text
    ],
    []

  ]
;      }
    });

    Markdown.addRule("inline", {
      name : "italic",
      pattern : /(\*.*?\*)|_.*?_/,
      output : function(match){
        let text = match[0].substr(1, match[0].length-2);
        return   [
    "i",
    {},
    [
      text
    ],
    []

  ]
;      }
    });

    Markdown.addRule("inline", {
      name : "strikethrough",
      pattern : /~~.*?~~/,
      output : function(match){
        let text = match[0].substr(2, match[0].length-4);
        return   [
    "s",
    {},
    [
      text
    ],
    []

  ]
;      }
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

    let isInBlock = false; 
    let blockName = ""; 
    let blockLines = []; 

    let isInMultiline = false; 
    let multilineName = ""; 
    let multilineLines = []; 

    let match,
        line,
        matchingRule,
        trimmedLine,
        rule;

    for(let i=0; i<lines.length; i++){
      line = lines[i];
      matchingRule = false;
      trimmedLine = line.trim();

      if(trimmedLine.length == 0){
        if(paragraph.length > 0){
          let nodes = Markdown.parseInlineRules(paragraph);
          vdoms.push(  [
    "p",
    {},
    [],
    [
      {
        key: "append",
        val: (nodes)
      },

    ]
  ]
);          paragraph = "";
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

          if(isInMultiline && !matchingRule){
            rule = Markdown.findRule(multilineName,"multiline");
            let node = rule.output(multilineLines);
            vdoms.push(node);
            isInMultiline = false;
            multilineName = "";
            multilineLines = [];
          }

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

        if(isInBlock){
          blockLines.push(line);
        }

        if(!matchingRule && !isInBlock){
          paragraph += line;
        }
      }
    }

    return vdoms;
  },

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

  setRuleDisabled(isDisabled, name, type){
    let rule = Markdown.findRule(name, type);
    if(rule !== undefined){
      rule.isDisabled = isDisabled;
      return true;
    }
    return false;
  },

  setInlineRulesEnabled(isEnabled, name, type){
    let rule = Markdown.findRule(name, type);
    if(rule !== undefined){
      rule.isInlineRulesEnabled = isEnabled;
      return true;
    }
    return false;
  }
});

/*---------- /quas/modules/date-helper.js ----------*/
Quas.modules['DateHelper'] = ({
    init(){
      const msInSec = 1000;
      const msInMin = msInSec * 60;
      const msInHr = msInMin * 60;
      const msInDay = msInHr * 24;
      const msInWeek = msInDay * 7;
      const msInMonth = msInDay * 30;
      const msInYear = msInMonth * 12;

      const milliseconds = {
          millisecond : 1,
          second : msInSec,
          minute : msInMin,
          hour : msInHr,
          day : msInDay,
          week : msInWeek,
          month : msInMonth,
          year : msInYear
      };

      /*
      Add time with an object

      myDate.add({month : 1, day : 4});
      */
      Date.prototype.add = function(obj){
        let extra = 0;
        for(let i in obj){
          extra += obj[i] * milliseconds[i];
        }

        this.setTime(extra + this.getTime());
      }

      Date.prototype.sub = function(obj){
        let extra = 0;
        for(let i in obj){
          extra += obj[i] * milliseconds[i];
        }

        this.setTime(this.getTime() - extra);
      }

      Date.prototype.fromNow = function(){
        let diff = this.getTime() - Date.now();
        let beforeNow = (diff < 0);
        let absDiff = Math.abs(diff);

        let keys = Object.keys(milliseconds);

        for(let i=keys.length-1; i>-1; i-=1){
          if(absDiff >= milliseconds[keys[i]]){
            let count = parseInt(absDiff/milliseconds[keys[i]]);

            let res  = count + " " + keys[i];
            if(count > 1){
              res += "s";
            }
            if(beforeNow){
              res += " ago";
            }
            else{
              res = "in " + res;
            }
            return res;
          }
        }
      }

      /*
        a full string of time from now

        2d 13h 52s

        set last key to the last key you want to show in the string
        myDate.fromNowFull("hour");
        => 2d 13h

        if you set useExtension to true the ago and in will be used
        => 2d 13h ago
        => in 2d 13h
      */
      Date.prototype.fromNowFull = function(lastKey, useExtension){
        let diff = this.getTime() - Date.now();
        let beforeNow = (diff < 0);
        let total = Math.abs(diff);

        let keys = Object.keys(milliseconds);
        let res = "";

        for(let i=keys.length-1; i>0; i-=1){
          if(total >= milliseconds[keys[i]]){
            let count = parseInt(total/milliseconds[keys[i]]);

            res  += count + keys[i].charAt(0) + " ";
            total = parseInt(total%milliseconds[keys[i]]);
          }

          if(lastKey == keys[i]){
            break;
          }
        }

        if(useExtension){
          if(beforeNow){
            res += "ago";
          }
          else{
            res = "in " + res;
          }
        }
        return res;
      }

      /*
        converts a time object to milliseconds
        Date.toMilliseconds({ month: 1, day : 3 });
        => 2851200000
        =>
      */
      Date.toMilliseconds = function(obj){
        let time = 0;
        for(let i in obj){
          time += obj[i] * milliseconds[i];
        }
        return time;
      }
    }
  }
);

/*---------- /quas/modules/async.js ----------*/

/**
  # module
  ---
  Asyncronously loading files

  adds custom attribute for "q-async" which currently just loads images
  ---

  ```
      [
    "div",
    {},
    [
      [
        "img",
        {},
        [],
        [
          {
            key: "async-imgsrc",
            val: (/images/1.png)
          },

        ]
      ]
    ],
    []

  ]
  ```
*/
Quas.modules['Async'] = ({
  init(){
    Quas.async = {};
    Quas.customAttrs["async"] = (params, data, parentVDOM, comp) => {

      if(params[0] == "src"){
        if(!Quas.async.imgs){
          Quas.async.imgs = [];
        }

        let url;
        if(data.length < 4 || data.substr(0,4) != "http"){
          url = window.location.origin + data;
        }
        else{
          url = data;
        }

        let foundImage = false;
        for(let i=0; i<Quas.async.imgs.length; i++){
          if(Quas.async.imgs[i].src == url){
            foundImage = true;
            parentVDOM[1]["src"] = url;
          }
        }

        if(!foundImage){
          let img = new Image();
          img.onload = function(){
            Quas.async.imgs.push(this);
            Quas.render(comp);
          }
          img.src = url;
        }
      }
    }
  }
});

const Markdown = Quas.modules['Markdown'];
const DateHelper = Quas.modules['DateHelper'];
const Async = Quas.modules['Async'];

for(let i in Quas.modules){ 
  if(typeof Quas.modules[i].init == 'function'){
    Quas.modules[i].init(i);
  }
}