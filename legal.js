/* Theme toggle for privacy.html and terms.html. Same behaviour and storage key ("fk-theme") as main.js. */
(function(){
  var root=document.documentElement,btn=document.getElementById('themer'),meta=document.querySelector('meta[name="theme-color"]');
  if(!btn)return;
  var label=btn.querySelector('.t-label');
  function sync(){
    var dark=root.getAttribute('data-theme')==='paper-dark';
    btn.setAttribute('aria-pressed',dark?'true':'false');
    btn.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');
    label.textContent=dark?'Light mode':'Dark mode';
    if(meta)meta.setAttribute('content',getComputedStyle(root).getPropertyValue('--bg').trim());
  }
  function set(t,save){root.setAttribute('data-theme',t);if(save){try{localStorage.setItem('fk-theme',t);}catch(e){}}sync();}
  btn.addEventListener('click',function(){set(root.getAttribute('data-theme')==='paper-dark'?'paper':'paper-dark',true);});
  var mq=window.matchMedia('(prefers-color-scheme: dark)');
  var onChange=function(e){var saved=null;try{saved=localStorage.getItem('fk-theme');}catch(err){}if(!saved)set(e.matches?'paper-dark':'paper',false);};
  if(mq.addEventListener)mq.addEventListener('change',onChange);else if(mq.addListener)mq.addListener(onChange);
  sync();
})();
