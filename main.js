(function(){
  'use strict';
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap=!!(window.gsap&&window.ScrollTrigger);
  var motion=hasGsap&&!reduce;

  /* ============ Tapes: duplicate content so the loop is seamless ============ */
  document.querySelectorAll('.tape-track').forEach(function(t){t.innerHTML+=t.innerHTML;});
  document.querySelectorAll('.tape-track').forEach(function(t){
    // second half is decorative duplicate
    var kids=[].slice.call(t.children);kids.slice(kids.length/2).forEach(function(k){k.setAttribute('aria-hidden','true');});
  });

  /* ============ Orbit: place items evenly on each ring ============ */
  document.querySelectorAll('.ring').forEach(function(ring,ri){
    var items=[].slice.call(ring.querySelectorAll('span'));
    var offset=ri*23;
    items.forEach(function(s,i){
      s.style.setProperty('--a',(offset+i*360/items.length)+'deg');
      var b=document.createElement('b');b.textContent=s.textContent;s.textContent='';s.appendChild(b);
    });
    // restart the ring spin in the same frame the chips start their counter-spin, so labels stay upright
    ring.style.animation='none';void ring.offsetWidth;ring.style.animation='';
  });


  /* ============ Copy email (mailto does nothing on devices without a mail app) ============ */
  (function(){
    var btn=document.getElementById('copy-email'),out=document.getElementById('copy-status');
    if(!btn)return;
    var email=btn.getAttribute('data-email'),timer;
    function say(t){out.textContent=t;clearTimeout(timer);timer=setTimeout(function(){out.textContent='';btn.textContent='Copy email';},2600);}
    function fallback(){
      var ta=document.createElement('textarea');ta.value=email;ta.setAttribute('readonly','');ta.className='sr-copy';
      document.body.appendChild(ta);ta.select();var ok=false;try{ok=document.execCommand('copy');}catch(e){}
      document.body.removeChild(ta);return ok;
    }
    btn.addEventListener('click',function(){
      function done(){btn.textContent='Copied';say('Copied to clipboard');}
      function fail(){say('Copy failed. Select the address above');}
      if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(email).then(done,function(){fallback()?done():fail();});}
      else{fallback()?done():fail();}
    });
  })();

  /* ============ Light / dark toggle ============ */
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
    function set(t,save){root.setAttribute('data-theme',t);if(save){try{localStorage.setItem('fk-theme',t);}catch(e){}}sync();document.dispatchEvent(new Event('themechange'));}
    btn.addEventListener('click',function(){set(root.getAttribute('data-theme')==='paper-dark'?'paper':'paper-dark',true);});
    // follow the device setting live, unless the visitor has chosen manually
    var mq=window.matchMedia('(prefers-color-scheme: dark)');
    var onChange=function(e){var saved=null;try{saved=localStorage.getItem('fk-theme');}catch(err){}if(!saved)set(e.matches?'paper-dark':'paper',false);};
    if(mq.addEventListener)mq.addEventListener('change',onChange);else if(mq.addListener)mq.addListener(onChange);
    sync();
  })();

  /* ============ Trading chart ============ */
  (function(){
    var closes=[120,118,124,122,127,125,121,116,119,114,110,113,118,124,130,128,135,141,138,146,150,147];
    var W=420,H=240,pad=14,n=closes.length,step=(W-pad*2)/n;
    var min=Math.min.apply(null,closes)-10,max=Math.max.apply(null,closes)+10;
    function y(v){return H-pad-((v-min)/(max-min))*(H-pad*2);}
    var NS='http://www.w3.org/2000/svg',g=document.querySelector('.candles');if(!g)return;
    function el(tag,attrs){var e=document.createElementNS(NS,tag);for(var k in attrs)e.setAttribute(k,attrs[k]);return e;}
    var prev=closes[0]-2;
    closes.forEach(function(c,i){
      var o=prev,hi=Math.max(o,c)+3+(i%3),lo=Math.min(o,c)-3-(i%2),x=pad+i*step+step/2,up=c>=o,col=up?'#EEE7DA':'#8E9AA6';
      var grp=el('g',{'class':'cdl'});grp.style.transformOrigin=x+'px '+y((o+c)/2)+'px';
      grp.appendChild(el('line',{x1:x,x2:x,y1:y(hi),y2:y(lo),stroke:col,'stroke-width':1.5}));
      grp.appendChild(el('rect',{x:x-step*0.3,width:step*0.6,y:y(Math.max(o,c)),height:Math.max(2,Math.abs(y(o)-y(c))),rx:1.5,fill:up?col:'none',stroke:col,'stroke-width':1.5}));
      g.appendChild(grp);prev=c;
    });
    function ema(a,p){var k=2/(p+1),e=a[0];return a.map(function(v){return e=v*k+e*(1-k);});}
    function path(a){return a.map(function(v,i){return (i?'L':'M')+(pad+i*step+step/2).toFixed(1)+' '+y(v).toFixed(1);}).join(' ');}
    document.querySelector('.ema-fast').setAttribute('d',path(ema(closes,9)));
    document.querySelector('.ema-slow').setAttribute('d',path(ema(closes,21)));
  })();

  /* ============ ASCII globe with packets leaving Bareilly ============ */
  (function(){
    var canvas=document.getElementById('globe');if(!canvas)return;
    var ctx=canvas.getContext('2d');
    var W,H,cw,ch,cols,rows,R,cx,cy,font='500 12px "Geist Mono", ui-monospace, monospace';
    var D=Math.PI/180,TILT=-0.38;
    var home=[28.37,79.43];
    var cities=[[25.2,55.27,'Dubai'],[51.5,-0.12,'London'],[1.35,103.8,'Singapore'],[50.1,8.68,'Frankfurt'],[38.9,-77.0,'Virginia'],[35.7,139.7,'Tokyo'],[-33.9,151.2,'Sydney']];
    function vec(lat,lon){lat*=D;lon*=D;return [Math.cos(lat)*Math.sin(lon),Math.sin(lat),Math.cos(lat)*Math.cos(lon)];}
    function rot(v,a){var x=v[0]*Math.cos(a)+v[2]*Math.sin(a),z=-v[0]*Math.sin(a)+v[2]*Math.cos(a),y=v[1];
      return [x,y*Math.cos(TILT)-z*Math.sin(TILT),y*Math.sin(TILT)+z*Math.cos(TILT)];}
    function unrot(v,a){var y=v[1]*Math.cos(-TILT)-v[2]*Math.sin(-TILT),z=v[1]*Math.sin(-TILT)+v[2]*Math.cos(-TILT),x=v[0];
      return [x*Math.cos(-a)+z*Math.sin(-a),y,-x*Math.sin(-a)+z*Math.cos(-a)];}
    function slerp(a,b,t){var d=Math.acos(Math.max(-1,Math.min(1,a[0]*b[0]+a[1]*b[1]+a[2]*b[2]))),s=Math.sin(d);
      if(s<1e-6)return a;var k1=Math.sin((1-t)*d)/s,k2=Math.sin(t*d)/s;return [a[0]*k1+b[0]*k2,a[1]*k1+b[1]*k2,a[2]*k1+b[2]*k2];}
    var H0=vec(home[0],home[1]);
    var arcs=cities.map(function(c){var B=vec(c[0],c[1]),pts=[];for(var i=0;i<=40;i++){var t=i/40,p=slerp(H0,B,t),lift=1+0.22*Math.sin(Math.PI*t);pts.push([p[0]*lift,p[1]*lift,p[2]*lift]);}return pts;});
    var shade=' .:-=+*',pal={};
    function readPal(){var s=getComputedStyle(document.documentElement);
      pal={dim:s.getPropertyValue('--globe-dim').trim(),grid:s.getPropertyValue('--globe-grid').trim(),acc:s.getPropertyValue('--accent').trim(),text:s.getPropertyValue('--text').trim(),home:s.getPropertyValue('--copper').trim()};}
    readPal();
    document.addEventListener('themechange',function(){readPal();draw(performance.now());});
    function resize(){
      var dpr=Math.min(window.devicePixelRatio||1,2),r=canvas.getBoundingClientRect();
      W=r.width;H=r.height;canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.font=font;ctx.textBaseline='middle';
      cw=ctx.measureText('M').width||7.2;ch=12.5;cols=Math.floor(W/cw);rows=Math.floor(H/ch);
      R=Math.min(W,H)*0.43;cx=W/2;cy=H/2;
    }
    function toScreen(v){return [cx+v[0]*R,cy-v[1]*R];}
    function draw(t){
      var a=-1.2+t*0.00011;
      ctx.clearRect(0,0,W,H);ctx.font=font;
      var L=[-0.45,0.5,0.74];
      var dim='',grid='';
      for(var j=0;j<rows;j++){
        dim='';grid='';
        var py=(j*ch+ch/2-cy)/R;
        for(var i=0;i<cols;i++){
          var px=(i*cw+cw/2-cx)/R,d=px*px+py*py;
          if(d>1){dim+=' ';grid+=' ';continue;}
          var nz=Math.sqrt(1-d),v=[px,-py,nz];
          var b=Math.max(0,v[0]*L[0]+v[1]*L[1]+v[2]*L[2]);
          var g=unrot(v,a),lat=Math.asin(g[1])/D,lon=Math.atan2(g[0],g[2])/D;
          var onLat=Math.abs(((lat%15)+15)%15-7.5)>6.7;
          var onLon=Math.abs(((lon%15)+15)%15-7.5)>7.5-0.9/Math.max(0.2,Math.cos(lat*D));
          if(onLat||onLon){grid+=b>0.55?'+':(b>0.25?'-':'·');dim+=' ';}
          else{dim+=shade.charAt(Math.min(3,Math.floor(b*4)));grid+=' ';}
        }
        var yy=j*ch+ch/2;
        ctx.fillStyle=pal.dim;ctx.fillText(dim,0,yy);
        ctx.fillStyle=pal.grid;ctx.fillText(grid,0,yy);
      }
      // arcs and packets
      arcs.forEach(function(pts,k){
        ctx.fillStyle=pal.acc;ctx.globalAlpha=.5;
        for(var i=0;i<pts.length;i+=2){var p=rot(pts[i],a);if(p[2]>-0.05){var s=toScreen(p);ctx.fillText('·',s[0]-cw/2,s[1]);}}
        var prog=((t*0.00018)+k/cities.length)%1,idx=Math.floor(prog*(pts.length-1)),pp=rot(pts[idx],a);
        ctx.globalAlpha=1;if(pp[2]>-0.05){var sp=toScreen(pp);ctx.fillStyle=pal.acc;ctx.fillText('■',sp[0]-cw/2,sp[1]);}
        var c=rot(vec(cities[k][0],cities[k][1]),a);
        if(c[2]>0){var sc=toScreen(c);ctx.fillStyle=pal.text;ctx.fillText('o',sc[0]-cw/2,sc[1]);}
      });
      var h=rot(H0,a);
      if(h[2]>0){var s=toScreen(h);ctx.fillStyle=pal.home;ctx.fillText('@',s[0]-cw/2,s[1]);
        ctx.fillText(' Bareilly, IN',s[0]+cw/2,s[1]);}
    }
    var running=false,last=0,raf;
    function loop(t){raf=requestAnimationFrame(loop);if(t-last<33)return;last=t;draw(t);}
    function start(){if(running||reduce)return;running=true;raf=requestAnimationFrame(loop);}
    function stop(){running=false;cancelAnimationFrame(raf);}
    resize();draw(0);
    window.addEventListener('resize',function(){resize();draw(performance.now());});
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){resize();draw(performance.now());});
    if('IntersectionObserver' in window){new IntersectionObserver(function(e){e[0].isIntersecting?start():stop();}).observe(canvas);}
    else start();
  })();

  /* ============ Project modal ============ */
  var P={
    scam:{cat:'Security / Python',title:'Scam Shield',one:'Paste a link, get a risk score before you click.',
      desc:'A Python risk engine for domains and URLs. It combines several weak signals into one clear score so a non-technical person can decide whether to trust a link.',
      pts:['Checks domain age through WHOIS','Validates the TLS certificate','Follows and scores redirect chains','Catches typosquats with substring matching plus Levenshtein distance'],
      stack:'Python / WHOIS / SSL / requests / dnspython',link:'https://github.com/Faraz-khan04',linkText:'View on GitHub'},
    lab:{cat:'Security / Tools',title:'Security Lab',one:'Small tools I wrote to understand attacks from the inside.',
      desc:'Each script started as a question about how something works on the wire or in a log file.',
      pts:['Port scanner: which TCP ports are open and what answers','IOC extractor: pulls IPs, domains, URLs and hashes out of reports','Domain risk scorer: the prototype that grew into Scam Shield','Brute-force alert bot: watches auth logs for repeated failed logins'],
      stack:'Python / scapy / socket / dnspython / paramiko',link:'https://github.com/Faraz-khan04',linkText:'View on GitHub'},
    thr:{cat:'Education / Security',title:'Threshold',one:'A free, structured path into cybersecurity.',
      desc:'Modelled on The Odin Project: 39 modules across six levels that take a complete beginner from how the internet works to real security practice.',
      pts:['39 modules, Level 0 to Level 5','Progress tracking for learners','Full-stack: static frontend with a Flask API'],
      stack:'Flask / SQLAlchemy / HTML / CSS / JavaScript',link:'',linkText:''},
    rej:{cat:'Analytics / Statistics',title:'RejectionIntel',one:'Analytics for your job search that refuses to guess.',
      desc:'It finds where applications stall using real statistics, and only after the maths is done does a language model explain the result in plain English.',
      pts:['Wilson intervals and Benjamini-Hochberg correction','Confidence tiers with honest "not enough data" screens','Guards stop the model inventing numbers or quotes','Ghost-job detection, Kanban tracker and employer reply benchmarks','Found and fixed an auth endpoint that leaked whether an account exists'],
      stack:'Postgres / D3.js / multi-worker backend / LLM narration / 4 test suites',link:'',linkText:''},
    ce:{cat:'Careers / India',title:'Career Edge',one:'Honest career tools for Indian job seekers.',
      desc:'A set of tools that answer real job-search questions with data, and say so when the data is not enough.',
      pts:['JD Simplifier: flags 28 red and 8 green phrases in a job post','CTC to in-hand calculator for FY 2025-26, old and new regimes','Skill ROI ranker and cost-of-living pay comparison','Application tracker that never invents a rejection reason'],
      stack:'Next.js 15 / TypeScript / Prisma / Neon Postgres / Tailwind',link:'',linkText:''},
    djs:{cat:'Careers / Global',title:'Dream Job Sure',one:'See what a salary abroad is really worth.',
      desc:'Career tools for people weighing jobs in the UAE and other markets.',
      pts:['Pay Equity tool using World Bank purchasing-power data','Skill Arbitrage Score: skills ranked by return per study hour','Reverse Salary Search','Covers 25 roles, 44 skills and 8 countries'],
      stack:'Next.js 15 / Drizzle / Supabase / Postgres / Vercel',link:'https://dreamjobsure.com',linkText:'Visit dreamjobsure.com'},
    so:{cat:'Consumer / Mobile',title:'Second Opinion',one:'Photograph a repair bill and see which charges look inflated.',
      desc:'A mobile app for car and home repairs like AC and plumbing. In development.',
      pts:['Reads a quote from a photo','Flags line items above the usual range','Gives you a script for what to say to the shop','Launching in India and the US on Android and iOS'],
      stack:'Mobile / OCR / pricing data',link:'',linkText:''},
    tr:{cat:'Automation / Markets',title:'Trading Systems',one:'Automated strategies for crypto futures and Nifty options.',
      desc:'Engineering-heavy automation work: live data feeds, state, reconnection and risk settings that must never silently break.',
      pts:['Freqtrade strategies for Binance futures','CoinDCX bot built from scratch across nine modules with async SQLite and WebSocket feeds','Angel One options bot trading EMA 9/21 crossovers with reconnect logic'],
      stack:'Freqtrade / pandas / asyncio / Socket.IO / SmartAPI',link:'',linkText:''}
  };
  var modal=document.getElementById('modal'),lastFocus=null,lenis=null;
  /* ============ Project screenshots: add data-shot="projects/<name>.webp" (and optional data-url) to a .proj card ============ */
  document.querySelectorAll('.proj[data-shot]').forEach(function(card){
    var rev=card.querySelector('.reveal'),id=card.getAttribute('data-id'),title=(P[id]&&P[id].title)||'Project';
    var fig=document.createElement('figure');fig.className='shot';
    var bar=document.createElement('div');bar.className='shot-bar';bar.setAttribute('aria-hidden','true');
    for(var i=0;i<3;i++)bar.appendChild(document.createElement('i'));
    var u=document.createElement('span');u.textContent=card.getAttribute('data-url')||title;bar.appendChild(u);
    var img=document.createElement('img');img.src=card.getAttribute('data-shot');img.alt='Screenshot of '+title;img.loading='lazy';img.decoding='async';
    fig.appendChild(bar);fig.appendChild(img);rev.textContent='';rev.appendChild(fig);rev.classList.add('has-shot');
  });

  function openModal(id){
    var d=P[id];if(!d||!modal)return;
    document.getElementById('m-cat').textContent=d.cat;
    document.getElementById('m-title').textContent=d.title;
    document.getElementById('m-one').textContent=d.one;
    document.getElementById('m-desc').textContent=d.desc;
    var ul=document.getElementById('m-points');ul.textContent='';
    d.pts.forEach(function(t){var li=document.createElement('li');li.textContent=t;ul.appendChild(li);});
    document.getElementById('m-stack').textContent=d.stack;
    var card=document.querySelector('.proj[data-id="'+id+'"]'),shot=card&&card.getAttribute('data-shot'),mf=document.getElementById('m-shot');
    if(mf){if(shot){var mi=document.getElementById('m-shot-img');mi.src=shot;mi.alt='Screenshot of '+d.title;mf.hidden=false;}else mf.hidden=true;}
    var a=document.getElementById('m-link');
    if(d.link){a.href=d.link;a.textContent=d.linkText+' ↗';a.hidden=false;}else{a.hidden=true;}
    lastFocus=document.activeElement;
    if(typeof modal.showModal==='function')modal.showModal();else modal.setAttribute('open','');
    if(lenis)lenis.stop();
  }
  function closeModal(){if(modal.open)modal.close();}
  if(modal){
    modal.addEventListener('close',function(){if(lenis)lenis.start();if(lastFocus)lastFocus.focus();});
    modal.addEventListener('click',function(e){if(e.target===modal)closeModal();});
    modal.querySelector('[data-close]').addEventListener('click',closeModal);
  }
  document.querySelectorAll('[data-open]').forEach(function(b){b.addEventListener('click',function(){openModal(b.dataset.open);});});

  /* ============ Motion ============ */
  /* ============ Shell: small terminal. All output goes through textContent, never innerHTML. ============ */
  (function(){
    var out=document.getElementById('term-out'),inp=document.getElementById('term-in');
    if(!out||!inp)return;
    var hist=[],hi=0,busy=false;
    var LINKS={github:'https://github.com/Faraz-khan04',linkedin:'https://www.linkedin.com/in/mohd-faraz-khan-793a76340',tryhackme:'https://tryhackme.com/p/khan.faraz.fk.24'};
    var EMAIL='khan.faraz.fk.2424@gmail.com';
    function line(text,cls){var p=document.createElement('p');if(cls)p.className=cls;p.textContent=text;out.appendChild(p);out.scrollTop=out.scrollHeight;return p;}
    function link(label,href){var p=document.createElement('p');var s=document.createElement('span');s.className='t-dim';s.textContent=label;
      var a=document.createElement('a');a.href=href;a.textContent=href.replace(/^mailto:/,'');if(/^https:/.test(href)){a.target='_blank';a.rel='noopener noreferrer';}
      p.appendChild(s);p.appendChild(a);out.appendChild(p);out.scrollTop=out.scrollHeight;}
    function echo(cmd){var p=document.createElement('p');p.className='t-cmd';var b=document.createElement('b');b.textContent='guest@faraz:~$ ';p.appendChild(b);p.appendChild(document.createTextNode(cmd));out.appendChild(p);}
    function wait(ms){return new Promise(function(r){setTimeout(r,ms);});}
    var C={
      help:function(){[['whoami','who runs this site'],['projects','list projects, then: open <id>'],['skills','what I work with'],['ping','real round-trip time from you to this server'],['headers','security headers this page was served with'],['contact','ways to reach me'],['theme','switch light / dark'],['clear','clear the screen']]
        .forEach(function(r){line(('  '+r[0]+'            ').slice(0,14)+r[1]);});},
      whoami:function(){line('Mohd Faraz Khan');line('B.Tech CSIT, Semester IV, MJPRU Bareilly, India','t-dim');line('Focus: cybersecurity and networking. I also build products.','t-dim');},
      projects:function(){Object.keys(P).forEach(function(k){line(('  '+k+'      ').slice(0,9)+P[k].title+'  ',null).appendChild(Object.assign(document.createElement('span'),{className:'t-dim',textContent:P[k].one}));});line('Type open <id>, for example: open scam','t-dim');},
      open:function(a){var id=(a[0]||'').toLowerCase();if(!P[id]){line('open: no project "'+(a[0]||'')+'". Try: projects','t-err');return;}line('Opening '+P[id].title+'...','t-ok');openModal(id);},
      skills:function(){var s=[].map.call(document.querySelectorAll('.about .chips li'),function(li){return li.textContent;});line(s.join('  /  '));},
      contact:function(){link('email     ','mailto:'+EMAIL);link('github    ',LINKS.github);link('linkedin  ',LINKS.linkedin);link('tryhackme ',LINKS.tryhackme);},
      theme:function(){var t=document.getElementById('themer');if(t){t.click();line('Theme: '+(document.documentElement.getAttribute('data-theme')==='paper-dark'?'dark':'light'),'t-ok');}},
      clear:function(){out.textContent='';},
      ping:function(){
        var host=location.host||'localhost',times=[];line('PING '+host+' over '+location.protocol.replace(':','').toUpperCase()+' (real HTTP requests, not ICMP)','t-dim');
        var seq=0;
        function one(){var t0=performance.now();return fetch('favicon.svg?ping='+Date.now()+'-'+seq,{cache:'no-store'}).then(function(r){var ms=performance.now()-t0;times.push(ms);line('reply from '+host+': seq='+seq+' status='+r.status+' time='+ms.toFixed(1)+' ms',r.ok?'t-ok':'t-err');})
          .catch(function(){line('seq='+seq+' request failed','t-err');});}
        function loop(){if(seq>=4)return Promise.resolve();return one().then(function(){seq++;return seq<4?wait(350).then(loop):null;});}
        return loop().then(function(){if(!times.length)return;var mn=Math.min.apply(null,times),mx=Math.max.apply(null,times),av=times.reduce(function(a,b){return a+b;},0)/times.length;
          line('--- '+times.length+' of 4 replies, min/avg/max = '+mn.toFixed(1)+'/'+av.toFixed(1)+'/'+mx.toFixed(1)+' ms','t-acc');});
      },
      headers:function(){
        line('HEAD '+location.pathname+'  (this page, fetched live)','t-dim');
        return fetch(location.pathname,{method:'HEAD',cache:'no-store'}).then(function(r){
          line('HTTP '+r.status+' '+(r.statusText||''),'t-ok');
          var want=['content-security-policy','strict-transport-security','x-content-type-options','x-frame-options','referrer-policy','permissions-policy','cross-origin-opener-policy'],found=0;
          want.forEach(function(h){var v=r.headers.get(h);if(v){found++;line(h+': '+v);}else line(h+': (not set by this host)','t-dim');});
          var meta=document.querySelector('meta[http-equiv="Content-Security-Policy"]');
          if(!r.headers.get('content-security-policy')&&meta)line('CSP is still enforced here through a <meta> tag in the page.','t-acc');
          line(found+' of '+want.length+' security headers present.','t-acc');
        }).catch(function(){line('headers: request failed','t-err');});
      },
      sudo:function(){line('guest is not in the sudoers file. This incident has been noted.','t-err');},
      ls:function(){C.projects();}
    };
    function run(raw){
      var cmd=raw.trim().replace(/\s+/g,' ');echo(cmd);if(!cmd){return;}
      hist.push(cmd);hi=hist.length;
      var parts=cmd.split(' '),name=parts[0].toLowerCase(),fn=C[name];
      if(!fn){line(name+': command not found. Type help.','t-err');return;}
      busy=true;inp.disabled=true;
      Promise.resolve(fn(parts.slice(1))).then(function(){busy=false;inp.disabled=false;},function(){busy=false;inp.disabled=false;});
    }
    inp.addEventListener('keydown',function(e){
      if(e.key==='Enter'){e.preventDefault();if(busy)return;var v=inp.value;inp.value='';run(v);}
      else if(e.key==='ArrowUp'){if(hist.length){hi=Math.max(0,hi-1);inp.value=hist[hi];e.preventDefault();}}
      else if(e.key==='ArrowDown'){if(hist.length){hi=Math.min(hist.length,hi+1);inp.value=hist[hi]||'';e.preventDefault();}}
    });
    document.querySelectorAll('.term-chips button').forEach(function(b){b.addEventListener('click',function(){if(!busy)run(b.getAttribute('data-cmd'));});});
    out.addEventListener('click',function(e){if(e.target.tagName!=='A'&&!window.getSelection().toString())inp.focus({preventScroll:true});});
    line('Connected to '+(location.host||'localhost')+' over '+location.protocol.replace(':','').toUpperCase()+'.','t-dim');
    line('Type help to see what this shell can do.','t-dim');
  })();

  /* ============ Hero mesh: dotted cables between the floating devices, packets moving along them ============ */
  (function(){
    var cv=document.getElementById('mesh');if(!cv||!cv.getContext)return;
    var ctx=cv.getContext('2d'),hero=document.querySelector('.hero'),dpr=1,W=0,H=0,raf=0,running=false,col={};
    var LINKS=[['o-router','o-lock'],['o-router','o-term'],['o-key','o-term'],['o-term','o-eth'],['o-lock','o-eth'],['o-router','o-key']];
    var nodes={};LINKS.forEach(function(l){l.forEach(function(c){if(!nodes[c])nodes[c]=document.querySelector('.'+c+' svg');});});
    function colors(){var cs=getComputedStyle(document.documentElement);col.line=cs.getPropertyValue('--muted').trim();col.pkt=cs.getPropertyValue('--accent').trim();}
    function resize(){var r=cv.getBoundingClientRect();dpr=Math.min(window.devicePixelRatio||1,2);W=r.width;H=r.height;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
    function center(el,base){var r=el.getBoundingClientRect();if(!r.width)return null;return {x:r.left+r.width/2-base.left,y:r.top+r.height/2-base.top};}
    function bez(a,c,b,t){var u=1-t;return {x:u*u*a.x+2*u*t*c.x+t*t*b.x,y:u*u*a.y+2*u*t*c.y+t*t*b.y};}
    function draw(t){
      ctx.clearRect(0,0,W,H);var base=cv.getBoundingClientRect(),pts={};
      Object.keys(nodes).forEach(function(k){if(nodes[k])pts[k]=center(nodes[k],base);});
      LINKS.forEach(function(l,i){
        var a=pts[l[0]],b=pts[l[1]];if(!a||!b)return;
        var mx=(a.x+b.x)/2,my=(a.y+b.y)/2,dist=Math.hypot(b.x-a.x,b.y-a.y),c={x:mx,y:my+dist*.12};
        ctx.globalAlpha=.42;ctx.strokeStyle=col.line;ctx.lineWidth=1.4;ctx.setLineDash([1.5,7]);ctx.lineCap='round';
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(c.x,c.y,b.x,b.y);ctx.stroke();ctx.setLineDash([]);
        if(t==null)return;
        for(var k=0;k<2;k++){
          var speed=7000+i*900,ph=((t/speed)+k*.5+i*.17)%1,dir=(i%2)?ph:1-ph,p=bez(a,c,b,dir);
          var fade=Math.sin(ph*Math.PI);ctx.globalAlpha=.85*fade;ctx.fillStyle=col.pkt;
          ctx.beginPath();if(ctx.roundRect)ctx.roundRect(p.x-3.5,p.y-3.5,7,7,1.5);else ctx.rect(p.x-3.5,p.y-3.5,7,7);ctx.fill();
        }
      });
      ctx.globalAlpha=1;
    }
    function loop(t){raf=requestAnimationFrame(loop);draw(t);}
    function start(){if(running)return;if(reduce){draw(null);return;}running=true;raf=requestAnimationFrame(loop);}
    function stop(){running=false;cancelAnimationFrame(raf);}
    colors();resize();draw(reduce?null:0);
    window.addEventListener('resize',function(){resize();draw(reduce?null:performance.now());});
    document.addEventListener('themechange',function(){colors();if(!running)draw(reduce?null:performance.now());});
    if('IntersectionObserver' in window){new IntersectionObserver(function(e){e[0].isIntersecting?start():stop();}).observe(hero);}else start();
    window.addEventListener('load',function(){resize();if(!running)draw(null);});
  })();

  /* ============ On the wire: wrap the request one layer at a time as the section scrolls ============ */
  (function(){
    var sec=document.querySelector('.encap');if(!sec)return;
    var lyrs=[].slice.call(sec.querySelectorAll('.lyr')),legs=[].slice.call(sec.querySelectorAll('.osi li')),bytes=document.getElementById('encap-bytes');
    var SIZES=[16,36,56,74],cur=-1;
    function set(step){
      if(step===cur)return;cur=step;
      lyrs.forEach(function(l){l.classList.toggle('off',+l.getAttribute('data-step')>step);});
      legs.forEach(function(l){l.classList.toggle('on',+l.getAttribute('data-step')<=step);});
      if(bytes)bytes.textContent=SIZES[step]+' bytes';
    }
    if(!motion){set(3);return;}
    set(0);
    var small=window.matchMedia('(max-width:700px)').matches;
    ScrollTrigger.create(small?{trigger:'.frame',start:'top 80%',end:'bottom 45%',onUpdate:function(s){set(Math.min(3,Math.floor(s.progress*4)));}}
      :{trigger:sec,start:'top top',end:'bottom bottom',onUpdate:function(s){set(Math.min(3,Math.floor(s.progress*4.4)));}});
  })();

  /* ============ Living ASCII: shared loop that only runs while an element is on screen ============ */
  function liveLoop(el,frame,fps){
    var on=false,raf=0,last=0,gap=1000/fps;
    function tick(t){raf=requestAnimationFrame(tick);if(t-last<gap)return;last=t;frame(t);}
    function start(){if(on||reduce)return;on=true;raf=requestAnimationFrame(tick);}
    function stop(){on=false;cancelAnimationFrame(raf);}
    frame(reduce?4000:0);
    if('IntersectionObserver' in window)new IntersectionObserver(function(e){e[0].isIntersecting?start():stop();},{rootMargin:'80px'}).observe(el);else start();
    return function(){if(!on)frame(performance.now());};
  }
  function cssv(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim();}
  function asciiCanvas(cv,size){
    var ctx=cv.getContext('2d'),o={ctx:ctx,W:0,H:0,cw:7.2,ch:size+1.5};
    o.resize=function(){var dpr=Math.min(window.devicePixelRatio||1,2),r=cv.getBoundingClientRect();o.W=r.width;o.H=r.height;cv.width=Math.round(o.W*dpr);cv.height=Math.round(o.H*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.font='500 '+size+'px "Geist Mono", ui-monospace, monospace';ctx.textBaseline='middle';ctx.textAlign='center';o.cw=ctx.measureText('M').width||size*.6;};
    o.resize();return o;
  }

  /* Project cards: a moving ASCII field behind each title. Light characters in ink, dense ones in the accent colour. */
  (function(){
    var RAMP=' .:-=+*#%',HOT=5;
    [].forEach.call(document.querySelectorAll('.proj .cover'),function(cover,idx){
      var ink=document.createElement('pre'),hot=document.createElement('pre');
      ink.className='cover-ascii ca-ink';hot.className='cover-ascii ca-hot';ink.setAttribute('aria-hidden','true');hot.setAttribute('aria-hidden','true');
      cover.insertBefore(hot,cover.firstChild);cover.insertBefore(ink,cover.firstChild);
      var cols=0,rows=0,s=idx*1.7+0.4,a=0.11+(idx%3)*0.03,b=0.19+(idx%4)*0.025;
      function size(){cols=Math.ceil(cover.clientWidth/6.6)+1;rows=Math.ceil(cover.clientHeight/12)+1;}
      size();
      var redraw=liveLoop(cover,function(t){
        var tt=t*0.00045,cx=cols*0.76,cy=rows*0.3,o1='',o2='';
        for(var y=0;y<rows;y++){for(var x=0;x<cols;x++){
          var d=Math.sqrt((x-cx)*(x-cx)*0.36+(y-cy)*(y-cy)),
              v=Math.sin(x*a+tt*2+s)+Math.sin(y*b-tt*1.6+s)+Math.sin(d*0.42-tt*3)+Math.sin((x+y)*0.05+tt);
          v=(v+4)/8;v=Math.pow(v,1.9);var k=Math.min(RAMP.length-1,Math.floor(v*RAMP.length*1.25)),ch=RAMP[k];
          if(k>=HOT){o2+=ch;o1+=' ';}else{o1+=ch;o2+=' ';}
        }o1+='\n';o2+='\n';}
        ink.textContent=o1;hot.textContent=o2;
      },9);
      var rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){size();redraw();},200);});
    });
  })();

  /* Signal band: random noise on the left, a clean sine wave on the right */
  (function(){
    var cv=document.getElementById('signal');if(!cv)return;
    var A=asciiCanvas(cv,12),col={};
    function pal(){col.dim=cssv('--muted');col.acc=cssv('--accent');col.line=cssv('--line');}
    pal();
    var NOISE='#%&*+=-:;<>?/\\|01';
    var redraw=liveLoop(cv,function(t){
      var c=A.ctx,cols=Math.floor(A.W/A.cw),rows=Math.max(5,Math.floor(A.H/A.ch)),mid=(rows-1)/2,amp=mid*0.85;
      c.clearRect(0,0,A.W,A.H);
      for(var x=0;x<cols;x++){
        var f=x/cols,clean=Math.min(1,Math.max(0,(f-0.22)/0.4));clean=clean*clean*(3-2*clean);
        var wy=mid+amp*Math.sin(x*0.16-t*0.003)*(0.35+0.65*clean),px=(x+0.5)*A.cw;
        for(var y=0;y<rows;y++){
          var py=(y+0.5)*A.ch,r=Math.random();
          if(Math.abs(y-wy)<0.55&&r<0.25+clean*0.75){c.globalAlpha=0.35+clean*0.65;c.fillStyle=col.acc;c.fillText(clean>0.8?'*':'+',px,py);}
          else if(r<(1-clean)*0.2){c.globalAlpha=0.55*(1-clean)+0.1;c.fillStyle=col.dim;c.fillText(NOISE[(Math.random()*NOISE.length)|0],px,py);}
          else if(Math.abs(y-mid)<0.5&&x%2===0){c.globalAlpha=0.28;c.fillStyle=col.dim;c.fillText('.',px,py);}
        }
      }
      c.globalAlpha=1;
    },14);
    window.addEventListener('resize',function(){A.resize();redraw();});
    document.addEventListener('themechange',function(){pal();redraw();});
  })();

  /* Radar: an ASCII ping sweep that lights up hosts as the beam passes them */
  (function(){
    var cv=document.getElementById('radar');if(!cv)return;
    var A=asciiCanvas(cv,11),col={};
    function pal(){col.dim=cssv('--muted');col.acc=cssv('--accent');col.txt=cssv('--text');}
    pal();
    var HOSTS=[[0.35,0.55,'.1'],[1.4,0.72,'.7'],[2.3,0.4,'.12'],[3.3,0.85,'.23'],[4.1,0.6,'.54'],[5.2,0.3,'.101'],[5.8,0.78,'.200']],hit=HOSTS.map(function(){return -1e9;});
    var RAMP=' .:-=+*#',TAU=Math.PI*2,SPIN=4200,prevA=null;
    var redraw=liveLoop(cv,function(t){
      var c=A.ctx,cols=Math.floor(A.W/A.cw),rows=Math.floor(A.H/A.ch),cx=cols/2,cy=rows/2,asp=A.ch/A.cw,R=Math.min(cx,cy*asp)-1;
      var sweep=(t%SPIN)/SPIN*TAU;
      if(prevA!==null){HOSTS.forEach(function(h,i){var d=(sweep-h[0]+TAU)%TAU,p=(sweep-prevA+TAU)%TAU;if(d<=p)hit[i]=t;});}prevA=sweep;
      c.clearRect(0,0,A.W,A.H);
      for(var y=0;y<rows;y++){for(var x=0;x<cols;x++){
        var dx=(x+0.5-cx),dy=(y+0.5-cy)*asp,dist=Math.sqrt(dx*dx+dy*dy)/R;if(dist>1.02)continue;
        var ang=(Math.atan2(dy,dx)+TAU)%TAU,lag=(sweep-ang+TAU)%TAU,px=(x+0.5)*A.cw,py=(y+0.5)*A.ch,ch=null,al=0,cl=col.dim;
        if(lag<1.1&&dist<=1){var k=1-lag/1.1;ch=RAMP[Math.max(1,Math.floor(k*k*(RAMP.length-1)))];al=0.15+0.75*k*k;cl=col.acc;}
        else if(Math.abs(dist-1)<0.035||Math.abs(dist-0.66)<0.03||Math.abs(dist-0.33)<0.03){ch='.';al=0.6;}
        else if((Math.abs(dx)<0.5||Math.abs(dy)<0.5*asp)&&dist<1){ch=Math.abs(dx)<0.5?':':'-';al=0.22;}
        if(ch){c.globalAlpha=al;c.fillStyle=cl;c.fillText(ch,px,py);}
      }}
      HOSTS.forEach(function(h,i){
        var age=(t-hit[i])/2600;if(age>1&&!reduce)return;var a=reduce?0.9:1-age;
        var hx=cx+Math.cos(h[0])*h[1]*R,hy=cy+Math.sin(h[0])*h[1]*R/asp,px=hx*A.cw,py=hy*A.ch;
        c.globalAlpha=a;c.fillStyle=col.acc;c.fillText('o',px,py);
        c.globalAlpha=a*0.9;c.fillStyle=col.txt;c.textAlign='left';c.fillText(h[2],px+A.cw*0.9,py);c.textAlign='center';
      });
      c.globalAlpha=1;c.fillStyle=col.acc;c.fillText('+',cx*A.cw,cy*A.ch);
    },20);
    window.addEventListener('resize',function(){A.resize();redraw();});
    document.addEventListener('themechange',function(){pal();redraw();});
  })();

  /* Scroll scanner: ticks in the corner track your position on the page */
  (function(){
    var el=document.getElementById('scan');if(!el)return;
    var N=44,bars=[],cur=-1,tick=false;
    for(var i=0;i<N;i++){var b=document.createElement('i');b.style.setProperty('--h',(7+((i*37)%13))+'px');el.appendChild(b);bars.push(b);}
    function upd(){tick=false;var max=document.documentElement.scrollHeight-innerHeight,p=max>0?Math.min(1,Math.max(0,scrollY/max)):0,k=Math.round(p*(N-1));
      if(k===cur)return;if(cur>=0){bars[cur].classList.remove('on');[cur-1,cur+1].forEach(function(j){if(bars[j])bars[j].classList.remove('near');});}
      cur=k;bars[k].classList.add('on');[k-1,k+1].forEach(function(j){if(bars[j])bars[j].classList.add('near');});}
    window.addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(upd);}},{passive:true});
    window.addEventListener('resize',upd);upd();
  })();

  if(!motion)return;
  gsap.registerPlugin(ScrollTrigger);
  if(window.Lenis){
    lenis=new Lenis({lerp:.1});
    lenis.on('scroll',ScrollTrigger.update);
    gsap.ticker.add(function(t){lenis.raf(t*1000);});
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(function(a){a.addEventListener('click',function(e){
      var t=document.querySelector(a.getAttribute('href'));if(t){e.preventDefault();lenis.scrollTo(t,{duration:1.3});}
    });});
  }

  // Hero: letters rise, objects drop in
  document.querySelectorAll('.ht').forEach(function(l){l.innerHTML=l.textContent.split('').map(function(c){return '<span class="ch">'+c+'</span>';}).join('');});
  gsap.timeline({defaults:{ease:'expo.out'}})
    .from('.ht-a .ch',{yPercent:110,duration:1.2,stagger:.05})
    .from('.ht-mid em',{opacity:0,y:30,duration:1},.3)
    .from('.ht-name',{opacity:0,x:-14,duration:1},.45)
    .from('.ht-b .ch',{yPercent:-110,duration:1.2,stagger:.05},.15)
    .from('.obj',{opacity:0,scale:.6,y:60,duration:1.3,stagger:.08,ease:'back.out(1.6)'},.5)
    .from('.hero-sub, .hero-cta',{opacity:0,y:20,duration:1,stagger:.1},.9);

  // Hero on scroll: objects drift apart at different speeds
  var drift=[[-120,-90,-25],[90,-140,30],[-80,110,20],[120,90,-30],[160,-40,15]];
  document.querySelectorAll('.obj').forEach(function(o,i){
    var d=drift[i]||[0,-80,10];
    gsap.to(o,{x:d[0],y:d[1],rotate:d[2],ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
  });
  gsap.to('.hero-title',{yPercent:18,opacity:.2,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});

  // Section headings
  gsap.utils.toArray('.about-main h2, .orbit-head h2, .globe-copy h2, .work-head h2').forEach(function(h){
    gsap.from(h,{y:50,opacity:0,duration:1.1,ease:'expo.out',scrollTrigger:{trigger:h,start:'top 85%',once:true}});
  });
  gsap.from('.about-art',{opacity:0,x:-30,duration:1.1,ease:'expo.out',scrollTrigger:{trigger:'.about',start:'top 70%',once:true}});
  gsap.from('.timeline li, .chips li',{opacity:0,y:14,duration:.6,stagger:.03,ease:'power2.out',scrollTrigger:{trigger:'.timeline',start:'top 85%',once:true}});

  // Polaroids: dealt onto the table
  gsap.from('.pol',{y:120,opacity:0,rotate:function(i){return [-20,12,18][i];},duration:1.2,stagger:.14,ease:'expo.out',clearProps:'transform',
    scrollTrigger:{trigger:'.polaroids',start:'top 85%',once:true}});

  // Orbit grows in
  gsap.from('.orbit-wrap',{scale:.75,opacity:0,duration:1.4,ease:'expo.out',scrollTrigger:{trigger:'.orbit-wrap',start:'top 80%',once:true}});
  gsap.from('.core',{scale:0,duration:1,ease:'back.out(2)',scrollTrigger:{trigger:'.orbit-wrap',start:'top 75%',once:true}});

  // Project cards
  gsap.from('.proj',{y:60,opacity:0,duration:1,stagger:.08,ease:'expo.out',scrollTrigger:{trigger:'.grid',start:'top 85%',once:true}});

  // Contact
  gsap.from('.contact h2',{y:80,opacity:0,duration:1.2,ease:'expo.out',scrollTrigger:{trigger:'.contact h2',start:'top 90%',once:true}});
  gsap.from('.steps li, .mailbox, .links li',{y:24,opacity:0,duration:.8,stagger:.06,ease:'power3.out',scrollTrigger:{trigger:'.steps',start:'top 85%',once:true}});

  // Project visuals play the first time a card is revealed
  var viz={
    scam:function(p){var arc=p.querySelector('.gauge-arc'),val=p.querySelector('.gauge-val'),o={v:0};
      gsap.timeline().fromTo(arc,{strokeDashoffset:377},{strokeDashoffset:49,duration:1.5,ease:'power3.out'})
        .to(o,{v:87,duration:1.5,ease:'power3.out',onUpdate:function(){val.textContent=Math.round(o.v);}},0)
        .from(p.querySelectorAll('.checks li'),{x:-14,opacity:0,stagger:.15,duration:.5},.4);},
    lab:function(p){gsap.from(p.querySelectorAll('.v-lab p'),{opacity:0,x:-10,stagger:.22,duration:.4});},
    thr:function(p){gsap.from(p.querySelectorAll('.dots i'),{scale:0,duration:.35,ease:'back.out(3)',stagger:.02});},
    rej:function(p){gsap.timeline().from(p.querySelectorAll('.frow i'),{width:0,duration:.9,stagger:.14,ease:'power3.out'}).from(p.querySelector('.verdict'),{opacity:0,y:10,duration:.5},'-=.3');},
    ce:function(p){gsap.timeline().from(p.querySelectorAll('.jd mark'),{backgroundSize:'0% 100%',duration:.45,stagger:.22}).from(p.querySelectorAll('.jd-sum span'),{opacity:0,y:8,stagger:.1,duration:.4});},
    djs:function(p){var bars=p.querySelectorAll('.bar'),mode=p.querySelector('.pay-mode'),tl=gsap.timeline();
      tl.call(function(){mode.textContent='nominal salary in usd';});
      bars.forEach(function(b,i){tl.fromTo(b.querySelector('i'),{'--h':'0%'},{'--h':b.dataset.n,duration:.8,ease:'power3.out'},i*.07);});
      tl.call(function(){mode.textContent='adjusted for cost of living';},null,'+=.6');
      bars.forEach(function(b,i){tl.to(b.querySelector('i'),{'--h':b.dataset.a,duration:.9,ease:'power3.inOut'},i?'<.05':'>');});},
    so:function(p){gsap.timeline().from(p.querySelectorAll('.row'),{opacity:0,y:6,stagger:.1,duration:.35}).from(p.querySelector('.strike'),{scaleX:0,duration:.5,ease:'power2.inOut'},'+=.15').from(p.querySelector('.note'),{opacity:0,y:8,duration:.4});},
    tr:function(p){var tl=gsap.timeline();tl.from(p.querySelectorAll('.cdl'),{scaleY:0,opacity:0,duration:.3,stagger:.03});
      p.querySelectorAll('.ema').forEach(function(e,i){var L=e.getTotalLength();tl.fromTo(e,{strokeDasharray:L,strokeDashoffset:L},{strokeDashoffset:0,duration:1.3,ease:'power2.inOut'},.35+i*.2);});}
  };
  var touch=window.matchMedia('(hover: none)').matches;
  document.querySelectorAll('.proj').forEach(function(p){
    var fn=viz[p.dataset.id];if(!fn||p.hasAttribute('data-shot'))return;
    var played=false;function play(){if(played)return;played=true;fn(p);}
    if(touch){ScrollTrigger.create({trigger:p,start:'top 75%',once:true,onEnter:play});}
    else{p.addEventListener('mouseenter',function(){setTimeout(play,250);});p.addEventListener('focusin',play);}
  });

  /* ============ Finale: Probe drops in on its cable, Lock peeks up, then they ping/pong ============ */
  if(motion&&document.querySelector('.finale')){
    var ft={trigger:'.finale',start:'top bottom',end:'bottom bottom',scrub:.6};
    gsap.timeline({scrollTrigger:ft})
      .from('.fin-bot',{yPercent:-110,ease:'power1.out',duration:1},0)
      .from('.fin-lock',{yPercent:75,ease:'power2.out',duration:.7},.25)
      .from('.b-ping',{opacity:0,y:6,duration:.15},.8)
      .from('.b-pong',{opacity:0,y:6,duration:.15},.9);
  }


  window.addEventListener('load',function(){ScrollTrigger.refresh();});
})();
