---
export({
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

      //same as add but this function subtracts
      Date.prototype.sub = function(obj){
        let extra = 0;
        for(let i in obj){
          extra += obj[i] * milliseconds[i];
        }

        this.setTime(this.getTime() - extra);
      }

      //returns a string with the time from now
      // 3 days ago, 1 month ago, in 3 hours, etc
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
