(function(){
  var TAU=Math.PI*2;
  var GROUPS=[
    {name:'Ring & motion', items:[
      {key:'radius',     label:'Radius',          min:0.08,max:0.72,step:0.005,def:0.40, desc:'Distance from canvas center to the ring (0–1 of canvas)'},
      {key:'thickness',  label:'Border thickness',min:0.003,max:0.22,step:0.002,def:0.026,rmin:0.01,rmax:0.085, desc:'Width of the ring band — thicker = more presence'},
      {key:'rotSpeed',   label:'Rotation',        min:-6,  max:6,   step:0.05, def:0.40, desc:'Ring angular speed in rad/s. Negative reverses direction.'},
      {key:'pulseSpeed', label:'Pulse speed',     min:0,   max:14,  step:0.1,  def:2.20, desc:'How quickly the ring breathes / pulses'},
      {key:'pulseAmount',label:'Pulse amount',    min:0,   max:0.45,step:0.005,def:0.07,rmin:0,rmax:0.22, desc:'How much the radius pulses (0 = none)'},
      {key:'wobble',     label:'Wobble / warp',   min:0,   max:0.25,step:0.005,def:0.04, desc:'How much the ring distorts into non-circular shapes'}
    ]},
    {name:'Burning texture', items:[
      {key:'burn',       label:'Burn intensity',  min:0,   max:4,   step:0.02, def:1.00,rmin:0.2,rmax:2.2, desc:'Strength of the noise-driven fire texture on the ring'},
      {key:'noiseScale', label:'Texture scale',   min:0.5, max:50,  step:0.5,  def:8.0, desc:'How fine vs coarse the burn pattern is'},
      {key:'flowSpeed',  label:'Flame flow speed',min:0,   max:5,   step:0.05, def:1.00, desc:'How fast the flame texture drifts'},
      {key:'glow',       label:'Glow intensity',  min:0,   max:6,   step:0.05, def:1.30,rmin:0.4,rmax:2.6, desc:'Brightness of the soft halo around the ring'},
      {key:'chroma',     label:'Chromatic aberration',min:0,max:0.16,step:0.001,def:0.014,rmin:0.002,rmax:0.07, desc:'RGB channel separation — bigger = more rainbow fringing'}
    ]},
    {name:'Comet / tracer', items:[
      {key:'tracerCount',label:'Comet count',     min:0,   max:6,   step:1,    def:1, desc:'Number of comets travelling around the ring (0 disables)'},
      {key:'tracerSpeed',label:'Travel speed',    min:-12,max:12,   step:0.1,  def:2.60, desc:'Comet angular speed (negative reverses direction)'},
      {key:'cometHead',  label:'Head size',       min:0.02,max:1.2, step:0.01, def:0.22,rmin:0.06,rmax:0.5, desc:'Width of each comet\u2019s bright nucleus'},
      {key:'tailLength', label:'Tail length',     min:0.05,max:5,   step:0.05, def:1.10, desc:'How far each comet\u2019s tail trails behind'},
      {key:'cometBulge', label:'Head bulge',      min:0,   max:4,   step:0.05, def:1.40,rmin:0.3,rmax:2.6, desc:'How much the ring bulges where a comet is'},
      {key:'tracerGlow', label:'Comet brightness',min:0,   max:6,   step:0.05, def:2.20,rmin:0.6,rmax:3.0, desc:'Brightness of comets vs the ring'},
      {key:'sparkle',    label:'Tail flicker',    min:0,   max:1.5, step:0.02, def:0.50, desc:'Random ember shimmer along each tail'}
    ]},
    {name:'Color & post', items:[
      {key:'hue',        label:'Ring hue',        min:0,   max:360, step:1,    def:24,  hue:true, desc:'Hue of the ring (0–360°)'},
      {key:'tracerHue',  label:'Comet hue',       min:0,   max:360, step:1,    def:40,  hue:true, desc:'Hue of the comets (0–360°)'},
      {key:'saturation', label:'Saturation',      min:0,   max:2,   step:0.02, def:1.00,rmin:0.7,rmax:1.35, desc:'Color intensity (0 = grayscale)'},
      {key:'exposure',   label:'Exposure',        min:0.1, max:5,   step:0.05, def:1.30,rmin:0.85,rmax:1.55, desc:'Overall brightness'},
      {key:'contrast',   label:'Contrast',        min:0.2, max:3,   step:0.02, def:1.15,rmin:0.9,rmax:1.4, desc:'Tonal contrast'},
      {key:'gamma',      label:'Gamma',           min:0.3, max:2.6, step:0.05, def:1.00,rmin:0.95,rmax:1.3, desc:'Mid-tone curve (lower = brighter mid-tones)'},
      {key:'vignette',   label:'Vignette',        min:0,   max:2,   step:0.02, def:0.50,rmin:0.3,rmax:1.4, desc:'Darkens the canvas edges around the orb'}
    ]}
  ];
  var CONFIG=[]; GROUPS.forEach(function(g){ g.items.forEach(function(it){ CONFIG.push(it); }); });

  var BUILTIN_PRESETS={
    'My default':{radius:0.4,thickness:0.007,rotSpeed:0.4,pulseSpeed:2.2,pulseAmount:0.015,wobble:0.01,burn:1,noiseScale:22,flowSpeed:1,glow:1.3,chroma:0.003,tracerCount:1,tracerSpeed:-0.6,cometHead:0.24,tailLength:0.85,cometBulge:1,tracerGlow:1.5,sparkle:1.5,hue:19,tracerHue:19,saturation:1.22,exposure:2,contrast:1.02,gamma:1,vignette:0},
    'Ember comet':{radius:0.40,thickness:0.026,rotSpeed:0.40,pulseSpeed:2.2,pulseAmount:0.07,wobble:0.04,burn:1.0,noiseScale:8,flowSpeed:1.0,glow:1.3,chroma:0.014,tracerCount:1,tracerSpeed:2.6,cometHead:0.22,tailLength:1.1,cometBulge:1.4,tracerGlow:2.2,sparkle:0.5,hue:24,tracerHue:40,saturation:1.0,exposure:1.3,contrast:1.15,gamma:1.0,vignette:0.5},
    'Solar flare':{radius:0.34,thickness:0.07,rotSpeed:0.15,pulseSpeed:1.2,pulseAmount:0.14,wobble:0.12,burn:3.0,noiseScale:5,flowSpeed:1.6,glow:2.6,chroma:0.02,tracerCount:2,tracerSpeed:1.4,cometHead:0.40,tailLength:1.8,cometBulge:2.2,tracerGlow:2.6,sparkle:0.9,hue:18,tracerHue:30,saturation:1.2,exposure:1.5,contrast:1.1,gamma:1.05,vignette:0.7},
    'Plasma ring':{radius:0.42,thickness:0.02,rotSpeed:-1.8,pulseSpeed:5.0,pulseAmount:0.10,wobble:0.06,burn:0.4,noiseScale:18,flowSpeed:2.5,glow:3.2,chroma:0.06,tracerCount:3,tracerSpeed:6.5,cometHead:0.16,tailLength:0.9,cometBulge:1.0,tracerGlow:3.0,sparkle:0.7,hue:265,tracerHue:300,saturation:1.3,exposure:1.4,contrast:1.3,gamma:0.95,vignette:0.6},
    'Ghost trail':{radius:0.46,thickness:0.014,rotSpeed:0.25,pulseSpeed:1.0,pulseAmount:0.05,wobble:0.03,burn:0.15,noiseScale:12,flowSpeed:0.6,glow:1.6,chroma:0.03,tracerCount:1,tracerSpeed:-1.6,cometHead:0.14,tailLength:3.2,cometBulge:0.7,tracerGlow:1.8,sparkle:0.3,hue:175,tracerHue:190,saturation:0.8,exposure:1.1,contrast:1.0,gamma:1.1,vignette:0.9},
    'Whisper thread':{radius:0.34,thickness:0.015,rotSpeed:-1.4,pulseSpeed:0,pulseAmount:0,wobble:0.015,burn:0.35,noiseScale:50,flowSpeed:3.5,glow:0.3,chroma:0.008,tracerCount:1,tracerSpeed:-2.6,cometHead:0.05,tailLength:1.0,cometBulge:1.0,tracerGlow:0.8,sparkle:0.7,hue:0,tracerHue:18,saturation:0.92,exposure:1.45,contrast:1.05,gamma:1.0,vignette:0.75},
    'Supernova':{radius:0.30,thickness:0.12,rotSpeed:3.0,pulseSpeed:8.0,pulseAmount:0.30,wobble:0.18,burn:3.6,noiseScale:30,flowSpeed:3.5,glow:5.0,chroma:0.12,tracerCount:5,tracerSpeed:9.0,cometHead:0.50,tailLength:2.5,cometBulge:3.0,tracerGlow:5.0,sparkle:1.2,hue:45,tracerHue:55,saturation:1.4,exposure:1.8,contrast:1.4,gamma:0.9,vignette:0.4}
  };
  // Null-prototype maps: preset names come from users, so inherited keys like
  // 'toString' or '__proto__' must not shadow or pollute lookups.
  var PRESETS=Object.create(null);
  Object.keys(BUILTIN_PRESETS).forEach(function(k){ PRESETS[k]=BUILTIN_PRESETS[k]; });
  var USER_PRESETS=Object.create(null);
  // load user presets from localStorage
  try{
    var raw=localStorage.getItem('orb_forge.presets');
    if(raw){ var up=JSON.parse(raw); if(up&&typeof up==='object'){ Object.keys(up).forEach(function(k){ USER_PRESETS[k]=up[k]; PRESETS[k]=up[k]; }); } }
  }catch(e){}
  function persistUserPresets(){
    try{ localStorage.setItem('orb_forge.presets',JSON.stringify(USER_PRESETS)); }catch(e){}
  }

  var params={}; CONFIG.forEach(function(c){ params[c.key]=c.def; });

  /* ---------- per-param glyphs ---------- */
  var ICONS={
    radius:      '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><path d="M12 12L18.5 8"/>',
    thickness:   '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/>',
    rotSpeed:    '<path d="M20 12a8 8 0 1 1-3-6.2"/><path d="M20 4v5h-5"/>',
    pulseSpeed:  '<path d="M3 12h4l2-6 4 12 2-6h6"/>',
    pulseAmount: '<circle cx="12" cy="12" r="3"/><path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.4 6.4l1.4 1.4M16.2 16.2l1.4 1.4M6.4 17.6l1.4-1.4M16.2 7.8l1.4-1.4"/>',
    wobble:      '<path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/><path d="M3 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>',
    burn:        '<path d="M12 3c0 4-4 5-4 10a4 4 0 0 0 8 0c0-2-1-3-2-5 0 2-1 3-2 3 0-3 1-5 0-8z"/>',
    noiseScale:  '<circle cx="6" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="18" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="6" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="6" cy="18" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="18" r="1.2" fill="currentColor" stroke="none"/><circle cx="18" cy="18" r="1.2" fill="currentColor" stroke="none"/>',
    flowSpeed:   '<path d="M3 7h11a3 3 0 1 0-3-3M3 12h17M3 17h9a3 3 0 1 1-3 3"/>',
    glow:        '<circle cx="12" cy="12" r="3.6"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2 2M17.5 17.5l2 2M4.5 19.5l2-2M17.5 6.5l2-2"/>',
    chroma:      '<circle cx="9" cy="10" r="5"/><circle cx="15" cy="10" r="5"/><circle cx="12" cy="15" r="5"/>',
    tracerCount: '<circle cx="5" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.8" fill="currentColor" stroke="none"/>',
    tracerSpeed: '<path d="M3 12h16"/><path d="M14 6l6 6-6 6"/>',
    cometHead:   '<circle cx="10" cy="12" r="5" fill="currentColor" stroke="none" opacity=".85"/><circle cx="10" cy="12" r="7.5"/>',
    tailLength:  '<circle cx="6" cy="12" r="2.5" fill="currentColor" stroke="none"/><path d="M10 11.5h3M14 12h3M18 12.5h3"/>',
    cometBulge:  '<circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="7" stroke-dasharray="2 2.5"/>',
    tracerGlow:  '<circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5M5 5l3.5 3.5M15.5 15.5L19 19M5 19l3.5-3.5M15.5 8.5L19 5"/>',
    sparkle:     '<path d="M12 3l1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8z"/><circle cx="19" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="19" r="1" fill="currentColor" stroke="none"/>',
    hue:         '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none" opacity=".55"/><path d="M12 3v18"/>',
    tracerHue:   '<circle cx="9" cy="12" r="4" fill="currentColor" stroke="none" opacity=".7"/><path d="M13 12l3-2M13 12l3 0M13 12l3 2M16 10l4-1M16 12h4M16 14l4 1"/>',
    saturation:  '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/>',
    exposure:    '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
    contrast:    '<circle cx="12" cy="12" r="9"/><path d="M12 3v18"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/>',
    gamma:       '<path d="M5 4h13l-7 17"/>',
    vignette:    '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>',
    _default:    '<circle cx="12" cy="12" r="3"/>'
  };

  /* ---------- helpers ---------- */
  function decimals(s){ if(s>=1) return 0; if(s>=0.05) return 2; return 3; }
  function fmt(c,v){ return Number(v).toFixed(decimals(c.step)); }
  function clamp(v,lo,hi){ return v<lo?lo:(v>hi?hi:v); }
  function snap(c,v){ return parseFloat(clamp(v,c.min,c.max).toFixed(decimals(c.step))); }
  function fmtSize(b){ return b>=1048576?(b/1048576).toFixed(2)+' MB':Math.round(b/1024)+' KB'; }
  function pct(c,v){ var r=c.max-c.min; return r>0?((v-c.min)/r*100):0; }
  function escAttr(s){ return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function paramTitle(c){
    var range='Range '+c.min+' \u2192 '+c.max+' \u00b7 step '+c.step;
    return (c.desc?c.desc+'\n':'')+range;
  }

  /* ---------- ECS / JSONL log ---------- */
  var TERM_BODY, TERM_COUNT, BUFFER=[], COUNT=0, MAX_LINES=300;
  function categoryFor(action){
    if(action.indexOf('preset.')===0) return ['configuration'];
    if(action.indexOf('param.')===0) return ['configuration'];
    if(action.indexOf('params.')===0) return ['configuration'];
    if(action.indexOf('config.')===0) return ['file'];
    if(action.indexOf('export.')===0) return ['process'];
    if(action.indexOf('playback.')===0) return ['session'];
    if(action.indexOf('history.')===0) return ['session'];
    if(action.indexOf('ui.')===0) return ['session'];
    return ['event'];
  }
  function highlightJSON(json){
    return escAttr(json)
      .replace(/&quot;([^&]+?)&quot;:/g,'<span class="k">&quot;$1&quot;</span>:')
      .replace(/:\s?&quot;([^&]*?)&quot;/g,': <span class="s">&quot;$1&quot;</span>')
      .replace(/:\s?(-?\d+(?:\.\d+)?)/g,': <span class="n">$1</span>')
      .replace(/:\s?(true|false|null)/g,': <span class="b">$1</span>')
      .replace(/([\[\]{},])/g,'<span class="p">$1</span>');
  }
  function shortTs(iso){ return iso.slice(11,23); }
  function eclog(level,action,fields,msg){
    var entry={
      '@timestamp': new Date().toISOString(),
      'log.level': level,
      'event.kind':'event',
      'event.action': action,
      'event.category': categoryFor(action),
      'event.dataset':'orb_forge.app',
      message: msg||action
    };
    if(fields&&Object.keys(fields).length) entry.orb_forge=fields;
    // BUFFER keeps the full session (copy/download export everything);
    // only the DOM is capped at MAX_LINES, in renderLogLine.
    BUFFER.push(entry); COUNT++;
    renderLogLine(entry);
    if(TERM_COUNT) TERM_COUNT.textContent=COUNT+' event'+(COUNT===1?'':'s');
  }
  function renderLogLine(entry){
    if(!TERM_BODY) return;
    var line=document.createElement('div');
    line.className='tline lvl-'+entry['log.level'];
    // build compact JSON: omit common fields for brevity in display, full record kept in BUFFER
    var compact={
      action: entry['event.action'],
      message: entry.message
    };
    if(entry.orb_forge) compact.data=entry.orb_forge;
    var jsonStr=JSON.stringify(compact);
    line.innerHTML=
      '<span class="t">'+shortTs(entry['@timestamp'])+'</span>'+
      '<span class="lvl">'+entry['log.level']+'</span>'+
      '<span class="json">'+highlightJSON(jsonStr)+'</span>';
    TERM_BODY.appendChild(line);
    while(TERM_BODY.childElementCount>MAX_LINES) TERM_BODY.removeChild(TERM_BODY.firstChild);
    TERM_BODY.scrollTop=TERM_BODY.scrollHeight;
  }
  function bufferToJSONL(){
    return BUFFER.map(function(e){ return JSON.stringify(e); }).join('\n');
  }

  /* ---------- Apply param ---------- */
  function setParam(c,v){
    v=snap(c,v);
    if(v===params[c.key]) return false;
    params[c.key]=v;
    var r=refs[c.key];
    if(r){
      r.input.value=v;
      r.val.textContent=fmt(c,v);
      r.input.style.setProperty('--p',pct(c,v)+'%');
    }
    presetSel.value='';
    syncPresetChips(); updateAuto(); refreshExport();
    return true;
  }

  /* ---------- History (undo / redo) ---------- */
  var HIST=[], FUTURE=[], HIST_MAX=80, hist_lock=false;
  function snapshot(){
    var s={};
    CONFIG.forEach(function(c){ s[c.key]=params[c.key]; });
    s.__preset=presetSel.value||'';
    return s;
  }
  function applySnapshot(s){
    hist_lock=true;
    CONFIG.forEach(function(c){ if(s[c.key]!==undefined) params[c.key]=s[c.key]; });
    presetSel.value=s.__preset||'';
    syncUI(); syncPresetChips(); updateAuto(); refreshExport();
    hist_lock=false;
  }
  function commitHistory(){
    if(hist_lock) return;
    var s=snapshot();
    var prev=HIST[HIST.length-1];
    if(prev&&shallowEq(prev,s)) return;
    HIST.push(s); if(HIST.length>HIST_MAX) HIST.shift();
    FUTURE.length=0;
    updateHistoryUI();
  }
  function shallowEq(a,b){
    for(var k in a) if(a[k]!==b[k]) return false;
    for(var k2 in b) if(a[k2]!==b[k2]) return false;
    return true;
  }
  function undo(){
    if(HIST.length<2) return;
    var cur=HIST.pop();
    FUTURE.push(cur);
    applySnapshot(HIST[HIST.length-1]);
    eclog('info','history.undo',{depth:HIST.length-1,future:FUTURE.length},'Undo');
    updateHistoryUI();
  }
  function redo(){
    if(!FUTURE.length) return;
    var s=FUTURE.pop();
    HIST.push(s);
    applySnapshot(s);
    eclog('info','history.redo',{depth:HIST.length-1,future:FUTURE.length},'Redo');
    updateHistoryUI();
  }
  function updateHistoryUI(){
    document.getElementById('btnUndo').disabled=(HIST.length<2);
    document.getElementById('btnRedo').disabled=(FUTURE.length===0);
  }

  /* ---------- Stepper press-and-hold ---------- */
  function bindStep(btn,c,dir){
    var holdTimer=null,repTimer=null,didStep=false;
    function step(){
      var changed=setParam(c,params[c.key]+dir*c.step);
      if(changed) didStep=true;
    }
    function start(e){
      if(e.button!==undefined&&e.button!==0) return;
      e.preventDefault();
      didStep=false;
      step();
      holdTimer=setTimeout(function loop(){
        step();
        repTimer=setTimeout(loop,55);
      },360);
    }
    function stop(){
      if(holdTimer){ clearTimeout(holdTimer); holdTimer=null; }
      if(repTimer){ clearTimeout(repTimer); repTimer=null; }
      if(didStep){
        eclog('info','param.step',{key:c.key,dir:dir,value:params[c.key]},'Step '+(dir>0?'\u2191':'\u2193')+' '+c.key+' = '+fmt(c,params[c.key]));
        commitHistory();
        didStep=false;
      }
    }
    btn.addEventListener('pointerdown',start);
    btn.addEventListener('pointerup',stop);
    btn.addEventListener('pointerleave',stop);
    btn.addEventListener('pointercancel',stop);
    btn.addEventListener('blur',stop);
    // Keyboard path: Enter/Space on a focused stepper fires click with detail=0
    // (no pointer sequence), so perform a single step + commit here.
    btn.addEventListener('click',function(e){
      if(e.detail!==0) return;
      if(setParam(c,params[c.key]+dir*c.step)){
        eclog('info','param.step',{key:c.key,dir:dir,value:params[c.key]},'Step '+(dir>0?'↑':'↓')+' '+c.key+' = '+fmt(c,params[c.key]));
        commitHistory();
      }
    });
  }

  /* ---------- BUILD CONTROLS ---------- */
  var refs={}, host=document.getElementById('crtControls');
  GROUPS.forEach(function(g){
    var groupEl=document.createElement('div'); groupEl.className='group';
    var head=document.createElement('div'); head.className='group-head';
    head.innerHTML='<span class="title">'+g.name+'</span>'+
                   '<span class="meta">'+g.items.length+' params</span>';
    var body=document.createElement('div'); body.className='group-body';
    groupEl.appendChild(head); groupEl.appendChild(body);
    host.appendChild(groupEl);

    g.items.forEach(function(c){
      var tip=paramTitle(c);
      var row=document.createElement('div'); row.className='row'+(c.hue?' is-hue':'');
      row.setAttribute('title',tip);
      var ico=document.createElement('span'); ico.className='ico'; ico.setAttribute('aria-hidden','true');
      ico.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+(ICONS[c.key]||ICONS._default)+'</svg>';
      var lab=document.createElement('label'); lab.textContent=c.label; lab.setAttribute('for','crt-'+c.key); lab.setAttribute('title',tip);
      var inp=document.createElement('input');
      inp.type='range'; inp.id='crt-'+c.key; inp.min=c.min; inp.max=c.max; inp.step=c.step; inp.value=c.def;
      inp.setAttribute('title',tip);
      inp.style.setProperty('--p',pct(c,c.def)+'%');
      var val=document.createElement('span'); val.className='val'; val.textContent=fmt(c,c.def);
      val.setAttribute('title','Current value of '+c.label);
      var dec=document.createElement('button'); dec.type='button'; dec.className='step step--dec';
      dec.setAttribute('aria-label','Decrement '+c.label); dec.setAttribute('title','\u2212 '+c.step+' \u00b7 hold to repeat'); dec.textContent='\u2212';
      var inc=document.createElement('button'); inc.type='button'; inc.className='step step--inc';
      inc.setAttribute('aria-label','Increment '+c.label); inc.setAttribute('title','+ '+c.step+' \u00b7 hold to repeat'); inc.textContent='+';
      var stepper=document.createElement('span'); stepper.className='stepper';
      stepper.appendChild(dec); stepper.appendChild(val); stepper.appendChild(inc);
      inp.addEventListener('input',function(){
        var v=parseFloat(inp.value); params[c.key]=v;
        val.textContent=fmt(c,v);
        inp.style.setProperty('--p',pct(c,v)+'%');
        presetSel.value='';
        syncPresetChips(); updateAuto(); refreshExport();
      });
      // commit history + log on release
      inp.addEventListener('change',function(){
        eclog('info','param.commit',{key:c.key,value:params[c.key]},c.key+' = '+fmt(c,params[c.key]));
        commitHistory();
      });
      row.appendChild(ico); row.appendChild(lab); row.appendChild(inp); row.appendChild(stepper);
      bindStep(dec,c,-1); bindStep(inc,c,+1);
      body.appendChild(row);
      refs[c.key]={input:inp,val:val,cfg:c};
    });
  });
  function syncUI(){
    CONFIG.forEach(function(c){
      var r=refs[c.key]; r.input.value=params[c.key];
      r.val.textContent=fmt(c,params[c.key]);
      r.input.style.setProperty('--p',pct(c,params[c.key])+'%');
    });
  }

  /* ---------- PRESET CHIPS ---------- */
  function hueColor(deg){ return 'hsl('+deg+' 92% 55%)'; }
  function chipSwatchStyle(p){
    var h=p.hue|0, h2=p.tracerHue|0;
    return 'background:radial-gradient(circle at 30% 35%,'+hueColor(h2)+' 0%,'+hueColor(h)+' 55%,#1a0808 100%)';
  }
  var presetSel=document.getElementById('crtPreset');
  var presetChips=document.getElementById('crtPresetChips');
  function buildPresetChips(){
    presetSel.innerHTML='<option value="">— custom —</option>';
    presetChips.innerHTML='';
    Object.keys(PRESETS).forEach(function(name){
      var o=document.createElement('option'); o.value=name; o.textContent=name; presetSel.appendChild(o);
      var p=PRESETS[name];
      var isUser=!!USER_PRESETS[name];
      var chip=document.createElement('button');
      chip.className='preset-chip'; chip.type='button'; chip.dataset.name=name;
      chip.setAttribute('title',(isUser?'Your preset':'Built-in preset')+' \u00b7 '+name);
      if(isUser) chip.dataset.user='true';
      var inner='<span class="swatch" style="'+chipSwatchStyle(p)+'"></span><span>'+escAttr(name)+'</span>';
      if(isUser) inner+='<span class="x" data-x="'+escAttr(name)+'" title="Delete this preset">\u00d7</span>';
      chip.innerHTML=inner;
      chip.addEventListener('click',function(ev){
        if(ev.target&&ev.target.getAttribute('data-x')){
          ev.stopPropagation();
          deletePreset(name);
          return;
        }
        presetSel.value=name; presetSel.dispatchEvent(new Event('change'));
      });
      presetChips.appendChild(chip);
    });
    syncPresetChips();
  }
  function syncPresetChips(){
    var cur=presetSel.value||'';
    presetChips.querySelectorAll('.preset-chip').forEach(function(el){
      el.dataset.active=(el.dataset.name===cur)?'true':'false';
    });
    var hud=document.getElementById('hudPreset'); if(hud) hud.textContent=cur||'custom';
  }
  function deletePreset(name){
    if(!USER_PRESETS[name]) return;
    if(!confirm('Delete preset "'+name+'"?')) return;
    var cur=presetSel.value;
    delete USER_PRESETS[name]; delete PRESETS[name];
    persistUserPresets();
    buildPresetChips();
    // rebuilding the options resets the select — restore the active preset
    presetSel.value=(cur===name)?'':cur;
    syncPresetChips();
    eclog('info','preset.delete',{name:name},'Deleted preset "'+name+'"');
  }
  presetSel.addEventListener('change',function(){
    var p=PRESETS[presetSel.value]; if(!p){ syncPresetChips(); return; }
    CONFIG.forEach(function(c){ if(p[c.key]!==undefined) params[c.key]=p[c.key]; });
    syncUI(); refreshExport(); updateAuto(); syncPresetChips();
    if(!hist_lock){
      eclog('info','preset.apply',{name:presetSel.value},'Applied preset "'+presetSel.value+'"');
      commitHistory();
    }
  });
  buildPresetChips();

  /* ---------- Save preset ---------- */
  document.getElementById('btnSavePreset').addEventListener('click',function(){
    var name=prompt('Name for this preset:');
    if(name===null) return;
    name=name.trim();
    if(!name){ eclog('warn','preset.save_cancel',{},'Save cancelled — empty name'); return; }
    if(Object.prototype.hasOwnProperty.call(BUILTIN_PRESETS,name)){ alert('"'+name+'" is a built-in preset name. Choose a different name.'); return; }
    if(USER_PRESETS[name]&&!confirm('Replace existing preset "'+name+'"?')) return;
    var snap={};
    CONFIG.forEach(function(c){ snap[c.key]=c.step>=1?Math.round(params[c.key]):parseFloat(Number(params[c.key]).toFixed(decimals(c.step))); });
    USER_PRESETS[name]=snap; PRESETS[name]=snap;
    persistUserPresets();
    buildPresetChips();
    // set the value after the rebuild — the new <option> only exists now
    presetSel.value=name;
    syncPresetChips(); refreshExport();
    eclog('info','preset.save',{name:name,params:Object.keys(snap).length},'Saved preset "'+name+'"');
  });

  /* ---------- WEBGL ---------- */
  var canvas=document.getElementById('crtCanvas');
  var glOpts={alpha:true,preserveDrawingBuffer:true,antialias:true,premultipliedAlpha:false};
  var gl=canvas.getContext('webgl',glOpts)||canvas.getContext('experimental-webgl',glOpts);
  if(!gl){
    document.getElementById('crtFallback').style.display='flex';
    setTimeout(function(){ initTerm(); eclog('error','gl.unavailable',{},'WebGL not available'); },0);
    return;
  }

  var VERT='attribute vec2 a_pos;void main(){gl_Position=vec4(a_pos,0.0,1.0);}';
  var FRAG=[
  'precision highp float;',
  'uniform vec2 u_resolution;uniform float u_time;',
  'uniform float u_radius,u_thickness,u_rotSpeed,u_pulseSpeed,u_pulseAmount,u_wobble;',
  'uniform float u_burn,u_noiseScale,u_flowSpeed,u_glow,u_chroma;',
  'uniform float u_tracerCount,u_tracerSpeed,u_cometHead,u_tailLength,u_cometBulge,u_tracerGlow,u_sparkle;',
  'uniform float u_hue,u_tracerHue,u_saturation,u_exposure,u_contrast,u_gamma,u_vignette,u_alphaMode;',
  'uniform float u_loop,u_phase,u_loopDur;',
  'const float TAU=6.28318530718;const float PI=3.14159265359;',
  'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
  'float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.0-2.0*f);',
  ' float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));',
  ' return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);}',
  'float fbm(vec2 p){float v=0.,a=0.55;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+1.7;a*=0.5;}return v;}',
  'vec3 hsv2rgb(vec3 c){vec4 K=vec4(1.,0.6666667,0.3333333,3.);',
  ' vec3 p=abs(fract(c.xxx+K.xyz)*6.-K.www);return c.z*mix(K.xxx,clamp(p-K.xxx,0.,1.),c.y);}',
  'float band(float d,float r,float th){float x=abs(d-r);return smoothstep(th,th*0.15,x);}',
  'float halo(float d,float r,float th){float x=abs(d-r);return exp(-x*x/(th*th*5.0));}',
  'void main(){',
  ' vec2 uv=(gl_FragCoord.xy-0.5*u_resolution)/min(u_resolution.x,u_resolution.y);',
  ' float dist=length(uv);float ang=atan(uv.y,uv.x);float t=u_time;',
  ' float lp=u_loop;float ph=u_phase;float Td=u_loopDur;',
  ' vec2 pol=vec2(cos(ang),sin(ang))*u_noiseScale+vec2(0.0,dist*u_noiseScale);',
  ' vec2 fv=vec2(0.6*u_flowSpeed,-0.9*u_flowSpeed);',
  ' float bt=pow(fbm(pol+fv*t),1.6);',
  ' if(lp>0.5){ float bt2=pow(fbm(pol+fv*(t-Td)),1.6); bt=mix(bt,bt2,ph); }',
  ' float pulse;',
  ' if(lp>0.5){ float np=floor(u_pulseSpeed*Td/TAU+0.5); pulse=sin(TAU*np*ph); }',
  ' else { pulse=sin(t*u_pulseSpeed); }',
  ' float wob;',
  ' if(lp>0.5){',
  '  float n1=floor(1.3*Td/TAU+0.5),n2=floor(0.9*Td/TAU+0.5),n3=floor(0.5*Td/TAU+0.5);',
  '  wob=sin(ang*3.0+TAU*n1*ph)*0.5+sin(ang*5.0-TAU*n2*ph)*0.3+sin(ang*2.0+TAU*n3*ph)*0.2;',
  ' } else {',
  '  wob=sin(ang*3.0+t*1.3)*0.5+sin(ang*5.0-t*0.9)*0.3+sin(ang*2.0+t*0.5)*0.2;',
  ' }',
  ' float pr=u_radius*(1.0+pulse*u_pulseAmount)*(1.0+wob*u_wobble);',
  ' float rotAng,headBase;',
  ' if(lp>0.5){',
  '  float combW=u_rotSpeed-u_tracerSpeed;',
  // M=0 (a near-static comet) stays closest to the live preview for slow
  // relative speeds; forcing a full revolution played up to ~22x too fast.
  '  float M=floor(combW*Td/TAU+0.5);',
  '  rotAng=TAU*M*ph; headBase=0.0;',
  ' } else {',
  '  rotAng=t*u_rotSpeed; headBase=t*u_tracerSpeed;',
  ' }',
  ' float spin=ang+rotAng;',
  // The head moves at (tracerSpeed - rotSpeed); the tail must occupy the side
  // the head just left. tdir flips the tail with the relative motion so it
  // always TRAILS (sd>0 alone made it lead whenever tracerSpeed > rotSpeed).
  ' float tdir=(u_rotSpeed-u_tracerSpeed>=0.0)?1.0:-1.0;',
  ' float comet=0.0;float nucleus=0.0;',
  ' for(int i=0;i<6;i++){',
  '  if(float(i)>=u_tracerCount)break;',
  '  float off=float(i)/max(u_tracerCount,1.0)*TAU;',
  '  float head=headBase+off;',
  '  float sd=mod(spin-head,TAU);if(sd>PI)sd-=TAU;',
  '  float sdd=sd*tdir;',
  '  float nuc=exp(-sd*sd/(u_cometHead*u_cometHead*0.5+1e-4));',
  '  float tail=0.0;',
  '  if(sdd>0.0){',
  '   tail=exp(-sdd/max(u_tailLength,0.02));',
  '   tail*=smoothstep(0.0,u_cometHead*0.9+0.02,sdd);',
  '   tail*=1.0-smoothstep(PI*0.55,PI*0.99,sdd);',
  '   float fl=fbm(vec2(sdd*6.0+t*3.0,off*3.0+t*1.7));',
  '   if(lp>0.5){ float fl2=fbm(vec2(sdd*6.0+(t-Td)*3.0,off*3.0+(t-Td)*1.7)); fl=mix(fl,fl2,ph); }',
  '   tail*=mix(1.0,fl*1.7,clamp(u_sparkle,0.0,1.5));',
  '  }',
  '  nucleus=max(nucleus,nuc);',
  '  comet=max(comet,max(nuc,tail*0.92));',
  ' }',
  ' float th=u_thickness*(1.0+bt*u_burn*1.0)*(1.0+comet*u_cometBulge);',
  ' float ca=u_chroma*(1.0+comet*0.8);',
  ' float bR=band(dist,pr+ca,th),bG=band(dist,pr,th),bB=band(dist,pr-ca,th);',
  ' float bMax=max(bR,max(bG,bB));',
  ' float gR=halo(dist,pr+ca,th)*u_glow,gG=halo(dist,pr,th)*u_glow,gB=halo(dist,pr-ca,th)*u_glow;',
  ' vec2 dir=uv/max(dist,1e-4);',
  ' vec3 nrm=normalize(vec3(dir*((dist-pr)/max(th,1e-4))*1.4,1.0));',
  ' vec3 L=normalize(vec3(-0.55,0.6,0.75));',
  ' float spec=pow(max(dot(nrm,L),0.0),22.0);',
  ' vec3 baseCol=hsv2rgb(vec3(u_hue/360.0,0.85,1.0));',
  ' vec3 hotCol=mix(vec3(1.0,0.32,0.05),vec3(1.0,0.95,0.55),bt);',
  ' vec3 ringCol=mix(baseCol,hotCol,clamp(u_burn*bt*0.7,0.0,1.0));',
  ' vec3 cometCol=mix(hsv2rgb(vec3(u_tracerHue/360.0,0.8,1.0)),vec3(1.0,0.97,0.92),nucleus);',
  ' vec3 col=vec3(0.0);',
  ' col+=vec3(bR,bG,bB)*ringCol*1.4;',
  ' col+=vec3(gR,gG,gB)*ringCol;',
  ' col+=bMax*bt*u_burn*hotCol*1.3;',
  ' col+=bMax*spec*vec3(1.0,0.95,0.9)*1.2;',
  ' float cOn=comet*(bMax+gG*0.7);',
  ' col+=cOn*cometCol*u_tracerGlow;',
  ' col+=comet*gG*cometCol*0.7;',
  ' col+=nucleus*nucleus*bMax*vec3(1.0)*u_tracerGlow*0.6;',
  ' col+=smoothstep(pr,pr-0.28,dist)*0.06*ringCol;',
  ' col*=(0.82+(pulse*0.5+0.5)*0.36);',
  ' col*=1.0-clamp(u_vignette,0.0,2.0)*0.5*smoothstep(0.55,1.15,dist);',
  ' col*=u_exposure;',
  ' float lum=dot(col,vec3(0.299,0.587,0.114));',
  ' col=mix(vec3(lum),col,u_saturation);',
  ' col=(col-0.5)*u_contrast+0.5;col=max(col,0.0);',
  ' col=vec3(1.0)-exp(-col);',
  ' col=pow(max(col,0.0),vec3(1.0/max(u_gamma,0.1)));',
  ' float oa=clamp(max(col.r,max(col.g,col.b)),0.0,1.0);',
  ' vec3 oc=col/max(oa,0.0025);',
  ' gl_FragColor=(u_alphaMode>0.5)?vec4(clamp(oc,0.0,1.0),oa):vec4(col,1.0);}'
  ].join('\n');

  function compile(type,src){
    var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){console.error(gl.getShaderInfoLog(s));}
    return s;
  }
  var prog=gl.createProgram();
  gl.attachShader(prog,compile(gl.VERTEX_SHADER,VERT));
  gl.attachShader(prog,compile(gl.FRAGMENT_SHADER,FRAG));
  gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog,gl.LINK_STATUS)){ document.getElementById('crtFallback').style.display='flex'; return; }
  gl.useProgram(prog);

  var buf=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  var loc=gl.getAttribLocation(prog,'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);

  var U={res:gl.getUniformLocation(prog,'u_resolution'),time:gl.getUniformLocation(prog,'u_time'),
         alphaMode:gl.getUniformLocation(prog,'u_alphaMode'),loop:gl.getUniformLocation(prog,'u_loop'),
         phase:gl.getUniformLocation(prog,'u_phase'),loopDur:gl.getUniformLocation(prog,'u_loopDur')};
  CONFIG.forEach(function(c){ U[c.key]=gl.getUniformLocation(prog,'u_'+c.key); });

  var exporting=false;
  function resize(){
    if(exporting) return;
    var dpr=Math.min(window.devicePixelRatio||1,2);
    var w=Math.max(2,Math.round(canvas.clientWidth*dpr));
    var h=Math.max(2,Math.round(canvas.clientHeight*dpr));
    if(canvas.width!==w||canvas.height!==h){ canvas.width=w; canvas.height=h; }
    gl.viewport(0,0,canvas.width,canvas.height);
    var hud=document.getElementById('hudRes'); if(hud) hud.textContent=canvas.clientWidth+' \u00b7 '+canvas.clientHeight;
  }
  if(window.ResizeObserver){ new ResizeObserver(resize).observe(canvas); }
  window.addEventListener('resize',resize);

  var playing=true,elapsed=0,last=performance.now();
  function frame(now){
    if(playing&&!exporting){ elapsed+=Math.min((now-last)/1000,0.05); }
    last=now;
    if(!exporting){
      resize();
      gl.uniform2f(U.res,canvas.width,canvas.height);
      gl.uniform1f(U.time,elapsed);
      gl.uniform1f(U.alphaMode,0.0);
      gl.uniform1f(U.loop,0.0); gl.uniform1f(U.phase,0.0); gl.uniform1f(U.loopDur,1.0);
      CONFIG.forEach(function(c){ gl.uniform1f(U[c.key],params[c.key]); });
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- JSON IO panel ---------- */
  var jsonPanel=document.getElementById('crtJsonPanel'),jsonArea=document.getElementById('crtJson'),statusEl=document.getElementById('crtStatus');
  // While the user is hand-editing the textarea (dirty), param changes must not
  // clobber it; otherwise the open panel live-tracks the current state.
  var jsonDirty=false;
  jsonArea.addEventListener('input',function(){ jsonDirty=true; });
  function setStatus(msg,kind){ statusEl.textContent=msg; statusEl.className='status'+(kind?' '+kind:''); }
  function buildJSON(){
    var p={};
    CONFIG.forEach(function(c){ p[c.key]=c.step>=1?Math.round(params[c.key]):parseFloat(Number(params[c.key]).toFixed(decimals(c.step))); });
    return JSON.stringify({effect:'chromatic_burning_comet_ring',version:11,exportedAt:new Date().toISOString(),preset:presetSel.value||null,parameters:p},null,2);
  }
  function refreshExport(){ if(jsonPanel.classList.contains('open')&&!jsonDirty) jsonArea.value=buildJSON(); }
  function importJSON(){
    var txt=jsonArea.value.trim();
    if(!txt){ setStatus('Paste a JSON config into the box first.','err'); return; }
    var data; try{ data=JSON.parse(txt); }catch(e){ setStatus('Invalid JSON — '+e.message,'err'); eclog('error','config.import_error',{reason:e.message},'Invalid JSON'); return; }
    var src=(data&&typeof data.parameters==='object'&&data.parameters)?data.parameters:data;
    if(!src||typeof src!=='object'){ setStatus('No parameters object found.','err'); return; }
    var applied=0,clamped=0;
    CONFIG.forEach(function(c){
      var v=src[c.key];
      if(typeof v==='number'&&isFinite(v)){
        var s=snap(c,v);
        if(s!==parseFloat(Number(v).toFixed(6))) clamped++;
        params[c.key]=s; applied++;
      }
    });
    if(applied===0){ setStatus('No matching parameter keys found in that JSON.','err'); return; }
    syncUI(); updateAuto();
    presetSel.value=(data&&data.preset&&PRESETS[data.preset])?data.preset:'';
    syncPresetChips();
    setStatus('Applied '+applied+' of '+CONFIG.length+' parameters'+(clamped?' ('+clamped+' clamped to range)':'')+'.','ok');
    jsonArea.value=buildJSON(); jsonDirty=false; // canonicalize: panel now reflects applied state
    eclog('info','config.import',{applied:applied,clamped:clamped,preset:presetSel.value||null},'Imported '+applied+' parameters');
    commitHistory();
  }
  document.getElementById('crtJsonBtn').addEventListener('click',function(){
    jsonPanel.classList.toggle('open');
    var open=jsonPanel.classList.contains('open');
    if(open){ jsonArea.value=buildJSON(); jsonDirty=false; setStatus('Current state loaded. Edit or paste, then Apply.',''); }
    eclog('info','ui.panel.'+(open?'open':'close'),{panel:'json'},'JSON panel '+(open?'opened':'closed'));
  });
  document.getElementById('crtApplyBtn').addEventListener('click',importJSON);
  document.getElementById('crtRefreshBtn').addEventListener('click',function(){ jsonArea.value=buildJSON(); jsonDirty=false; setStatus('Reloaded current state.',''); });
  document.getElementById('crtCloseBtn').addEventListener('click',function(){ jsonPanel.classList.remove('open'); });
  document.getElementById('crtCopyBtn').addEventListener('click',function(){
    jsonArea.select(); var btn=this;
    function done(){
      var orig=btn.innerHTML;
      btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Copied';
      setTimeout(function(){ btn.innerHTML=orig; },1400);
      eclog('info','config.copy',{},'Copied parameter JSON to clipboard');
    }
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(jsonArea.value).then(done,function(){ try{ if(document.execCommand('copy'))done(); }catch(e){} });
    } else { try{ if(document.execCommand('copy'))done(); }catch(e){} }
  });
  document.getElementById('crtDownloadBtn').addEventListener('click',function(){
    var blob=new Blob([jsonArea.value||buildJSON()],{type:'application/json'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a'); a.href=url; a.download='orb-forge.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); },1000);
    eclog('info','config.download',{filename:'orb-forge.json'},'Downloaded orb-forge.json');
  });
  document.getElementById('crtResetBtn').addEventListener('click',function(){
    CONFIG.forEach(function(c){ params[c.key]=c.def; });
    syncUI(); presetSel.value=''; refreshExport(); updateAuto(); syncPresetChips();
    eclog('info','params.reset',{count:CONFIG.length},'Reset all parameters to defaults');
    commitHistory();
  });

  function tameBrightness(){
    var load=params.exposure*1.25+params.glow*0.62+params.tracerGlow*0.58+params.burn*0.45
            +Math.max(0,params.contrast-1.0)*1.6+Math.max(0,params.thickness-0.03)*4.0;
    var CAP=5.4;
    if(load>CAP){
      var s=CAP/load;
      params.exposure=clamp(params.exposure*Math.pow(s,0.9),0.55,5);
      params.glow=clamp(params.glow*s,0,6);
      params.tracerGlow=clamp(params.tracerGlow*s,0,6);
      params.burn=clamp(params.burn*Math.sqrt(s),0,4);
      params.contrast=clamp(1.0+(params.contrast-1.0)*s,0.2,3);
    }
  }
  document.getElementById('crtRandomBtn').addEventListener('click',function(){
    CONFIG.forEach(function(c){
      var lo=c.rmin!==undefined?c.rmin:c.min, hi=c.rmax!==undefined?c.rmax:c.max;
      var steps=Math.max(1,Math.round((hi-lo)/c.step));
      params[c.key]=snap(c,lo+Math.round(Math.random()*steps)*c.step);
    });
    tameBrightness();
    CONFIG.forEach(function(c){ params[c.key]=snap(c,params[c.key]); });
    syncUI(); presetSel.value=''; refreshExport(); updateAuto(); syncPresetChips();
    eclog('info','params.randomize',{},'Randomized within sensible ranges');
    commitHistory();
  });
  var playBtn=document.getElementById('crtPlayBtn');
  playBtn.addEventListener('click',function(){
    playing=!playing;
    playBtn.innerHTML=playing
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>Pause'
      : '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 4 20 12 6 20 6 4"/></svg>Play';
    playBtn.title=playing?'Pause the animation (Space)':'Resume the animation (Space)';
    var live=document.getElementById('hudLive');
    if(live){
      live.classList.toggle('is-paused',!playing);
      var lv=live.querySelector('.v'); if(lv) lv.textContent=playing?'LIVE':'PAUSED';
    }
    eclog('info','playback.'+(playing?'resume':'pause'),{playing:playing},playing?'Playback resumed':'Playback paused');
  });

  /* ---------- Click the preview to pause / resume ---------- */
  (function(){
    var stage=document.querySelector('.stage');
    if(!stage) return;
    stage.setAttribute('title','Click to pause or resume');
    stage.addEventListener('click',function(){ if(!exporting) playBtn.click(); });
  })();

  /* ---------- Keyboard shortcuts ---------- */
  document.addEventListener('keydown',function(e){
    if(e.target&&/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    var mod=e.ctrlKey||e.metaKey;
    if(mod&&!e.shiftKey&&(e.key==='z'||e.key==='Z')){ e.preventDefault(); undo(); }
    else if(mod&&(e.shiftKey&&(e.key==='z'||e.key==='Z')||e.key==='y'||e.key==='Y')){ e.preventDefault(); redo(); }
    // Space must not steal native activation from a focused button/link.
    else if((e.key===' '||e.code==='Space')&&!(e.target&&/^(BUTTON|A)$/.test(e.target.tagName))){ e.preventDefault(); playBtn.click(); }
  });

  /* ---------- WEBP export ---------- */
  var webpPanel=document.getElementById('crtWebpPanel'),webpStatus=document.getElementById('crtWebpStatus');
  var overlay=document.getElementById('crtOverlay'),ovText=document.getElementById('crtOvText'),ovFill=document.getElementById('crtOvFill');
  var resSel=document.getElementById('crtRes'),fpsSel=document.getElementById('crtFps'),qualSel=document.getElementById('crtQual'),targetSel=document.getElementById('crtTarget');
  var durInp=document.getElementById('crtDur'),durVal=document.getElementById('crtDurVal'),frameInfo=document.getElementById('crtFrameInfo');
  var renderBtn=document.getElementById('crtRenderBtn'),estBtn=document.getElementById('crtEstBtn'),transpChk=document.getElementById('crtTransp'),autoChk=document.getElementById('crtAuto');
  var autoT=3.0;
  var manualDl=document.getElementById('crtManualDl'),lastManualUrl=null;
  function setWebpStatus(msg,kind){ webpStatus.textContent=msg; webpStatus.className='status'+(kind?' '+kind:''); }
  function setOv(t,frac){ ovText.textContent=t; ovFill.style.width=Math.round(clamp(frac,0,1)*100)+'%'; }
  function showManualDownload(url,bytes){
    if(!manualDl) return;
    if(lastManualUrl) URL.revokeObjectURL(lastManualUrl);
    lastManualUrl=url;
    manualDl.href=url; manualDl.hidden=false;
    manualDl.title='Save orb-forge.webp ('+fmtSize(bytes)+')';
  }

  function autoDuration(){
    var DMIN=2.0,DMAX=9.0;
    var cometActive=params.tracerCount>=1&&Math.abs(params.rotSpeed-params.tracerSpeed)>0.05;
    function secScore(T){
      var s=0;
      if(params.pulseSpeed>0.05&&params.pulseAmount>0.001){
        var pc=params.pulseSpeed*T/TAU; s+=0.6*Math.abs(pc-Math.round(pc));
      }
      if(params.wobble>0.002){
        [1.3,0.9,0.5].forEach(function(f){ var c=f*T/TAU; s+=0.12*Math.abs(c-Math.round(c)); });
      }
      return s;
    }
    if(cometActive){
      var P=TAU/Math.abs(params.rotSpeed-params.tracerSpeed);
      var cands=[],k;
      for(k=1;k<=60;k++){ var T=k*P; if(T>=DMIN&&T<=DMAX) cands.push(T); }
      if(cands.length===0) return clamp(P,DMIN,DMAX);
      var best=cands[0],bestS=1e9;
      for(var ci=0;ci<cands.length;ci++){
        var s=secScore(cands[ci])+0.02*Math.abs(cands[ci]-4.5);
        if(s<bestS){ bestS=s; best=cands[ci]; }
      }
      return best;
    } else {
      var bb=4.5,bs=1e9;
      for(var T2=DMIN;T2<=7.0001;T2+=0.02){
        var s2=secScore(T2)+0.013*Math.abs(T2-4.0);
        if(s2<bs){ bs=s2; bb=T2; }
      }
      return bb;
    }
  }
  function currentDur(){ return autoChk.checked?autoT:parseFloat(durInp.value); }
  function updFrameInfo(){
    var fps=parseInt(fpsSel.value,10),dur=currentDur();
    durVal.textContent=dur.toFixed(2)+' s';
    var tg=parseFloat(targetSel.value);
    frameInfo.textContent='\u2248 '+Math.max(2,Math.round(fps*dur))+' frames \u00b7 '+dur.toFixed(2)+' s'+(tg>0?' \u00b7 target '+fmtSize(tg):'');
  }
  function updateAuto(){
    if(!autoChk) return;
    if(autoChk.checked){
      autoT=autoDuration();
      durInp.value=clamp(autoT,parseFloat(durInp.min),parseFloat(durInp.max));
      durInp.disabled=true;
    } else {
      durInp.disabled=false;
      autoT=parseFloat(durInp.value);
    }
    updFrameInfo();
  }
  autoChk.addEventListener('change',updateAuto);
  fpsSel.addEventListener('change',updFrameInfo);
  targetSel.addEventListener('change',updFrameInfo);
  durInp.addEventListener('input',updFrameInfo);
  updateAuto();
  document.getElementById('crtWebpBtn').addEventListener('click',function(){
    webpPanel.classList.toggle('open');
    var open=webpPanel.classList.contains('open');
    if(open) updateAuto();
    eclog('info','ui.panel.'+(open?'open':'close'),{panel:'export'},'Export panel '+(open?'opened':'closed'));
  });

  function w24(a,o,v){ a[o]=v&255; a[o+1]=(v>>8)&255; a[o+2]=(v>>16)&255; }
  function concat(list){
    var n=0,i; for(i=0;i<list.length;i++) n+=list[i].length;
    var out=new Uint8Array(n),o=0;
    for(i=0;i<list.length;i++){ out.set(list[i],o); o+=list[i].length; }
    return out;
  }
  function mkChunk(fourcc,payload){
    var sz=payload.length,pad=sz&1;
    var out=new Uint8Array(8+sz+pad);
    out[0]=fourcc.charCodeAt(0);out[1]=fourcc.charCodeAt(1);out[2]=fourcc.charCodeAt(2);out[3]=fourcc.charCodeAt(3);
    out[4]=sz&255;out[5]=(sz>>8)&255;out[6]=(sz>>16)&255;out[7]=(sz>>>24)&255;
    out.set(payload,8);
    return out;
  }
  function parseWebP(b){
    var out={},p=12;
    while(p+8<=b.length){
      var fc=String.fromCharCode(b[p],b[p+1],b[p+2],b[p+3]);
      var sz=(b[p+4])|(b[p+5]<<8)|(b[p+6]<<16)|((b[p+7]<<24)>>>0);
      if(sz<0||p+8+sz>b.length) break;
      out[fc]=b.subarray(p+8,p+8+sz);
      p+=8+sz+(sz&1);
    }
    return out;
  }
  function muxAnimatedWebP(frames,size,delay){
    var anmf=[],hasAlpha=false,i;
    for(i=0;i<frames.length;i++){
      var ch=parseWebP(frames[i]);
      var imgName=ch['VP8 ']?'VP8 ':(ch['VP8L']?'VP8L':null);
      if(!imgName) throw new Error('frame '+(i+1)+' missing bitstream');
      var parts=[];
      if(ch['ALPH']){ hasAlpha=true; parts.push(mkChunk('ALPH',ch['ALPH'])); }
      else if(imgName==='VP8L'){
        // Lossless frames carry alpha inside the bitstream (no ALPH chunk).
        // VP8L header: byte0=0x2f signature, then a 32-bit field whose bit 28 is alpha_is_used.
        var lp=ch['VP8L'];
        if(lp.length>=5 && (((lp[1]|(lp[2]<<8)|(lp[3]<<16)|(lp[4]<<24))>>>0)&0x10000000)) hasAlpha=true;
      }
      parts.push(mkChunk(imgName,ch[imgName]));
      var frameData=concat(parts);
      var hdr=new Uint8Array(16);
      w24(hdr,0,0); w24(hdr,3,0); w24(hdr,6,size-1); w24(hdr,9,size-1); w24(hdr,12,delay);
      hdr[15]=0x02;
      anmf.push(mkChunk('ANMF',concat([hdr,frameData])));
    }
    var vp8x=new Uint8Array(10);
    vp8x[0]=0x02|(hasAlpha?0x10:0);
    w24(vp8x,4,size-1); w24(vp8x,7,size-1);
    var anim=new Uint8Array(6);
    var body=concat([mkChunk('VP8X',vp8x),mkChunk('ANIM',anim)].concat(anmf));
    var head=new Uint8Array(12);
    head[0]=82;head[1]=73;head[2]=70;head[3]=70;
    var rs=4+body.length;
    head[4]=rs&255;head[5]=(rs>>8)&255;head[6]=(rs>>16)&255;head[7]=(rs>>>24)&255;
    head[8]=87;head[9]=69;head[10]=66;head[11]=80;
    return concat([head,body]);
  }
  function finishExport(msg,kind,data){
    exporting=false; renderBtn.disabled=false; estBtn.disabled=false; overlay.style.display='none';
    if(msg){ setWebpStatus(msg,kind||'ok'); eclog(kind==='err'?'error':'ready',kind==='err'?'export.error':'export.done',data||{},msg); }
    resize();
  }
  function encodeBlob(cnv,q){
    return new Promise(function(res,rej){
      // Browsers without WebP encoding (e.g. Safari) silently fall back to
      // image/png — treat that as failure so estimates never use PNG sizes.
      cnv.toBlob(function(b){ (b&&b.type==='image/webp')?res(b):rej(new Error(b?'no_webp':'encode failed')); },'image/webp',q);
    });
  }

  function runExport(estimateOnly){
    if(exporting) return;
    var size0=parseInt(resSel.value,10),fps0=parseInt(fpsSel.value,10),manualQ=parseFloat(qualSel.value);
    var T=currentDur(),transparent=transpChk.checked,target=parseFloat(targetSel.value);
    exporting=true; renderBtn.disabled=true; estBtn.disabled=true; overlay.style.display='flex';
    if(manualDl) manualDl.hidden=true;
    eclog('info','export.start',{mode:estimateOnly?'estimate':'render',size:size0,fps:fps0,quality:manualQ,duration:T,target:target||null,transparent:transparent},(estimateOnly?'Estimating':'Exporting')+' \u2014 '+size0+' px, '+fps0+' fps, '+T.toFixed(2)+' s');

    function setupGL(size){
      canvas.width=size; canvas.height=size;
      gl.viewport(0,0,size,size);
      gl.uniform2f(U.res,size,size);
      gl.uniform1f(U.alphaMode,transparent?1.0:0.0);
      gl.uniform1f(U.loop,1.0); gl.uniform1f(U.loopDur,T);
      CONFIG.forEach(function(c){ gl.uniform1f(U[c.key],params[c.key]); });
    }
    function makeCtx(size){ var cv=document.createElement('canvas'); cv.width=cv.height=size; return {cv:cv,ctx:cv.getContext('2d')}; }
    function renderPhaseTo(size,phase,ctx,pix){
      gl.uniform1f(U.phase,phase); gl.uniform1f(U.time,phase*T);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      gl.readPixels(0,0,size,size,gl.RGBA,gl.UNSIGNED_BYTE,pix);
      var img=ctx.createImageData(size,size),y;
      for(y=0;y<size;y++){ img.data.set(pix.subarray((size-1-y)*size*4,(size-y)*size*4),y*size*4); }
      ctx.putImageData(img,0,0);
    }

    function fullRender(size,fps,q,note){
      var nF=Math.max(2,Math.round(fps*T)),delay=Math.max(1,Math.round(1000*T/nF));
      var o=makeCtx(size),pix=new Uint8Array(size*size*4),frames=[];
      setupGL(size);
      setWebpStatus('Rendering '+nF+' frames\u2026','');
      function cap(i){
        if(i>=nF){
          setOv('Assembling WebP\u2026',0.98);
          setTimeout(function(){
            try{
              var bytes=muxAnimatedWebP(frames,size,delay);
              var blob=new Blob([bytes],{type:'image/webp'});
              var url=URL.createObjectURL(blob);
              var a=document.createElement('a'); a.href=url; a.download='orb-forge.webp';
              document.body.appendChild(a); a.click(); a.remove();
              showManualDownload(url,blob.size); // fallback if the browser blocked the auto-download
              finishExport('Exported '+fmtSize(blob.size)+' \u2014 '+size+' px, '+fps+' fps, '+nF+' frames, '+T.toFixed(2)+' s'+(transparent?', transparent':'')+note,'ok',{bytes:blob.size,size:size,fps:fps,frames:nF,duration:T,transparent:transparent});
            }catch(e){ finishExport('Assembly failed: '+(e&&e.message||e),'err',{reason:e&&e.message||String(e)}); }
          },20);
          return;
        }
        renderPhaseTo(size,i/nF,o.ctx,pix);
        o.cv.toBlob(function(blob){
          if(!blob){ finishExport('Frame export returned nothing.','err',{}); return; }
          if(blob.type!=='image/webp'){ finishExport('This browser cannot encode WebP \u2014 try Chrome, Edge, or a recent Firefox.','err',{reason:'no_webp'}); return; }
          blob.arrayBuffer().then(function(ab){
            frames.push(new Uint8Array(ab));
            if(i%10===0||i===nF-1) eclog('info','export.frame',{n:i+1,of:nF},'Encoded frame '+(i+1)+'/'+nF);
            setOv('Rendering frame '+(i+1)+' / '+nF,0.45+(i+1)/nF*0.5);
            setTimeout(function(){ cap(i+1); },0);
          }).catch(function(e){ finishExport('Read error: '+(e&&e.message||e),'err',{}); });
        },'image/webp',q);
      }
      cap(0);
    }

    var qLadder=[0.18,0.3,0.45,0.6,0.78,1.0];
    var resCand=[192,256,360,480,512].filter(function(r){ return r<=size0; });
    var fpsCand=[12,15,24,30,60].filter(function(f){ return f<=fps0; });

    if(estimateOnly){
      setOv('Estimating\u2026',0.3);
      var o1=makeCtx(size0),pix1=new Uint8Array(size0*size0*4);
      setupGL(size0);
      renderPhaseTo(size0,0.3,o1.ctx,pix1);
      encodeBlob(o1.cv,manualQ).then(function(b){
        var nF=Math.max(2,Math.round(fps0*T));
        var est=b.size*nF*1.04+400;
        finishExport('Estimated \u2248 '+fmtSize(est)+' at '+size0+' px, '+fps0+' fps, quality '+manualQ.toFixed(2)+' ('+nF+' frames).','ok',{estimated_bytes:est,frames:nF,size:size0,fps:fps0});
      }).catch(function(){ finishExport('This browser cannot encode WebP \u2014 try Chrome, Edge, or a recent Firefox.','err',{reason:'no_webp'}); });
      return;
    }
    if(!target){
      setOv('Rendering\u2026',0.05);
      fullRender(size0,fps0,manualQ,'');
      return;
    }

    var perFrame={};
    function calibrate(ri){
      if(ri>=resCand.length){ choose(); return; }
      var rs=resCand[ri];
      setupGL(rs);
      var o=makeCtx(rs),pix=new Uint8Array(rs*rs*4);
      renderPhaseTo(rs,0.3,o.ctx,pix);
      perFrame[rs]={};
      function eq(qi){
        if(qi>=qLadder.length){
          eclog('info','export.calibrate',{resolution:rs,samples:Object.keys(perFrame[rs]).length},'Calibrated '+rs+' px');
          setOv('Calibrating sizes\u2026 '+rs+' px',0.05+0.35*(ri+1)/resCand.length);
          setTimeout(function(){ calibrate(ri+1); },0);
          return;
        }
        encodeBlob(o.cv,qLadder[qi]).then(function(b){
          perFrame[rs][qLadder[qi]]=b.size; eq(qi+1);
        }).catch(function(){ finishExport('This browser cannot encode WebP \u2014 try Chrome, Edge, or a recent Firefox.','err',{reason:'no_webp'}); });
      }
      eq(0);
    }
    function choose(){
      var fits=[];
      resCand.forEach(function(rs){
        fpsCand.forEach(function(fp){
          var nF=Math.max(2,Math.round(fp*T));
          qLadder.forEach(function(q){
            var est=perFrame[rs][q]*nF*1.04+400;
            if(est<=target*0.95) fits.push({rs:rs,fp:fp,q:q,nF:nF,est:est});
          });
        });
      });
      var pick,note;
      if(fits.length){
        var watchable=fits.filter(function(f){ return f.fp>=24; });
        var pool=watchable.length?watchable:fits;
        pool.sort(function(a,b){ return (b.rs-a.rs)||(b.fp-a.fp)||(b.q-a.q); });
        pick=pool[0];
        note=' \u00b7 auto-tuned to fit '+fmtSize(target);
        eclog('info','export.autotune',{resolution:pick.rs,fps:pick.fp,quality:pick.q,target:target,estimated:pick.est},'Auto-tuned to '+pick.rs+' px / '+pick.fp+' fps / q'+pick.q.toFixed(2));
      } else {
        var rs=resCand[0],fp=fpsCand[0],q=qLadder[0],nF=Math.max(2,Math.round(fp*T));
        pick={rs:rs,fp:fp,q:q,nF:nF};
        note=' \u00b7 smallest possible \u2014 still over '+fmtSize(target)+', shorten the loop or lower the base resolution';
        eclog('warn','export.autotune_overflow',{target:target},'No configuration fits the target — using smallest');
      }
      setOv('Rendering\u2026',0.42);
      fullRender(pick.rs,pick.fp,pick.q,note);
    }
    setOv('Calibrating sizes\u2026',0.05);
    setWebpStatus('Calibrating frame sizes\u2026','');
    calibrate(0);
  }

  renderBtn.addEventListener('click',function(){ runExport(false); });
  estBtn.addEventListener('click',function(){ runExport(true); });

  /* ---------- Terminal wiring ---------- */
  function initTerm(){
    TERM_BODY=document.getElementById('logConsole');
    TERM_COUNT=document.getElementById('termCount');
    var termEl=document.getElementById('term');
    document.getElementById('termCopy').addEventListener('click',function(){
      var txt=bufferToJSONL(); var btn=this;
      function flash(ok){
        var o=btn.innerHTML;
        btn.innerHTML=ok
          ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Copied'
          : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>Failed';
        setTimeout(function(){ btn.innerHTML=o; },1200);
      }
      function fallback(){
        var ta=document.createElement('textarea');
        ta.value=txt; ta.setAttribute('readonly','');
        ta.style.position='fixed'; ta.style.opacity='0';
        document.body.appendChild(ta); ta.select();
        var ok=false; try{ ok=document.execCommand('copy'); }catch(e){}
        ta.remove();
        flash(ok);
      }
      if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(function(){ flash(true); },fallback); }
      else fallback();
    });
    document.getElementById('termDownload').addEventListener('click',function(){
      var blob=new Blob([bufferToJSONL()+'\n'],{type:'application/x-ndjson'});
      var url=URL.createObjectURL(blob);
      var a=document.createElement('a'); a.href=url; a.download='orb-forge.events.jsonl';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function(){ URL.revokeObjectURL(url); },1000);
    });
    document.getElementById('termClear').addEventListener('click',function(){
      BUFFER.length=0; COUNT=0; TERM_BODY.innerHTML='';
      TERM_COUNT.textContent='0 events';
    });
    document.getElementById('termToggle').addEventListener('click',function(){
      termEl.classList.toggle('is-collapsed');
      document.body.classList.toggle('term-collapsed', termEl.classList.contains('is-collapsed'));
      document.getElementById('termToggleLabel').textContent=termEl.classList.contains('is-collapsed')?'Show':'Hide';
    });
  }
  initTerm();

  /* ---------- Initial events + history baseline ---------- */
  var glInfo={vendor:gl.getParameter(gl.VENDOR),renderer:gl.getParameter(gl.RENDERER)};
  try{ var dbg=gl.getExtension('WEBGL_debug_renderer_info'); if(dbg){ glInfo.unmasked_renderer=gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL); } }catch(e){}
  eclog('ready','app.start',{params:CONFIG.length,presets:Object.keys(PRESETS).length},'Orb.Forge initialized');
  eclog('info','gl.ready',glInfo,'WebGL context ready');
  HIST.push(snapshot()); updateHistoryUI();

  /* ---------- Wire history buttons ---------- */
  document.getElementById('btnUndo').addEventListener('click',undo);
  document.getElementById('btnRedo').addEventListener('click',redo);
})();
