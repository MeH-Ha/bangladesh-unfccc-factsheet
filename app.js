(function(){
'use strict';
var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var $=function(s,r){return (r||document).querySelector(s)};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};

/* ---- reveal on scroll + count-up ---- */
function countUp(el){
  var to=parseFloat(el.dataset.to); if(isNaN(to)) return;
  var dec=+el.dataset.dec||0, pre=el.dataset.prefix||'', suf=el.dataset.suffix||'';
  if(reduce){el.textContent=pre+to.toFixed(dec)+suf;return}
  var t0=null,dur=1100;
  function step(t){ if(!t0)t0=t; var p=Math.min((t-t0)/dur,1), e=1-Math.pow(1-p,3);
    el.textContent=pre+(to*e).toFixed(dec)+suf; if(p<1)requestAnimationFrame(step);}
  requestAnimationFrame(step);
}
var kids={};
var io=('IntersectionObserver' in window)?new IntersectionObserver(function(es){
  es.forEach(function(e){ if(!e.isIntersecting)return; var el=e.target; io.unobserve(el);
    var sibs=$$('.reveal',el.parentNode); var i=Math.max(0,sibs.indexOf(el));
    el.style.transitionDelay=(Math.min(i,5)*70)+'ms'; el.classList.add('in');
    $$('.num',el).forEach(countUp);
    if(el.classList.contains('chart')) el.classList.add('in');
  });
},{threshold:.18}):null;
$$('.reveal,.chart').forEach(function(el){ if(io) io.observe(el); else el.classList.add('in'); });

/* ---- progress bar + back to top ---- */
var bar=$('#progress'), top_=$('#totop');
function onScroll(){
  var h=document.documentElement, max=h.scrollHeight-h.clientHeight, y=window.pageYOffset||h.scrollTop;
  bar.style.width=(max>0?(y/max*100):0)+'%'; top_.classList.toggle('show',y>700);
}
window.addEventListener('scroll',onScroll,{passive:true}); onScroll();
top_.addEventListener('click',function(){window.scrollTo({top:0,behavior:reduce?'auto':'smooth'})});

/* ---- citation popover ---- */
var pop=$('#pop'), cur=null, hideT=null;
function refHTML(k){ var li=$('#ref-'+k); return li?li.innerHTML:''; }
function showPop(el){
  clearTimeout(hideT);
  if(cur&&cur!==el) cur.classList.remove('on');
  cur=el; el.classList.add('on');
  var keys=(el.dataset.refs||'').split(',').filter(Boolean);
  pop.innerHTML=keys.map(function(k){return '<p>'+refHTML(k)+'</p>'}).join('')+
    '<a class="go" href="#ref-'+keys[0]+'" data-go="'+keys[0]+'">Show in reference list ↓</a>';
  pop.hidden=false;
  var r=el.getBoundingClientRect(), sx=window.pageXOffset, sy=window.pageYOffset;
  if(window.innerWidth<=860){ pop.style.left=''; pop.style.top=''; return; }
  var w=pop.offsetWidth, h=pop.offsetHeight;
  var left=Math.min(Math.max(8,r.left+sx-8),sx+document.documentElement.clientWidth-w-8);
  var top=r.bottom+sy+8; if(r.bottom+h+16>window.innerHeight && r.top>h+16) top=r.top+sy-h-8;
  pop.style.left=left+'px'; pop.style.top=top+'px';
}
function hidePop(){ if(cur){cur.classList.remove('on');cur=null} pop.hidden=true; }
$$('.cite').forEach(function(el){
  el.tabIndex=0; el.setAttribute('role','button'); el.setAttribute('aria-label','Show reference for '+el.textContent);
});
document.addEventListener('pointerover',function(e){
  if(e.pointerType==='touch')return; var c=e.target.closest&&e.target.closest('.cite'); if(c) showPop(c);
  else if(e.target.closest&&e.target.closest('#pop')) clearTimeout(hideT);
});
document.addEventListener('pointerout',function(e){
  if(e.pointerType==='touch')return;
  if((e.target.closest&&(e.target.closest('.cite')||e.target.closest('#pop')))){ clearTimeout(hideT); hideT=setTimeout(hidePop,260); }
});
document.addEventListener('click',function(e){
  var c=e.target.closest&&e.target.closest('.cite');
  if(c){ if(cur===c&&!pop.hidden) hidePop(); else showPop(c); e.preventDefault(); return; }
  var go=e.target.closest&&e.target.closest('[data-go]');
  if(go){ e.preventDefault(); var t=$('#ref-'+go.dataset.go); hidePop();
    if(t){ t.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'}); t.classList.add('flash'); setTimeout(function(){t.classList.remove('flash')},1800);} return; }
  if(!(e.target.closest&&e.target.closest('#pop'))) hidePop();
});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape') hidePop();
  if((e.key==='Enter'||e.key===' ')&&e.target.classList&&e.target.classList.contains('cite')){ e.preventDefault(); showPop(e.target); }
});
window.addEventListener('scroll',function(){ if(window.innerWidth>860) hidePop(); },{passive:true});

/* ---- map hazards: pins <-> legend ---- */
var map=$('#mapcard');
function setHaz(k){ $$('[data-k]',map).forEach(function(n){ n.classList.toggle('on',!!k&&n.dataset.k===k); }); }
$$('[data-k]',map).forEach(function(n){
  n.addEventListener('mouseenter',function(){setHaz(n.dataset.k)});
  n.addEventListener('mouseleave',function(){setHaz(null)});
  n.addEventListener('focus',function(){setHaz(n.dataset.k)});
  n.addEventListener('blur',function(){setHaz(null)});
  n.addEventListener('click',function(e){ e.stopPropagation(); var on=n.classList.contains('on')&&n.dataset.touch; setHaz(on?null:n.dataset.k); n.dataset.touch='1'; });
});
document.addEventListener('click',function(e){ if(!(e.target.closest&&e.target.closest('#mapcard'))) setHaz(null); });

/* ---- tooltip helper for charts ---- */
var tip=document.createElement('div'); tip.className='tip'; tip.hidden=true; document.body.appendChild(tip);
function showTip(txt,x,y){ tip.textContent=txt; tip.hidden=false; var w=tip.offsetWidth; tip.style.left=Math.max(8,Math.min(x-w/2,window.innerWidth-w-8))+'px'; tip.style.top=(y-tip.offsetHeight-14)+'px'; }
function hideTip(){tip.hidden=true}
document.addEventListener('click',function(e){ if(!(e.target.closest&&(e.target.closest('.bar')))) hideTip(); });

/* ---- bar chart ---- */
(function(){
  var host=$('#barchart'); if(!host) return;
  var data=[{l:['2022','actual'],v:252,c:'#5b6b66',full:'2022 actual'},
            {l:['2035 if','nothing','changes'],v:418.4,c:'#d9534f',full:'2035 if nothing changes'},
            {l:['2035 own','funds only'],v:391.7,c:'#f2a33a',full:'2035 with own funds only'},
            {l:['2035 all','promises','kept'],v:333.4,c:'#0f766e',full:'2035 if all promises are kept'}];
  var W=360,H=212,base=150,max=500,bw=60,gap=(W-4*bw)/5;
  var s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Emissions in million tonnes of CO2 equivalent">';
  data.forEach(function(d,i){
    var x=gap+i*(bw+gap), h=d.v/max*(base-18), y=base-h;
    s+='<g><rect class="bar" tabindex="0" x="'+x+'" y="'+y+'" width="'+bw+'" height="'+h+'" fill="'+d.c+'" data-i="'+i+'" rx="2"><title>'+d.full+': '+d.v+' Mt CO₂e</title></rect>';
    s+='<text class="barlabel" x="'+(x+bw/2)+'" y="'+(y-5)+'">'+Math.round(d.v)+'</text>';
    s+='<text class="axis" x="'+(x+bw/2)+'" y="'+(base+16)+'">'+d.l.map(function(t,j){return '<tspan x="'+(x+bw/2)+'" dy="'+(j?12:0)+'">'+t+'</tspan>'}).join('')+'</text></g>';
  });
  s+='<line x1="8" x2="'+(W-8)+'" y1="'+base+'" y2="'+base+'" stroke="#8a9a94" stroke-width="1"/></svg>';
  host.innerHTML=s;
  $$('.bar',host).forEach(function(b){
    var d=data[+b.dataset.i], msg=d.full+': '+d.v+' million tonnes CO₂e';
    b.addEventListener('mousemove',function(e){showTip(msg,e.clientX,e.clientY)});
    b.addEventListener('mouseleave',hideTip);
    b.addEventListener('click',function(e){e.stopPropagation(); var r=b.getBoundingClientRect(); showTip(msg,r.left+r.width/2,r.top)});
    b.addEventListener('focus',function(){var r=b.getBoundingClientRect(); showTip(msg,r.left+r.width/2,r.top)});
    b.addEventListener('blur',hideTip);
  });
})();

/* ---- doughnut ---- */
(function(){
  var host=$('#donut'); if(!host) return;
  var parts=[{v:25.95,c:'#0f766e',pct:'22%',name:'Unconditional targets',sub:'paid from own funds (6.39% cut)',amt:'US$25.95bn'},
             {v:90.23,c:'#f2a33a',pct:'78%',name:'Conditional targets',sub:'need foreign support (13.92% cut)',amt:'US$90.23bn'}];
  var tot=parts[0].v+parts[1].v, R=46, C=2*Math.PI*R, cx=60, cy=60, off=0;
  var s='<svg viewBox="0 0 120 120" role="img" aria-label="Doughnut chart of the cost of the emission cuts">';
  var labels='';
  parts.forEach(function(p,i){
    var len=p.v/tot*C, mid=(off+len/2)/C*2*Math.PI-Math.PI/2, lx=cx+R*Math.cos(mid), ly=cy+R*Math.sin(mid)+3;
    s+='<circle class="slice" data-i="'+i+'" tabindex="0" cx="'+cx+'" cy="'+cy+'" r="'+R+'" stroke="'+p.c+'" stroke-width="22" stroke-dasharray="'+len+' '+(C-len)+'" stroke-dashoffset="'+(-off)+'" transform="rotate(-90 '+cx+' '+cy+')"><title>'+p.amt+' ('+p.pct+'): '+p.name+', '+p.sub+'</title></circle>';
    labels+='<text class="dtxt" x="'+lx+'" y="'+ly+'" font-size="9" font-weight="700" fill="#fff">'+p.pct+'</text>';
    off+=len;
  });
  s+=labels+'<text class="dtxt" id="dc1" x="60" y="58" font-size="9.5" font-weight="700" fill="#0b3d2e">US$116.18bn</text><text class="dtxt" id="dc2" x="60" y="69" font-size="7.5" fill="#5b6b66">total</text></svg>';
  s+='<ul class="dkey">'+parts.map(function(p,i){return '<li data-i="'+i+'"><i class="sw" style="background:'+p.c+'"></i><span><b>'+p.amt+' ('+p.pct+'):</b> '+p.name.toLowerCase()+', '+p.sub+'</span></li>'}).join('')+'</ul>';
  host.innerHTML=s;
  var sl=$$('.slice',host), lis=$$('.dkey li',host), c1=$('#dc1',host), c2=$('#dc2',host);
  function set(i){
    sl.forEach(function(n,j){ n.setAttribute('stroke-width',i===j?27:22); n.classList.toggle('dim',i!==null&&i!==j); });
    lis.forEach(function(n,j){ n.classList.toggle('on',i===j); });
    if(i===null){ c1.textContent='US$116.18bn'; c2.textContent='total'; c1.setAttribute('font-size','9.5'); }
    else { c1.textContent=parts[i].amt; c2.textContent=parts[i].pct+' of total'; c1.setAttribute('font-size','10.5'); }
  }
  sl.concat(lis).forEach(function(n){
    var i=+n.dataset.i;
    n.addEventListener('mouseenter',function(){set(i)}); n.addEventListener('mouseleave',function(){set(null)});
    n.addEventListener('focus',function(){set(i)}); n.addEventListener('blur',function(){set(null)});
    n.addEventListener('click',function(e){e.stopPropagation(); set(lis[i].classList.contains('on')?null:i)});
  });
  document.addEventListener('click',function(e){ if(!(e.target.closest&&e.target.closest('#donut'))) set(null); });
})();

/* ---- share / copy link ---- */
var sb=$('#share'), toast=$('#toast');
if(sb) sb.addEventListener('click',function(){
  var url=location.href.split('#')[0], data={title:document.title,text:'UNFCCC in Bangladesh: A Factsheet',url:url};
  function ok(m){toast.textContent=m;setTimeout(function(){toast.textContent=''},2400)}
  if(navigator.share&&/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)){ navigator.share(data).catch(function(){}); return; }
  if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(url).then(function(){ok('Link copied')},function(){ok(url)}); }
  else { var t=document.createElement('textarea'); t.value=url; document.body.appendChild(t); t.select(); try{document.execCommand('copy');ok('Link copied')}catch(x){ok(url)} document.body.removeChild(t); }
});
})();
