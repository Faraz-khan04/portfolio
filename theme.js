/* Runs before first paint. Uses the visitor's saved choice, otherwise their device's light/dark setting. */
(function(){
  var t=null;
  try{t=localStorage.getItem('fk-theme');}catch(e){}
  if(t!=='paper'&&t!=='paper-dark'){t=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'paper-dark':'paper';}
  document.documentElement.setAttribute('data-theme',t);
})();
