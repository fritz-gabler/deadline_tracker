(function(){
'use strict';

var DKEY='deadline-tracker-draft-v1';
var COLORS=['#5B7FA6','#6BAF5B','#8E7DB8','#C79A5B','#5E9C9A','#7C8594'];
var STATUS={open:'Offen',doing:'In Arbeit',done:'Erledigt'};
var NEXT={open:'doing',doing:'done',done:'open'};
var ACT={open:'Starten',doing:'Fertig',done:'Wieder öffnen'};
var DATE_RE=/^\d{4}-\d{2}-\d{2}$/;
var WD=['Mo','Di','Mi','Do','Fr','Sa','So'];
var ICONS={
  cal:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="4"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  clock:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  inbox:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/></svg>',
  pin:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5M9 3h6l-1 7 4 4H6l4-4z"/></svg>',
  gear:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>'
};

/* ---------- Hilfsfunktionen ---------- */
function $(s,r){return (r||document).querySelector(s);}
function uid(){return 'x'+Math.random().toString(36).slice(2,9);}
function pad(n){return String(n).padStart(2,'0');}
function iso(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function parse(s){var p=s.split('-').map(Number);return new Date(p[0],p[1]-1,p[2]);}
function addDays(d,n){var x=new Date(d);x.setDate(x.getDate()+n);return x;}
function today(){return iso(new Date());}
function diffDays(a,b){return Math.round((parse(b)-parse(a))/864e5);}
function fmtLong(s){return parse(s).toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'});}
function fmtDay(s){return parse(s).toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit'});}
function fmtH(x){return (Math.round(x*10)/10).toString().replace('.',',')+' Std.';}
function fmtDur(x){return x<1?Math.round(x*60)+' Min.':fmtH(x);}
function toMin(s){var p=s.split(':');return (+p[0])*60+(+p[1]||0);}
function toTime(m){return pad(Math.floor(m/60)%24)+':'+pad(m%60);}
function weekStart(s){var d=parse(s);return addDays(d,-((d.getDay()+6)%7));}
function icon(name){var s=document.createElement('span');s.className='ic';s.innerHTML=ICONS[name];return s;}
function h(tag,attrs){
  var el=document.createElement(tag);
  var a=attrs||{};
  Object.keys(a).forEach(function(k){
    var v=a[k];
    if(v==null||v===false)return;
    if(k==='class')el.className=v;
    else if(k.slice(0,2)==='on')el.addEventListener(k.slice(2),v);
    else if(v===true)el.setAttribute(k,'');
    else el.setAttribute(k,v);
  });
  Array.prototype.slice.call(arguments,2).flat(Infinity).forEach(function(kid){
    if(kid==null||kid===false)return;
    el.append(kid.nodeType?kid:document.createTextNode(String(kid)));
  });
  return el;
}
function clickable(el,fn){
  el.addEventListener('click',fn);
  el.addEventListener('keydown',function(e){
    if((e.key==='Enter'||e.key===' ')&&e.target===el){e.preventDefault();fn();}
  });
}
function toast(msg){
  var t=$('#toast');t.textContent=msg;t.classList.add('show');
  clearTimeout(toast.t);toast.t=setTimeout(function(){t.classList.remove('show');},2200);
}

/* ---------- Daten ---------- */
function okDate(s){return DATE_RE.test(s||'')?s:'';}
function normalize(d){
  var s=Object.assign({hoursPerDay:4,bufferDays:2,weekends:false},(d&&d.settings)||{});
  s.hoursPerDay=Math.max(0.5,Number(s.hoursPerDay)||4);
  s.bufferDays=Math.max(0,Number(s.bufferDays)||0);
  s.weekends=!!s.weekends;
  var events=((d&&d.events)||[]).filter(function(e){return e&&e.title&&DATE_RE.test(e.date||'');}).map(function(e,i){
    return {
      id:e.id||uid(), title:String(e.title), date:e.date, time:e.time||'',
      color:e.color||COLORS[i%COLORS.length], pinned:!!e.pinned,
      tasks:(e.tasks||[]).filter(function(t){return t&&t.title;}).map(function(t){
        return {id:t.id||uid(), title:String(t.title), hours:Math.max(0,Number(t.hours)||0),
          due:okDate(t.due), day:okDate(t.day), status:STATUS[t.status]?t.status:'open',
          notes:t.notes?String(t.notes):''};
      })
    };
  });
  return {settings:s,events:events};
}
function hashText(t){var x=5381;for(var i=0;i<t.length;i++)x=((x<<5)+x+t.charCodeAt(i))|0;return String(x>>>0);}
function loadDraft(){try{return JSON.parse(localStorage.getItem(DKEY));}catch(e){return null;}}

/* data.json ist die Wahrheit. Änderungen im Browser sind ein Entwurf, bis sie in data.json gespeichert sind. */
var state=normalize({});
var fileText='',fileHash='',fileState=normalize({}),fileError='';
function isDirty(){return JSON.stringify(state)!==JSON.stringify(fileState);}
function save(){
  try{
    if(isDirty())localStorage.setItem(DKEY,JSON.stringify({base:fileHash,state:state}));
    else localStorage.removeItem(DKEY);
  }catch(e){}
}
function isWork(d){return state.settings.weekends||(d.getDay()!==0&&d.getDay()!==6);}
function nextWork(s){var d=parse(s),g=0;while(!isWork(d)&&g++<8)d=addDays(d,1);return iso(d);}
var ui={view:'day',day:nextWork(today()),sel:null,filter:'all',confirmDel:false,side:false};

function commit(){save();render();}
function workdays(from,to){
  var n=0,d=parse(from),end=parse(to);
  while(d<end){if(isWork(d))n++;d=addDays(d,1);}
  return n;
}
function setStatus(id,status){
  state.events.forEach(function(ev){ev.tasks.forEach(function(t){if(t.id===id)t.status=status;});});
  commit();
}

/* ---------- Planung: fest gesetzte Tage zuerst, Rest nach frühester Deadline ---------- */
function plan(){
  var S=state.settings,t0=today(),items=[];
  state.events.forEach(function(ev,i){
    ev.tasks.forEach(function(t){
      items.push({ev:ev,t:t,order:i,deadline:t.due||iso(addDays(parse(ev.date),-S.bufferDays))});
    });
  });
  var open=items.filter(function(x){return x.t.status!=='done';});
  var fixed=open.filter(function(x){return x.t.day;}).sort(function(a,b){
    return a.t.day.localeCompare(b.t.day)||a.deadline.localeCompare(b.deadline);
  });
  var rest=open.filter(function(x){return !x.t.day;}).sort(function(a,b){
    return a.deadline.localeCompare(b.deadline)
      ||((b.t.status==='doing')-(a.t.status==='doing'))
      ||(a.order-b.order);
  });
  var used={},byDay={},info={};
  function alloc(x,from){
    var rem=x.t.hours,d=parse(from<t0?t0:from),allocs=[],guard=0;
    while(rem>1e-6&&guard++<730){
      if(isWork(d)){
        var k=iso(d),free=S.hoursPerDay-(used[k]||0);
        if(free>1e-6){
          var take=Math.min(free,rem);
          used[k]=(used[k]||0)+take;rem-=take;
          allocs.push({date:k,hours:take});
          (byDay[k]=byDay[k]||[]).push({ev:x.ev,t:x.t,hours:take,fixed:!!x.t.day});
        }
      }
      d=addDays(d,1);
    }
    var start=allocs.length?allocs[0].date:t0;
    var end=allocs.length?allocs[allocs.length-1].date:t0;
    var overdue=x.deadline<t0;
    info[x.t.id]={start:start,end:end,deadline:x.deadline,overdue:overdue,late:overdue||end>x.deadline};
  }
  fixed.forEach(function(x){alloc(x,x.t.day);});
  rest.forEach(function(x){alloc(x,t0);});
  return {info:info,used:used,byDay:byDay,open:fixed.concat(rest),rest:rest};
}
function stats(ev,P){
  var total=0,done=0;
  ev.tasks.forEach(function(t){total+=t.hours;if(t.status==='done')done+=t.hours;});
  var open=ev.tasks.filter(function(t){return t.status!=='done';});
  var late=open.filter(function(t){return P.info[t.id]&&P.info[t.id].late;});
  var pct=total?Math.round(done/total*100):(ev.tasks.length?Math.round((ev.tasks.length-open.length)/ev.tasks.length*100):0);
  return {total:total,done:done,openH:total-done,open:open,late:late,pct:pct,left:diffDays(today(),ev.date)};
}
function countdown(left){
  if(left<0)return {n:'vorbei',u:''};
  if(left===0)return {n:'Heute',u:''};
  return {n:String(left),u:left===1?'Tag':'Tage'};
}
function windowText(i){
  var w=i.start===i.end?fmtDay(i.start):fmtDay(i.start)+' bis '+fmtDay(i.end);
  return 'Plan: '+w+', fällig '+fmtDay(i.deadline);
}
function byDate(a,b){return a.date.localeCompare(b.date)||(a.time||'').localeCompare(b.time||'');}

/* ---------- Inhalte eines Tages ---------- */
function dayRows(k,P){
  var rows=[];
  state.events.forEach(function(ev){
    if(ev.date===k)rows.push({kind:'event',ev:ev,start:ev.time?toMin(ev.time):-2});
  });
  var tasks=(P.byDay[k]||[]).filter(function(b){return b.fixed;}).map(function(b){return {ev:b.ev,t:b.t,hours:b.hours};});
  state.events.forEach(function(ev){ev.tasks.forEach(function(t){
    if(t.status==='done'&&t.day===k)tasks.push({ev:ev,t:t,hours:t.hours});
  });});
  var busy=[];
  state.events.forEach(function(ev){if(ev.date===k&&ev.time)busy.push([toMin(ev.time),toMin(ev.time)+60]);});
  var cur=540;
  tasks.forEach(function(b){
    var m=Math.max(15,Math.round(b.hours*60)),st=cur;
    busy.forEach(function(w){if(st<w[1]&&st+m>w[0])st=w[1];});
    rows.push({kind:'task',ev:b.ev,t:b.t,hours:b.hours,start:st,end:st+m});
    cur=st+m+15;
  });
  state.events.forEach(function(ev){ev.tasks.forEach(function(t){
    if(t.due===k&&t.status!=='done'&&t.day!==k)rows.push({kind:'due',ev:ev,t:t,start:-1});
  });});
  rows.sort(function(a,b){return a.start-b.start;});
  var ghosts=(P.byDay[k]||[]).filter(function(b){return !b.fixed;});
  return {rows:rows,ghosts:ghosts};
}
function dayColors(k,P){
  var seen={},out=[];
  function add(c){if(!seen[c]&&out.length<4){seen[c]=1;out.push(c);}}
  state.events.forEach(function(ev){
    if(ev.date===k)add(ev.color);
    ev.tasks.forEach(function(t){if(t.due===k&&t.status!=='done')add(ev.color);if(t.day===k)add(ev.color);});
  });
  (P.byDay[k]||[]).forEach(function(b){add(b.ev.color);});
  return out;
}

/* ---------- Rendering ---------- */
function render(){
  var P=plan();
  renderHead();
  renderPills();
  renderNote();
  renderStrip(P);
  renderSide(P);
  var root=$('#view');root.replaceChildren();
  ({day:renderDay,week:renderWeek,month:renderMonth,board:renderBoard})[ui.view](root,P);
  renderDrawer(P);
  $('#scrim').hidden=!(ui.sel||ui.side);
}
function renderHead(){
  var d=parse(ui.day),t=$('#title'),label,year='';
  if(ui.view==='day'){label=d.toLocaleDateString('de-DE',{day:'numeric',month:'long'});year=d.getFullYear();}
  else if(ui.view==='week'){
    var s=weekStart(ui.day),e=addDays(s,6);
    label=s.toLocaleDateString('de-DE',{day:'numeric',month:'short'})+' bis '+e.toLocaleDateString('de-DE',{day:'numeric',month:'short'});year=e.getFullYear();
  }
  else if(ui.view==='month'){label=d.toLocaleDateString('de-DE',{month:'long'});year=d.getFullYear();}
  else label='Board';
  t.replaceChildren(label,year?h('span',{class:'yr'},' '+year):'');
  var nav=ui.view!=='board';
  $('#prev').hidden=!nav;$('#next').hidden=!nav;$('#todayBtn').hidden=!nav;
}
function step(dir){
  var d=parse(ui.day);
  if(ui.view==='day')d=addDays(d,dir);
  else if(ui.view==='week')d=addDays(d,7*dir);
  else d=new Date(d.getFullYear(),d.getMonth()+dir,1);
  ui.day=iso(d);render();
}
function renderPills(){
  var box=$('#pills');box.replaceChildren();
  box.append(h('button',{class:'pill only-m',type:'button',onclick:function(){ui.side=true;render();}},icon('inbox'),'Inbox'));
  [['day','Tag'],['week','Woche'],['month','Monat'],['board','Board']].forEach(function(v){
    box.append(h('button',{class:'pill',type:'button','aria-pressed':String(ui.view===v[0]),
      onclick:function(){ui.view=v[0];render();}},v[1]));
  });
  box.append(h('button',{class:'pill round',type:'button','aria-label':'Daten und Einstellungen',onclick:openData},icon('gear')));
}
function renderStrip(P){
  var el=$('#strip');el.replaceChildren();
  if(ui.view!=='day'){el.hidden=true;return;}
  el.hidden=false;
  var start=weekStart(ui.day),t0=today();
  for(var i=0;i<7;i++){
    (function(i){
      var d=addDays(start,i),k=iso(d);
      el.append(h('div',{class:'sd'+(k===ui.day?' sel':'')+(k===t0?' today':'')},
        h('button',{type:'button','aria-label':fmtLong(k),'aria-pressed':String(k===ui.day),onclick:function(){ui.day=k;render();}},
          h('span',{class:'wd'},WD[i]),
          h('span',{class:'dn'},d.getDate()),
          h('span',{class:'dots'},dayColors(k,P).map(function(c){return h('i',{style:'background:'+c});})))));
    })(i);
  }
}

/* Seitenleiste: Angepinnt und Inbox */
function renderSide(P){
  var side=$('#side');side.replaceChildren();
  side.classList.toggle('open',ui.side);
  var t0=today();
  var pinned=state.events.filter(function(e){return e.pinned&&e.date>=t0;}).sort(byDate);
  var inbox=P.rest.filter(function(x){return x.ev.date>=t0;});

  if(pinned.length){
    side.append(h('div',{class:'sp'},icon('pin'),'Angepinnt'));
    pinned.forEach(function(ev){
      var s=stats(ev,P),c=countdown(s.left);
      var card=h('div',{class:'pc',style:'--c:'+ev.color,role:'button',tabindex:'0','aria-label':ev.title+' öffnen'},
        h('div',{class:'pn'+(c.u?'':' word')},c.n,c.u?h('small',null,c.u):null),
        h('div',null,
          h('div',{class:'t'},ev.title),
          h('div',{class:'m'},s.open.length?s.open.length+' offen, '+fmtH(s.openH):(ev.tasks.length?'Alles erledigt':'Keine Aufgaben')),
          s.late.length?h('div',{class:'w'},s.late.length+(s.late.length===1?' Aufgabe':' Aufgaben')+' zu spät im Plan'):null,
          h('div',{class:'trk'},h('i',{style:'width:'+s.pct+'%'}))));
      clickable(card,function(){openEv(ev.id);});
      side.append(card);
    });
  }
  side.append(h('div',{class:'sp coral',style:'margin-top:'+(pinned.length?'14px':'4px')},icon('inbox'),'Inbox',h('small',null,String(inbox.length))));
  if(!inbox.length)side.append(h('div',{class:'none'},'Alles eingeplant. Neue Aufgaben legst du im Event an.'));
  inbox.forEach(function(x){
    side.append(h('div',{class:'sc',style:'--c:'+x.ev.color},
      h('div',{class:'gl','aria-hidden':'true'},x.ev.title.charAt(0).toUpperCase()),
      h('div',{style:'min-width:0'},
        h('div',{class:'m'},fmtDur(x.t.hours)+', '+x.ev.title),
        h('button',{class:'t',type:'button',onclick:function(){openEv(x.ev.id);}},x.t.title)),
      h('button',{class:'plus',type:'button','aria-label':x.t.title+' auf '+fmtDay(ui.day)+' einplanen',onclick:function(){
        x.t.day=ui.day;ui.view='day';commit();toast('Eingeplant am '+fmtDay(ui.day));}},'+')));
  });
}

/* Tag: Zeitleiste */
function tlRow(r){
  var ev=r.ev,c='--c:'+ev.color;
  function ttl(txt){return h('button',{class:'ttl',type:'button',onclick:function(){openEv(ev.id);}},txt);}
  var evn=h('div',{class:'evn'},h('span',{class:'dot'}),ev.title);
  if(r.kind==='event'){
    var left=diffDays(today(),ev.date);
    var rel=left===0?'heute':left>0?'in '+left+(left===1?' Tag':' Tagen'):'vorbei';
    return h('div',{class:'tr',style:c},
      h('div',{class:'tm',style:'height:40px'},h('span',null,ev.time||'ganztägig')),
      h('div',{class:'rund',style:'height:40px'},icon('cal')),
      h('div',{class:'tx',style:'min-height:40px'},h('div',{class:'meta'},(ev.time?ev.time+' Uhr, ':'')+'Termin, '+rel),ttl(ev.title)),
      h('span'));
  }
  var done=r.t.status==='done';
  var chk=h('button',{class:'chk'+(done?' on':''),type:'button','aria-pressed':String(done),
    'aria-label':r.t.title+(done?' wieder öffnen':' erledigt'),onclick:function(){setStatus(r.t.id,done?'open':'done');}});
  if(r.kind==='due'){
    return h('div',{class:'tr',style:c},
      h('div',{class:'tm',style:'height:40px'},h('span',null,'fällig')),
      h('div',{class:'rund',style:'height:40px'},'!'),
      h('div',{class:'tx',style:'min-height:40px'},h('div',{class:'meta'},'Deadline'),ttl(r.t.title),evn),
      chk);
  }
  var px=Math.min(240,Math.max(40,Math.round(40+(r.hours-0.5)*36)));
  return h('div',{class:'tr'+(done?' done':''),style:c},
    h('div',{class:'tm',style:'height:'+px+'px'},h('span',null,toTime(r.start)),px>=76?h('span',null,toTime(r.end)):null),
    h('div',{class:'rund',style:'height:'+px+'px'},ev.title.charAt(0).toUpperCase()),
    h('div',{class:'tx',style:'min-height:'+px+'px'},
      h('div',{class:'meta'},toTime(r.start)+' - '+toTime(r.end)+' ('+fmtDur(r.hours)+')'),
      ttl(r.t.title),evn),
    chk);
}
function ghostRow(g,k){
  return h('div',{class:'tr ghost'},
    h('div',{class:'tm'}),
    h('div',{class:'gi'},icon('clock')),
    h('div',{class:'gh'},'Passt hier: ',
      h('button',{class:'glink',type:'button',onclick:function(){openEv(g.ev.id);}},g.t.title),
      ' für ',h('b',null,fmtDur(g.hours)),
      h('button',{class:'gadd',type:'button','aria-label':g.t.title+' auf diesen Tag einplanen',onclick:function(){g.t.day=k;commit();}},'Einplanen')),
    h('span'));
}
function renderDay(root,P){
  var k=ui.day,D=dayRows(k,P),tl=h('div',{class:'tl'});
  var untimed=D.rows.filter(function(r){return r.kind==='due'||(r.kind==='event'&&!r.ev.time);});
  var timed=D.rows.filter(function(r){return untimed.indexOf(r)<0;});
  if(untimed.length){
    root.append(h('div',{class:'ut'},untimed.map(function(r){
      var done=r.kind==='due'&&r.t.status==='done';
      var open=function(){openEv(r.ev.id);};
      var btn=r.kind==='due'
        ?h('button',{class:'ib',type:'button','aria-label':r.t.title+' als erledigt markieren',onclick:function(){setStatus(r.t.id,'done');}},'!')
        :h('button',{class:'ib',type:'button','aria-label':r.ev.title+' öffnen',onclick:open},icon('cal'));
      return h('div',{class:'ui'+(done?' done':''),style:'--c:'+r.ev.color},btn,
        h('button',{class:'l',type:'button',onclick:open},r.kind==='due'?r.t.title:r.ev.title));
    })));
  }
  timed.forEach(function(r){tl.append(tlRow(r));});
  D.ghosts.forEach(function(g){tl.append(ghostRow(g,k));});
  if(!timed.length&&!D.ghosts.length){
    tl.append(h('div',{class:'tr ghost'},h('div',{class:'tm'}),h('div',{class:'gi'},icon('clock')),
      h('div',{class:'gh'},'Nichts geplant. Zieh eine Aufgabe mit dem Plus aus der Inbox auf diesen Tag.'),h('span')));
  }
  root.append(tl);
}

/* Woche */
function wItem(ev,title,meta,sug){
  return h('button',{class:'wi'+(sug?' sug':''),type:'button',style:'--c:'+ev.color,onclick:function(){openEv(ev.id);}},
    h('b',null,h('span',{class:'dot'}),h('span',{class:'tx2'},title)),h('small',null,meta));
}
function renderWeek(root,P){
  var S=state.settings,start=weekStart(ui.day),t0=today(),wrap=h('div',{class:'wk'});
  for(var i=0;i<7;i++){
    (function(i){
      var d=addDays(start,i),k=iso(d),cap=isWork(d)?S.hoursPerDay:0,used=P.used[k]||0;
      var col=h('div',{class:'wc'},
        h('button',{class:'wh'+(k===t0?' today':''),type:'button','aria-label':fmtLong(k)+' öffnen',onclick:function(){ui.day=k;ui.view='day';render();}},
          h('span',{class:'wd'},WD[i]),h('span',{class:'dn'},d.getDate())),
        cap?h('div',{class:'ld'},h('i',{style:'width:'+Math.min(100,used/cap*100)+'%'})):null,
        h('div',{class:'lt'},cap?fmtH(used)+' von '+fmtH(cap):'frei'));
      state.events.filter(function(e){return e.date===k;}).sort(byDate).forEach(function(ev){
        col.append(wItem(ev,ev.title,(ev.time?ev.time+' Uhr, ':'')+'Termin',false));
      });
      state.events.forEach(function(ev){ev.tasks.forEach(function(t){
        if(t.due===k&&t.status!=='done')col.append(wItem(ev,t.title,'Deadline',false));
      });});
      (P.byDay[k]||[]).forEach(function(b){col.append(wItem(b.ev,b.t.title,fmtDur(b.hours)+(b.fixed?'':', Vorschlag'),!b.fixed));});
      wrap.append(col);
    })(i);
  }
  root.append(wrap);
}

/* Monat */
function renderMonth(root,P){
  var cur=parse(ui.day),first=new Date(cur.getFullYear(),cur.getMonth(),1),t0=today();
  var start=addDays(first,-((first.getDay()+6)%7)),grid=h('div',{class:'mo'});
  WD.forEach(function(w){grid.append(h('div',{class:'mh'},w));});
  for(var i=0;i<42;i++){
    var d=addDays(start,i),k=iso(d),items=[];
    state.events.filter(function(e){return e.date===k;}).sort(byDate).forEach(function(ev){
      items.push(h('button',{class:'mi ev',type:'button',style:'--c:'+ev.color,title:ev.title,onclick:function(){openEv(ev.id);}},
        h('span',{class:'dot'}),h('span',{class:'tx2'},(ev.time?ev.time+' ':'')+ev.title)));
    });
    state.events.forEach(function(ev){ev.tasks.forEach(function(t){
      if((t.due===k&&t.status!=='done')||t.day===k){
        items.push(h('button',{class:'mi dim',type:'button',style:'--c:'+ev.color,title:t.title,onclick:function(){openEv(ev.id);}},
          h('span',{class:'dot'}),h('span',{class:'tx2'},t.title)));
      }
    });});
    (function(k){
      grid.append(h('div',{class:'mc'+(d.getMonth()!==first.getMonth()?' other':'')+(k===t0?' today':'')},
        h('button',{class:'dn',type:'button','aria-label':fmtLong(k)+' öffnen',onclick:function(){ui.day=k;ui.view='day';render();}},d.getDate()),
        items.slice(0,3),
        items.length>3?h('div',{class:'more'},'+'+(items.length-3)+' weitere'):null));
    })(k);
  }
  root.append(grid);
}

/* Board */
function renderBoard(root,P){
  var sel=h('select',{'aria-label':'Nach Event filtern',onchange:function(e){ui.filter=e.target.value;render();}},
    h('option',{value:'all',selected:ui.filter==='all'},'Alle Events'),
    state.events.map(function(ev){return h('option',{value:ev.id,selected:ui.filter===ev.id},ev.title);}));
  root.append(h('div',{class:'bar-top'},sel));
  var board=h('div',{class:'bd'});
  Object.keys(STATUS).forEach(function(st){
    var cards=[];
    state.events.forEach(function(ev){
      if(ui.filter!=='all'&&ui.filter!==ev.id)return;
      ev.tasks.forEach(function(t){if(t.status===st)cards.push({ev:ev,t:t});});
    });
    cards.sort(function(a,b){
      var da=(P.info[a.t.id]||{deadline:a.t.due||a.ev.date}).deadline,db=(P.info[b.t.id]||{deadline:b.t.due||b.ev.date}).deadline;
      return da.localeCompare(db);
    });
    var hrs=cards.reduce(function(a,x){return a+x.t.hours;},0);
    var col=h('div',{class:'bc'},
      h('h3',null,STATUS[st],h('span',null,cards.length+' Aufgaben, '+fmtH(hrs))),
      cards.map(function(x){
        var i=P.info[x.t.id],due=i?i.deadline:(x.t.due||x.ev.date);
        var card=h('div',{class:'bk'+(st==='done'?' done':''),draggable:'true',style:'--c:'+x.ev.color},
          h('button',{class:'t',type:'button',onclick:function(){openEv(x.ev.id);}},x.t.title),
          h('button',{class:'cyc',type:'button','aria-label':ACT[st]+': '+x.t.title,onclick:function(){setStatus(x.t.id,NEXT[st]);}},ACT[st]),
          h('div',{class:'m'},
            h('span',null,h('span',{class:'dot'}),x.ev.title),
            h('span',null,fmtH(x.t.hours)),
            h('span',null,'fällig '+fmtDay(due)),
            i&&i.late?h('span',{class:'badge'},i.overdue?'überfällig':'zu spät im Plan'):null));
        card.addEventListener('dragstart',function(e){e.dataTransfer.setData('text/plain',x.t.id);e.dataTransfer.effectAllowed='move';});
        return card;
      }));
    col.addEventListener('dragover',function(e){e.preventDefault();col.classList.add('over');});
    col.addEventListener('dragleave',function(){col.classList.remove('over');});
    col.addEventListener('drop',function(e){
      e.preventDefault();col.classList.remove('over');
      var id=e.dataTransfer.getData('text/plain');if(id)setStatus(id,st);
    });
    board.append(col);
  });
  root.append(board);
}

/* Detailfenster */
function openEv(id){ui.sel=id;ui.confirmDel=false;ui.side=false;render();}
function closeEv(){ui.sel=null;ui.confirmDel=false;render();}
function renderDrawer(P){
  var dr=$('#drawer');
  var ev=state.events.filter(function(e){return e.id===ui.sel;})[0];
  if(!ev){dr.classList.remove('open');dr.setAttribute('aria-hidden','true');dr.replaceChildren();return;}
  var s=stats(ev,P),c=countdown(s.left),S=state.settings;
  var buffered=iso(addDays(parse(ev.date),-S.bufferDays));
  var daysToDeadline=workdays(today(),buffered>today()?buffered:today());
  var effort=Math.ceil(s.openH/S.hoursPerDay*10)/10;

  var verdict;
  if(!s.open.length)verdict=h('div',{class:'verdict'},ev.tasks.length?'Alles erledigt.':'Noch keine Aufgaben. Lege unten welche an.');
  else if(s.late.length)verdict=h('div',{class:'verdict warn'},'Zu eng: '+s.late.length+(s.late.length===1?' Aufgabe liegt':' Aufgaben liegen')+' hinter der Deadline.');
  else verdict=h('div',{class:'verdict'},'Im Plan. Alle Aufgaben passen vor die Deadlines.');

  var sw=h('div',{class:'swatches'},COLORS.map(function(col){
    return h('button',{class:'sw',type:'button',style:'--c:'+col,'aria-label':'Farbe '+col,'aria-pressed':String(ev.color===col),
      onclick:function(){ev.color=col;commit();}});
  }));

  var tasks=ev.tasks.slice().sort(function(a,b){
    if((a.status==='done')!==(b.status==='done'))return a.status==='done'?1:-1;
    var ia=P.info[a.id],ib=P.info[b.id];
    return (ia?ia.start:'9').localeCompare(ib?ib.start:'9');
  });

  var nt=h('input',{class:'grow add-title',type:'text',placeholder:'Neue Aufgabe','aria-label':'Titel der neuen Aufgabe'});
  var nh=h('input',{type:'number',min:'0',step:'0.5',value:'2','aria-label':'Stunden'});
  var nd=h('input',{type:'date','aria-label':'Fällig am'});
  function add(){
    var v=nt.value.trim();
    if(!v){nt.focus();return;}
    ev.tasks.push({id:uid(),title:v,hours:Math.max(0,Number(nh.value)||0),due:nd.value||'',day:'',status:'open',notes:''});
    commit();
    var f=$('.add-title');if(f)f.focus();
  }
  nt.addEventListener('keydown',function(e){if(e.key==='Enter')add();});

  dr.replaceChildren(
    h('div',{class:'dr-top',style:'--c:'+ev.color},
      h('div',{class:'dr-count'},h('span',{class:'big'+(c.u?'':' word')},c.n),c.u?h('span',{class:'u'},c.u):null),
      h('button',{class:'icon',type:'button','aria-label':'Schließen',onclick:closeEv},'×')),
    h('div',{class:'dr-body',style:'--c:'+ev.color},
      h('input',{class:'title-in',type:'text',value:ev.title,'aria-label':'Titel',onchange:function(e){
        var v=e.target.value.trim();if(v){ev.title=v;commit();}}}),
      h('div',{class:'row'},
        h('label',null,'Datum',h('input',{type:'date',value:ev.date,onchange:function(e){if(DATE_RE.test(e.target.value)){ev.date=e.target.value;commit();}}})),
        h('label',null,'Uhrzeit',h('input',{type:'time',value:ev.time,onchange:function(e){ev.time=e.target.value;commit();}}))),
      sw,
      verdict,
      h('div',{class:'bar'},h('i',{style:'width:'+s.pct+'%'})),
      h('div',{class:'tiles'},
        h('div',{class:'tile'},h('b',null,fmtH(s.openH)),h('span',null,'noch offen')),
        h('div',{class:'tile'},h('b',null,String(effort).replace('.',',')),h('span',null,'Arbeitstage Aufwand')),
        h('div',{class:'tile'},h('b',null,String(daysToDeadline)),h('span',null,'Arbeitstage bis Puffer'))),
      h('h4',null,'Aufgaben'),
      tasks.length?tasks.map(function(t){return drawerTask(ev,t,P);}):h('div',{class:'empty'},'Noch keine Aufgaben.'),
      h('div',{class:'addrow'},nt,nh,nd,h('button',{class:'btn primary',type:'button',onclick:add},'Hinzufügen')),
      h('div',{class:'row',style:'margin-top:8px'},
        h('button',{class:'btn',type:'button',onclick:function(){ev.pinned=!ev.pinned;commit();}},ev.pinned?'Nicht mehr anpinnen':'Anpinnen'),
        h('button',{class:'btn danger',type:'button',style:'margin-left:auto',onclick:function(){
          if(!ui.confirmDel){ui.confirmDel=true;render();return;}
          state.events=state.events.filter(function(x){return x!==ev;});ui.sel=null;ui.confirmDel=false;commit();
        }},ui.confirmDel?'Wirklich löschen?':'Event löschen'))));
  dr.classList.add('open');dr.removeAttribute('aria-hidden');
}
function drawerTask(ev,t,P){
  var i=P.info[t.id];
  return h('div',{class:'dt'+(t.status==='done'?' done':'')},
    h('div',{class:'dt-head'},
      h('input',{type:'checkbox',checked:t.status==='done','aria-label':'Erledigt',onchange:function(e){setStatus(t.id,e.target.checked?'done':'open');}}),
      h('input',{class:'dt-title',type:'text',value:t.title,'aria-label':'Aufgabe',onchange:function(e){
        var v=e.target.value.trim();if(v){t.title=v;commit();}}}),
      h('button',{class:'icon sm',type:'button','aria-label':'Aufgabe löschen',onclick:function(){ev.tasks=ev.tasks.filter(function(x){return x!==t;});commit();}},'×')),
    h('div',{class:'dt-meta'},
      h('select',{'aria-label':'Status',onchange:function(e){setStatus(t.id,e.target.value);}},
        Object.keys(STATUS).map(function(k){return h('option',{value:k,selected:t.status===k},STATUS[k]);})),
      h('label',null,'Std.',h('input',{type:'number',min:'0',step:'0.5',value:String(t.hours),onchange:function(e){t.hours=Math.max(0,Number(e.target.value)||0);commit();}})),
      h('label',null,'fällig',h('input',{type:'date',value:t.due,onchange:function(e){t.due=e.target.value;commit();}})),
      h('label',null,'am',h('input',{type:'date',value:t.day,'aria-label':'Fest eingeplant am',onchange:function(e){t.day=e.target.value;commit();}}))),
    h('input',{class:'dt-notes',type:'text',value:t.notes||'',placeholder:'Notiz, z.B. was genau zu tun ist','aria-label':'Notiz zur Aufgabe',onchange:function(e){t.notes=e.target.value.trim();commit();}}),
    i?h('div',{class:'dt-plan'+(i.late?' warn':'')},
      windowText(i)+(i.late?(i.overdue?'. Überfällig.':'. Plan endet nach der Deadline.'):'')):null);
}

/* ---------- Dialoge ---------- */
var evDlg=$('#evDlg'),dataDlg=$('#dataDlg');
var newColor=COLORS[0];
function drawNewColors(){
  var box=$('#evColors');box.replaceChildren();
  COLORS.forEach(function(col){
    box.append(h('button',{class:'sw',type:'button',style:'--c:'+col,'aria-label':'Farbe '+col,'aria-pressed':String(newColor===col),
      onclick:function(){newColor=col;drawNewColors();}}));
  });
}
$('#newEv').addEventListener('click',function(){
  $('#evTitle').value='';$('#evTime').value='';$('#evPin').checked=true;
  $('#evDate').value=ui.day>=today()?ui.day:iso(addDays(new Date(),14));
  newColor=COLORS[state.events.length%COLORS.length];drawNewColors();
  evDlg.showModal();$('#evTitle').focus();
});
$('#evCancel').addEventListener('click',function(){evDlg.close();});
$('#evSave').addEventListener('click',function(){
  var title=$('#evTitle').value.trim(),date=$('#evDate').value;
  if(!title){$('#evTitle').focus();return;}
  if(!DATE_RE.test(date)){$('#evDate').focus();return;}
  var ev={id:uid(),title:title,date:date,time:$('#evTime').value,color:newColor,pinned:$('#evPin').checked,tasks:[]};
  state.events.push(ev);evDlg.close();ui.sel=ev.id;commit();
});

function fillData(){
  $('#json').value=JSON.stringify(state,null,2);
  $('#setHours').value=state.settings.hoursPerDay;
  $('#setBuffer').value=state.settings.bufferDays;
  $('#setWeekend').checked=state.settings.weekends;
}
function openData(){fillData();dataDlg.showModal();}
$('#jsClose').addEventListener('click',function(){dataDlg.close();});
function setSettings(){
  state.settings.hoursPerDay=Math.max(0.5,Number($('#setHours').value)||4);
  state.settings.bufferDays=Math.max(0,Number($('#setBuffer').value)||0);
  state.settings.weekends=$('#setWeekend').checked;
  commit();fillData();
}
['#setHours','#setBuffer','#setWeekend'].forEach(function(s){$(s).addEventListener('change',setSettings);});
function applyJson(text){
  var obj;
  try{obj=JSON.parse(text);}catch(e){toast('Das ist kein gültiges JSON.');return false;}
  if(!obj||!Array.isArray(obj.events)){toast('Im JSON fehlt die Liste "events".');return false;}
  state=normalize(obj);ui.sel=null;commit();fillData();toast('Daten übernommen');return true;
}
$('#jsApply').addEventListener('click',function(){applyJson($('#json').value);});
$('#jsCopy').addEventListener('click',function(){
  var ta=$('#json');
  function fallback(){ta.select();try{document.execCommand('copy');toast('Kopiert');}catch(e){toast('Bitte manuell kopieren');}}
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(ta.value).then(function(){toast('Kopiert');},fallback);
  }else fallback();
});
$('#jsSave').addEventListener('click',exportFile);
$('#jsLoad').addEventListener('click',function(){$('#jsFile').click();});
$('#jsFile').addEventListener('change',function(e){
  var f=e.target.files[0];if(!f)return;
  var r=new FileReader();
  r.onload=function(){$('#json').value=String(r.result);applyJson(String(r.result));};
  r.readAsText(f);e.target.value='';
});
$('#jsReset').addEventListener('click',function(){
  if(!this.dataset.sure){this.dataset.sure='1';this.textContent='Wirklich verwerfen?';return;}
  delete this.dataset.sure;this.textContent='Auf data.json zurücksetzen';
  discardDraft();fillData();
});

$('#prev').addEventListener('click',function(){step(-1);});
$('#next').addEventListener('click',function(){step(1);});
$('#todayBtn').addEventListener('click',function(){ui.day=nextWork(today());render();});
$('#scrim').addEventListener('click',function(){ui.sel=null;ui.side=false;ui.confirmDel=false;render();});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'&&(ui.sel||ui.side)&&!evDlg.open&&!dataDlg.open){ui.sel=null;ui.side=false;render();}
});

/* ---------- Hinweisleiste, Speichern, Start ---------- */
function renderNote(){
  var n=$('#note');n.replaceChildren();
  var dirty=isDirty();
  if(!fileError&&!dirty){n.hidden=true;return;}
  n.hidden=false;
  if(fileError){
    n.append(h('div',{class:'nt'},h('b',null,'data.json konnte nicht geladen werden. '),
      'Starte im Projektordner ',h('code',null,'python3 -m http.server 8000'),' und öffne ',h('code',null,'http://localhost:8000'),'. Details: '+fileError));
    n.append(h('button',{class:'btn sm',type:'button',onclick:openData},'Daten manuell laden'));
  }else{
    n.append(h('div',{class:'nt'},h('b',null,'Ungespeicherte Änderungen. '),'Sie liegen nur in diesem Browser, nicht in data.json.'));
  }
  if(dirty){
    n.append(h('button',{class:'btn sm primary',type:'button',onclick:exportFile},'In data.json speichern'));
    if(!fileError)n.append(h('button',{class:'btn sm',type:'button',onclick:discardDraft},'Verwerfen'));
  }
}
async function exportFile(){
  var text=JSON.stringify(state,null,2)+'\n';
  if(window.showSaveFilePicker){
    try{
      var fh=await window.showSaveFilePicker({suggestedName:'data.json',types:[{description:'JSON',accept:{'application/json':['.json']}}]});
      var w=await fh.createWritable();await w.write(text);await w.close();
      fileText=text;fileHash=hashText(text);fileState=normalize(JSON.parse(text));fileError='';
      save();render();toast('data.json gespeichert');return;
    }catch(e){if(e&&e.name==='AbortError')return;}
  }
  var a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([text],{type:'application/json'}));
  a.download='data.json';document.body.append(a);a.click();a.remove();
  toast('data.json heruntergeladen. Ersetze die Datei im Projektordner.');
}
function discardDraft(){
  try{localStorage.removeItem(DKEY);}catch(e){}
  try{state=normalize(JSON.parse(fileText));}catch(e){state=normalize({});}
  ui.sel=null;render();toast('Änderungen verworfen');
}
async function boot(){
  var msg='';
  try{
    var r=await fetch('data.json',{cache:'no-store'});
    if(!r.ok)throw new Error('HTTP '+r.status);
    fileText=await r.text();
    var parsed=JSON.parse(fileText);
    if(!parsed||!Array.isArray(parsed.events))throw new Error('Im JSON fehlt die Liste "events"');
    fileState=normalize(parsed);fileHash=hashText(fileText);state=normalize(parsed);
    var d=loadDraft();
    if(d&&d.state){
      if(d.base===fileHash)state=normalize(d.state);
      else{
        try{localStorage.setItem(DKEY+'-backup',JSON.stringify(d));localStorage.removeItem(DKEY);}catch(e){}
        msg='data.json ist neuer als dein Entwurf. Der Entwurf wurde verworfen (Backup im Browser).';
      }
    }
  }catch(e){
    fileError=String((e&&e.message)||e);
    var d2=loadDraft();
    if(d2&&d2.state)state=normalize(d2.state);
  }
  ui.day=nextWork(today());
  render();
  if(msg)toast(msg);
}
boot();
})();
