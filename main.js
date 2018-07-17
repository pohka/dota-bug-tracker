import Quas.Markdown
import Quas.DateHelper
import Quas.Async
import "/quas/css/animation.css"
import "/main.css"
---


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

  //load background async
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
        #<div .loader-con>
          <div .loader .loader1></div>
          <div .loader .loader2></div>
          <div .loader .loader3></div>
          <div .loader .loader4></div>
        </div>
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
      #<a .post-con href="{this.props.url}" target="_blank">
        <div .post-thumbnail>
          <div .img-con>
            <img src="/heroes/npc_dota_hero_default.png" q-async-src="thumbnail">
          </div>
          <div .post-author>{this.props.author}</div>
        </div>
        <div .post-text>
          <h1>{this.props.title}</h1>
          <p q-append="textVDOMs"></p>
        </div>
        <div .timestamp-con><div .timestamp>{timeStr}</div></div>
        <div q-if="hasMore" .post-more>See More</div>
      </a>
    );
  }
}

class Navbar extends Component{
  render(){
    return (
      #<nav>
        <h1>Dota 2 - Bug Tracker</h1>
        <div .nav-link>
          <a href="https://twitter.com/PohkaDota" target="_blank">
            <svg aria-hidden="true" data-prefix="fab" role="img" viewBox="0 0 512 512" ><path fill="currentColor" d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"></path></svg>
          </a>
          <a href="https://github.com/pohka/dota-bug-tracker" target="_blank">
            <svg aria-hidden="true" data-prefix="fab" role="img" viewBox="0 0 512 512" ><path fill="currentColor" d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"></path></svg>
          </a>
        </div>
      </nav>
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
