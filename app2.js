(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s)};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};

/* ---- timeline filter ---- */
var tl=$('#tl2'), count=$('#tcount');
if(tl){
  var items=$$('.ti',tl), btns=$$('.tfilters .chipf[data-f]');
  function apply(f){
    var n=0,last=null;
    items.forEach(function(li){
      var show=(f==='all'||li.dataset.cat===f);
      li.classList.toggle('hide',!show); li.classList.remove('vlast','L','R');
      if(show){ li.classList.add(n%2===0?'L':'R'); n++; last=li; }
      if(show){ li.style.animation='none'; void li.offsetWidth; li.style.animation=''; }
    });
    if(last) last.classList.add('vlast');
    count.textContent='Showing '+n+' of '+items.length+' milestones';
  }
  btns.forEach(function(b){ b.addEventListener('click',function(){
    btns.forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')}); apply(b.dataset.f);
  });});
  apply('all');
}

/* ---- tooltip ---- */
var tip=document.createElement('div'); tip.className='tip'; tip.hidden=true; document.body.appendChild(tip);
function showTip(t,x,y){ tip.textContent=t; tip.hidden=false; var w=tip.offsetWidth; tip.style.left=Math.max(8,Math.min(x-w/2,window.innerWidth-w-8))+'px'; tip.style.top=(y-tip.offsetHeight-14)+'px'; }
function hideTip(){tip.hidden=true}
document.addEventListener('click',function(e){ if(!(e.target.closest&&e.target.closest('.pbar'))) hideTip(); });

/* ---- pledge chart ---- */
var host=$('#pledgechart');
if(host){
  var rows=[
    {n:'INDC 2015',y:'target 2030',mt:[12,24],pc:[5,10]},
    {n:'Updated NDC 2021',y:'target 2030',mt:[27.56,61.9],pc:[6.73,15.12]},
    {n:'NDC 3.0 (2025)',y:'target 2035',mt:[26.74,58.23],pc:[6.39,13.92]}];
  var unit='mt';
  function fmt(v,u){ return u==='mt' ? (v%1? v.toFixed(2).replace(/0$/,''):String(v))+' Mt' : v+'%'; }
  function draw(){
    var W=720,rowH=62,H=rows.length*rowH+34,left=170,right=60,span=W-left-right,max=unit==='mt'?100:25;
    var s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Unconditional and conditional cuts by pledge">';
    [0,25,50,75,100].forEach(function(t){ if(unit==='pct'){ t=t/4; } var x=left+(t/max)*span;
      s+='<line x1="'+x+'" x2="'+x+'" y1="6" y2="'+(H-26)+'" stroke="#dfe9e4"/><text class="pnote" x="'+x+'" y="'+(H-8)+'" text-anchor="middle">'+t+(unit==='mt'?'':'%')+'</text>'; });
    rows.forEach(function(r,i){
      var v=unit==='mt'?r.mt:r.pc, y=14+i*rowH, w1=v[0]/max*span, w2=v[1]/max*span;
      s+='<text class="plabel" x="0" y="'+(y+16)+'">'+r.n+'</text><text class="pnote" x="0" y="'+(y+32)+'">'+r.y+'</text>';
      s+='<rect class="pbar" tabindex="0" data-r="'+i+'" data-p="u" x="'+left+'" y="'+y+'" width="'+w1+'" height="34" fill="#0f766e" rx="3"/>';
      s+='<rect class="pbar" tabindex="0" data-r="'+i+'" data-p="c" x="'+(left+w1)+'" y="'+y+'" width="'+w2+'" height="34" fill="#f2a33a" rx="3"/>';
      s+='<text class="ptext" x="'+(left+w1/2)+'" y="'+(y+21)+'" text-anchor="middle" fill="#fff">'+fmt(v[0],unit)+'</text>';
      s+='<text class="ptext" x="'+(left+w1+w2/2)+'" y="'+(y+21)+'" text-anchor="middle" fill="#1b2b27">'+fmt(v[1],unit)+'</text>';
      s+='<text class="plabel" x="'+(left+w1+w2+8)+'" y="'+(y+21)+'">'+fmt(Math.round((v[0]+v[1])*100)/100,unit)+'</text>';
    });
    host.innerHTML=s+'</svg>';
    $$('.pbar',host).forEach(function(b){
      var r=rows[+b.dataset.r], v=unit==='mt'?r.mt:r.pc, isU=b.dataset.p==='u';
      var msg=r.n+': '+(isU?'unconditional (own resources) ':'conditional (needs foreign support) ')+fmt(isU?v[0]:v[1],unit);
      b.addEventListener('mousemove',function(e){showTip(msg,e.clientX,e.clientY)});
      b.addEventListener('mouseleave',hideTip);
      b.addEventListener('click',function(e){e.stopPropagation(); var q=b.getBoundingClientRect(); showTip(msg,q.left+q.width/2,q.top)});
      b.addEventListener('focus',function(){var q=b.getBoundingClientRect(); showTip(msg,q.left+q.width/2,q.top)});
      b.addEventListener('blur',hideTip);
      b.style.transform='scaleX(1)'; /* keep visible after redraw */
    });
  }
  draw();
  $$('.ptoggle .chipf').forEach(function(b){ b.addEventListener('click',function(){
    unit=b.dataset.u; $$('.ptoggle .chipf').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')}); draw();
  });});
}
})();
