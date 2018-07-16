---
/**
  # module
  ---
  Handles scroll events and actions
  ---
*/
export({
  /**
    ---
    scrolls on Y-Axis to the top of the element with a matching id to the url hash. If no element is found with a matching ID nothing will happen

    Note:
    The dom must by mounted to find it, so make sure you call this function after rendering your component.
    If you are using the Router module you must also call this in onAfterPush( )
    ---

    @param {Number} offsetY - offset from the top of the element
  */
  toHash(offsetY){
    let hash = window.location.hash;
    if(hash){
      let el = document.querySelector(hash);
      if(el != null){
        let y = el.offsetTop;
        if(offsetY){
          y += offsetY;
        }
        window.scrollTo(0, y);
      }
    }
  }
});
