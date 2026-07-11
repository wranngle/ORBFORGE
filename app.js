(function(){
  var TAU=Math.PI*2;
  var GROUPS=[
    {name:'Ring & motion', items:[
      {key:'radius',     label:'Radius',          min:0.08,max:0.72,step:0.01, def:0.40, desc:'Distance from canvas center to the ring (0–1 of canvas)'},
      {key:'thickness',  label:'Border thickness',min:0.005,max:0.22,step:0.005,def:0.025,rmin:0.01,rmax:0.085, desc:'Width of the ring band — thicker = more presence'},
      {key:'rotSpeed',   label:'Rotation',        min:-6,  max:6,   step:0.1,  def:0.4,  desc:'Ring angular speed in rad/s. Negative reverses direction.'},
      {key:'pulseSpeed', label:'Pulse speed',     min:0,   max:14,  step:0.1,  def:2.2,  desc:'How quickly the ring breathes / pulses'},
      {key:'pulseAmount',label:'Pulse amount',    min:0,   max:0.45,step:0.01, def:0.07,rmin:0,rmax:0.22, desc:'How much the radius pulses (0 = none)'},
      {key:'wobble',     label:'Wobble / warp',   min:0,   max:0.25,step:0.01, def:0.04, desc:'How much the ring distorts into non-circular shapes'},
      {key:'timeJitter', label:'Time jitter',     min:0,   max:0.8, step:0.01, def:0,   rmin:0,rmax:0.3, desc:'Warps time back and forth within the loop — motion surges forward and briefly reverses. 0 = steady time.'},
      {key:'jitterRate', label:'Jitter rate',     min:0.2, max:10,  step:0.1,  def:2,   rmin:0.5,rmax:6, desc:'How fast the time warp oscillates (only matters when Time jitter > 0)'}
    ]},
    {name:'Burning texture', items:[
      {key:'burn',       label:'Burn intensity',  min:0,   max:4,   step:0.05, def:1,   rmin:0.2,rmax:2.2, desc:'Strength of the noise-driven fire texture on the ring'},
      {key:'noiseScale', label:'Texture scale',   min:0.5, max:50,  step:0.5,  def:8,   desc:'How fine vs coarse the burn pattern is'},
      {key:'flowSpeed',  label:'Flame flow speed',min:0,   max:5,   step:0.1,  def:1,   desc:'How fast the flame texture drifts'},
      {key:'glow',       label:'Glow intensity',  min:0,   max:6,   step:0.1,  def:1.3, rmin:0.4,rmax:2.6, desc:'Brightness of the soft halo around the ring'},
      {key:'chroma',     label:'Chromatic aberration',min:0,max:0.16,step:0.002,def:0.014,rmin:0.002,rmax:0.07, desc:'RGB channel separation — bigger = more rainbow fringing'}
    ]},
    {name:'Comet / tracer', items:[
      {key:'tracerCount',label:'Comet count',     min:0,   max:6,   step:1,    def:1,   desc:'Number of comets travelling around the ring (0 disables)'},
      {key:'tracerSpeed',label:'Travel speed',    min:-12, max:12,  step:0.1,  def:2.6, desc:'Comet angular speed (negative reverses direction)'},
      {key:'cometHead',  label:'Head size',       min:0.02,max:1.2, step:0.02, def:0.22,rmin:0.06,rmax:0.5, desc:'Width of each comet’s bright nucleus'},
      {key:'tailLength', label:'Tail length',     min:0.05,max:5,   step:0.05, def:1.1, desc:'How far each comet’s tail trails behind'},
      {key:'cometBulge', label:'Head bulge',      min:0,   max:4,   step:0.1,  def:1.4, rmin:0.3,rmax:2.6, desc:'How much the ring bulges where a comet is'},
      {key:'tracerGlow', label:'Comet brightness',min:0,   max:6,   step:0.1,  def:2.2, rmin:0.6,rmax:3.0, desc:'Brightness of comets vs the ring'},
      {key:'sparkle',    label:'Tail flicker',    min:0,   max:1.5, step:0.05, def:0.5, desc:'Random ember shimmer along each tail'}
    ]},
    {name:'Color & post', items:[
      {key:'hue',        label:'Ring hue',        min:0,   max:360, step:1,    def:24,  hue:true, desc:'Hue of the ring (0–360°)'},
      {key:'tracerHue',  label:'Comet hue',       min:0,   max:360, step:1,    def:40,  hue:true, desc:'Hue of the comets (0–360°)'},
      {key:'saturation', label:'Saturation',      min:0,   max:2,   step:0.05, def:1,   rmin:0.7,rmax:1.35, desc:'Color intensity (0 = grayscale)'},
      {key:'exposure',   label:'Exposure',        min:0.1, max:5,   step:0.05, def:1.3, rmin:0.85,rmax:1.55, desc:'Overall brightness'},
      {key:'contrast',   label:'Contrast',        min:0.2, max:3,   step:0.05, def:1.15,rmin:0.9,rmax:1.4, desc:'Tonal contrast'},
      {key:'gamma',      label:'Gamma',           min:0.3, max:2.6, step:0.05, def:1,   rmin:0.95,rmax:1.3, desc:'Mid-tone curve (lower = brighter mid-tones)'},
      {key:'vignette',   label:'Vignette',        min:0,   max:2,   step:0.05, def:0.5, rmin:0.3,rmax:1.4, desc:'Darkens the canvas edges around the orb'}
    ]}
  ];
  var CONFIG=[]; GROUPS.forEach(function(g){ g.items.forEach(function(it){ CONFIG.push(it); }); });

  /* ---------- Background (not a slider param — checkbox + colors) ---------- */
  var BG_DEF={transparent:true,top:'#0b0916',bottom:'#050409'};
  var BG={transparent:BG_DEF.transparent,top:BG_DEF.top,bottom:BG_DEF.bottom};

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
  try{
    var raw=localStorage.getItem('orb_forge.presets');
    if(raw){ var up=JSON.parse(raw); if(up&&typeof up==='object'){ Object.keys(up).forEach(function(k){ USER_PRESETS[k]=up[k]; PRESETS[k]=up[k]; }); } }
  }catch(e){}
  function persistUserPresets(){
    try{ localStorage.setItem('orb_forge.presets',JSON.stringify(USER_PRESETS)); return true; }
    catch(e){
      eclog('warn','preset.persist_error',{reason:e&&e.message||String(e)},'Preset storage unavailable — changes last only until reload');
      return false;
    }
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
    timeJitter:  '<path d="M16 4h5v5"/><path d="M4 20L21 4"/><path d="M21 15v5h-5"/><path d="m14 14 7 6"/><path d="M4 4l6 6"/>',
    jitterRate:  '<circle cx="12" cy="13" r="8"/><path d="M12 13l3.5-3.5"/><path d="M12 5V3M5 6l1.5 1.5M19 6l-1.5 1.5"/>',
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
    bgTransparent:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h6v6H3zM9 3h6v6H9zM15 9h6v6h-6zM9 15h6v6H9z" fill="currentColor" stroke="none" opacity=".3"/>',
    bgTop:       '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v4H3z" fill="currentColor" stroke="none" opacity=".5"/>',
    bgBottom:    '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 14h18v4a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z" fill="currentColor" stroke="none" opacity=".5"/>',
    _default:    '<circle cx="12" cy="12" r="3"/>'
  };

  /* ---------- helpers ---------- */
  // Decimal places come straight from the step, so the display precision and
  // the ± increment always agree (step 0.1 → "0.4", step 0.005 → "0.025").
  function decimals(s){ s=String(s); var i=s.indexOf('.'); return i<0?0:(s.length-i-1); }
  // Show the exact stored value: start at the step's precision, widen (max 3)
  // only when a preset/typed/imported value carries more digits than the step.
  function fmt(c,v){
    v=Number(v);
    for(var d=decimals(c.step);d<3;d++){
      var s=v.toFixed(d);
      if(parseFloat(s)===v) return s;
    }
    return v.toFixed(3);
  }
  function clamp(v,lo,hi){ return v<lo?lo:(v>hi?hi:v); }
  function snap(c,v){ return parseFloat(clamp(v,c.min,c.max).toFixed(Math.max(decimals(c.step),3))); }
  function fmtSize(b){ return b>=1048576?(b/1048576).toFixed(2)+' MB':Math.round(b/1024)+' KB'; }
  function pct(c,v){ var r=c.max-c.min; return r>0?((v-c.min)/r*100):0; }
  function escAttr(s){ return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function paramTitle(c){
    var range='Range '+c.min+' → '+c.max+' · ± '+c.step+' per step · click the value to type';
    return (c.desc?c.desc+'\n':'')+range;
  }
  function hexOk(h){ return typeof h==='string'&&/^#[0-9a-fA-F]{6}$/.test(h); }
  function hexToRgbF(h){
    return [parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255];
  }
  function hslToHex(h,s,l){
    s/=100;l/=100;
    var k=function(n){ return (n+h/30)%12; };
    var a=s*Math.min(l,1-l);
    var f=function(n){ var c=l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1))); return Math.round(c*255).toString(16).padStart(2,'0'); };
    return '#'+f(0)+f(8)+f(4);
  }

  /* ---------- ECS / JSONL log ---------- */
  var TERM_BODY, BUFFER=[], MAX_LINES=300;
  function categoryFor(action){
    if(action.indexOf('preset.')===0) return ['configuration'];
    if(action.indexOf('param.')===0) return ['configuration'];
    if(action.indexOf('params.')===0) return ['configuration'];
    if(action.indexOf('background.')===0) return ['configuration'];
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
    BUFFER.push(entry);
    renderLogLine(entry);
  }
  function renderLogLine(entry){
    if(!TERM_BODY) return;
    var line=document.createElement('div');
    line.className='tline lvl-'+entry['log.level'];
    var compact={ action: entry['event.action'], message: entry.message };
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

  /* ---------- Dialog helpers ---------- */
  function wireDialog(dlg){
    if(!dlg) return;
    dlg.querySelectorAll('[data-close]').forEach(function(b){ b.addEventListener('click',function(){ dlg.close(); }); });
    // Click on the ::backdrop targets the dialog element itself. Require the
    // press to START on the backdrop too — otherwise a text-selection drag
    // that begins inside the dialog and releases past its edge dismisses it.
    var downOnBackdrop=false;
    dlg.addEventListener('pointerdown',function(e){ downOnBackdrop=(e.target===dlg); });
    dlg.addEventListener('click',function(e){ if(e.target===dlg&&downOnBackdrop){ downOnBackdrop=false; dlg.close(); } });
  }
  ['dlgExport','dlgImport','dlgJson','dlgSave','dlgHelp'].forEach(function(id){ wireDialog(document.getElementById(id)); });
  function openDialog(dlg){ if(dlg&&!dlg.open){ try{ dlg.showModal(); }catch(e){} } }

  /* ---------- Toast (undoable actions) ---------- */
  var toastEl=document.getElementById('toast'),toastTimer=null,toastUndo=null;
  function showToast(msg,undoFn){
    document.getElementById('toastMsg').textContent=msg;
    document.getElementById('toastAction').hidden=!undoFn;
    toastUndo=undoFn||null;
    toastEl.hidden=false;
    clearTimeout(toastTimer);
    toastTimer=setTimeout(function(){ toastEl.hidden=true; toastUndo=null; },6000);
  }
  document.getElementById('toastAction').addEventListener('click',function(){
    if(toastUndo) toastUndo();
    toastEl.hidden=true; toastUndo=null; clearTimeout(toastTimer);
  });

  /* ---------- Help ---------- */
  document.getElementById('btnHelp').addEventListener('click',function(){
    openDialog(document.getElementById('dlgHelp'));
    eclog('info','ui.help.open',{},'Help opened');
  });

  /* ---------- GitHub star count (best-effort; page works fine without it) ---------- */
  (function(){
    var el=document.getElementById('ghStarCount'); if(!el||!window.fetch) return;
    function fmtStars(n){ return n>=1000?(n/1000).toFixed(1).replace(/\.0$/,'')+'k':String(n); }
    try{
      var c=JSON.parse(sessionStorage.getItem('orb_forge.stars')||'null');
      if(c&&Date.now()-c.t<3600000){ el.textContent=' '+fmtStars(c.n); return; }
    }catch(e){}
    fetch('https://api.github.com/repos/wranngle/orb_forge',{headers:{Accept:'application/vnd.github+json'}})
      .then(function(r){ if(!r.ok) throw new Error('http '+r.status); return r.json(); })
      .then(function(d){
        if(d&&typeof d.stargazers_count==='number'){
          el.textContent=' '+fmtStars(d.stargazers_count);
          try{ sessionStorage.setItem('orb_forge.stars',JSON.stringify({t:Date.now(),n:d.stargazers_count})); }catch(e){}
        }
      })
      .catch(function(){ /* offline / rate-limited — the Star link still works */ });
  })();

  /* ---------- Terminal wiring (collapsed by default) ---------- */
  function initTerm(){
    TERM_BODY=document.getElementById('logConsole');
    var termEl=document.getElementById('term');
    function setCollapsed(collapsed){
      termEl.classList.toggle('is-collapsed',collapsed);
      document.body.classList.toggle('term-open',!collapsed);
    }
    document.getElementById('termHead').addEventListener('click',function(){
      setCollapsed(!termEl.classList.contains('is-collapsed'));
    });
    document.getElementById('termToggle').addEventListener('click',function(e){
      e.stopPropagation();
      setCollapsed(!termEl.classList.contains('is-collapsed'));
    });
    document.getElementById('termCopy').addEventListener('click',function(e){
      e.stopPropagation();
      var txt=bufferToJSONL(); var btn=this;
      function flash(ok){ btn.style.borderColor=ok?'var(--color-healthy)':'var(--text-danger)'; setTimeout(function(){ btn.style.borderColor=''; },1200); }
      function fallback(){
        var ta=document.createElement('textarea');
        ta.value=txt; ta.setAttribute('readonly','');
        ta.style.position='fixed'; ta.style.opacity='0';
        document.body.appendChild(ta); ta.select();
        var ok=false; try{ ok=document.execCommand('copy'); }catch(err){}
        ta.remove(); flash(ok);
      }
      if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(function(){ flash(true); },fallback); }
      else fallback();
    });
    document.getElementById('termDownload').addEventListener('click',function(e){
      e.stopPropagation();
      var blob=new Blob([bufferToJSONL()+'\n'],{type:'application/x-ndjson'});
      var url=URL.createObjectURL(blob);
      var a=document.createElement('a'); a.href=url; a.download='orb-forge.events.jsonl';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function(){ URL.revokeObjectURL(url); },1000);
    });
    document.getElementById('termClear').addEventListener('click',function(e){
      e.stopPropagation();
      BUFFER.length=0; TERM_BODY.innerHTML='';
    });
  }
  initTerm();

  /* ---------- Apply param ---------- */
  function setParam(c,v){
    v=snap(c,v);
    if(v===params[c.key]) return false;
    params[c.key]=v;
    var r=refs[c.key];
    if(r){
      r.input.value=v;
      if(document.activeElement!==r.val) r.val.value=fmt(c,v);
      r.input.style.setProperty('--p',pct(c,v)+'%');
    }
    presetSel.value='';
    syncPresetUI(); updateAuto(); refreshExport();
    return true;
  }

  /* ---------- History (undo / redo) ---------- */
  var HIST=[], FUTURE=[], HIST_MAX=80, hist_lock=false;
  function snapshot(){
    var s={};
    CONFIG.forEach(function(c){ s[c.key]=params[c.key]; });
    s.__preset=presetSel.value||'';
    s.__bgT=BG.transparent; s.__bgTop=BG.top; s.__bgBot=BG.bottom;
    return s;
  }
  function applySnapshot(s){
    hist_lock=true;
    CONFIG.forEach(function(c){ if(s[c.key]!==undefined) params[c.key]=s[c.key]; });
    if(s.__bgT!==undefined){ BG.transparent=!!s.__bgT; }
    if(hexOk(s.__bgTop)) BG.top=s.__bgTop;
    if(hexOk(s.__bgBot)) BG.bottom=s.__bgBot;
    presetSel.value=s.__preset||'';
    // The snapshot may reference a preset deleted since — a valueless select
    // renders blank; fall back to "— custom —".
    if(presetSel.selectedIndex<0) presetSel.value='';
    syncUI(); syncBgUI(); syncPresetUI(); updateAuto(); refreshExport();
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
    if(NO_ENGINE) return; // undo/redo handlers never attached — keep them disabled
    document.getElementById('btnUndo').disabled=(HIST.length<2);
    document.getElementById('btnRedo').disabled=(FUTURE.length===0);
  }

  /* ---------- No-engine fallback ----------
     Everything wired after WebGL init is dead if the context (or shader link)
     fails; disable those controls so nothing looks live but isn't. */
  var NO_ENGINE=false;
  function disableEngineUI(){
    NO_ENGINE=true;
    ['crtRandomBtn','crtResetBtn','btnUndo','btnRedo','btnPlay','crtScrub','btnFull','crtWebpBtn','btnImportJson','btnExportJson'].forEach(function(id){
      var el=document.getElementById(id); if(el) el.disabled=true;
    });
    var tr=document.getElementById('transport'); if(tr) tr.classList.add('is-disabled');
  }

  /* ---------- Param highlight (hover / adjust → shader overlay) ----------
     Each parameter maps to the region of the render it controls. The mask is
     computed inside the same fragment shader from the same uniforms, so the
     highlight tracks the moving feature (pulse, comets) in real time. */
  var HL_MODE={
    radius:1,thickness:1,rotSpeed:1,pulseSpeed:1,pulseAmount:1,wobble:1,
    burn:1,noiseScale:1,flowSpeed:1,hue:1,chroma:1,
    glow:2,
    tracerCount:3,tracerSpeed:3,cometHead:3,tailLength:3,cometBulge:3,tracerGlow:3,sparkle:3,tracerHue:3,
    vignette:4,
    exposure:5,contrast:5,gamma:5,saturation:5,
    timeJitter:7,jitterRate:7
  };
  var HL={mode:0,cur:0,target:0,pulse:0};
  function hlHover(mode,on){
    if(on){ HL.mode=mode; HL.target=0.55; }
    else if(HL.mode===mode||mode===0){ HL.target=0; }
  }
  function hlKick(mode){ HL.mode=mode; HL.pulse=1; }

  /* ---------- Stepper press-and-hold ---------- */
  function bindStep(btn,c,dir){
    var holdTimer=null,repTimer=null,didStep=false;
    function step(){
      var changed=setParam(c,params[c.key]+dir*c.step);
      if(changed){ didStep=true; hlKick(HL_MODE[c.key]||1); }
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
        eclog('info','param.step',{key:c.key,dir:dir,value:params[c.key]},'Step '+(dir>0?'↑':'↓')+' '+c.key+' = '+fmt(c,params[c.key]));
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
        hlKick(HL_MODE[c.key]||1);
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
    head.innerHTML='<span class="title">'+g.name+'</span>';
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
      // typed value input — click and type an exact number
      var val=document.createElement('input'); val.className='val'; val.type='text';
      val.value=fmt(c,c.def); val.setAttribute('inputmode','decimal');
      val.setAttribute('aria-label',c.label+' value'); val.setAttribute('title','Type an exact value · Enter applies · Esc cancels');
      var dec=document.createElement('button'); dec.type='button'; dec.className='step step--dec';
      dec.setAttribute('aria-label','Decrement '+c.label); dec.setAttribute('title','−'+c.step+' · hold to repeat'); dec.textContent='−';
      var inc=document.createElement('button'); inc.type='button'; inc.className='step step--inc';
      inc.setAttribute('aria-label','Increment '+c.label); inc.setAttribute('title','+'+c.step+' · hold to repeat'); inc.textContent='+';
      var stepper=document.createElement('span'); stepper.className='stepper';
      stepper.appendChild(dec); stepper.appendChild(val); stepper.appendChild(inc);
      inp.addEventListener('input',function(){
        var v=parseFloat(inp.value); params[c.key]=v;
        val.value=fmt(c,v);
        inp.style.setProperty('--p',pct(c,v)+'%');
        presetSel.value='';
        hlKick(HL_MODE[c.key]||1);
        syncPresetUI(); updateAuto(); refreshExport();
      });
      // commit history + log on release
      inp.addEventListener('change',function(){
        eclog('info','param.commit',{key:c.key,value:params[c.key]},c.key+' = '+fmt(c,params[c.key]));
        commitHistory();
      });
      function commitTyped(){
        var v=parseFloat(String(val.value).replace(',','.'));
        if(!isFinite(v)){ val.value=fmt(c,params[c.key]); return; }
        if(setParam(c,v)){
          hlKick(HL_MODE[c.key]||1);
          eclog('info','param.type',{key:c.key,value:params[c.key]},c.key+' = '+fmt(c,params[c.key])+' (typed)');
          commitHistory();
        }
        val.value=fmt(c,params[c.key]);
      }
      val.addEventListener('focus',function(){ val.select(); });
      val.addEventListener('blur',commitTyped);
      val.addEventListener('keydown',function(e){
        if(e.key==='Enter'){ e.preventDefault(); val.blur(); }
        else if(e.key==='Escape'){ val.value=fmt(c,params[c.key]); val.blur(); }
      });
      row.appendChild(ico); row.appendChild(lab); row.appendChild(inp); row.appendChild(stepper);
      bindStep(dec,c,-1); bindStep(inc,c,+1);
      var mode=HL_MODE[c.key]||1;
      row.addEventListener('pointerenter',function(){ hlHover(mode,true); });
      row.addEventListener('pointerleave',function(){ hlHover(mode,false); });
      row.addEventListener('focusin',function(){ hlHover(mode,true); });
      row.addEventListener('focusout',function(){ hlHover(mode,false); });
      body.appendChild(row);
      refs[c.key]={input:inp,val:val,cfg:c};
    });
  });

  /* ---------- Background group (transparent toggle + gradient colors) ---------- */
  var bgRefs={};
  (function(){
    var groupEl=document.createElement('div'); groupEl.className='group';
    groupEl.innerHTML='<div class="group-head"><span class="title">Background</span></div>';
    var body=document.createElement('div'); body.className='group-body';
    groupEl.appendChild(body);
    host.appendChild(groupEl);

    function mkRow(iconKey,labelText,tip){
      var row=document.createElement('div'); row.className='row'; row.setAttribute('title',tip);
      var ico=document.createElement('span'); ico.className='ico'; ico.setAttribute('aria-hidden','true');
      ico.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+ICONS[iconKey]+'</svg>';
      var lab=document.createElement('label'); lab.textContent=labelText; lab.setAttribute('title',tip);
      row.appendChild(ico); row.appendChild(lab);
      row.addEventListener('pointerenter',function(){ hlHover(6,true); });
      row.addEventListener('pointerleave',function(){ hlHover(6,false); });
      body.appendChild(row);
      return row;
    }

    // Transparent toggle
    var rowT=mkRow('bgTransparent','Transparent','Export with a true alpha channel — the orb floats on whatever you place it over. Turn off to bake in a solid or gradient backdrop.');
    var ctlT=document.createElement('span'); ctlT.className='check-ctl ctl';
    var chk=document.createElement('input'); chk.type='checkbox'; chk.id='crtTransp'; chk.checked=BG.transparent;
    chk.setAttribute('aria-label','Transparent background');
    ctlT.appendChild(chk);
    rowT.appendChild(ctlT); rowT.appendChild(document.createElement('span'));

    function mkColorRow(iconKey,labelText,key,tip){
      var row=mkRow(iconKey,labelText,tip);
      var ctl=document.createElement('span'); ctl.className='color-ctl ctl';
      var col=document.createElement('input'); col.type='color'; col.value=BG[key];
      col.setAttribute('aria-label',labelText);
      var hex=document.createElement('input'); hex.type='text'; hex.className='hex'; hex.value=BG[key];
      hex.setAttribute('maxlength','7'); hex.setAttribute('spellcheck','false');
      hex.setAttribute('aria-label',labelText+' hex');
      ctl.appendChild(col); ctl.appendChild(hex);
      row.appendChild(ctl); row.appendChild(document.createElement('span'));
      col.addEventListener('input',function(){
        BG[key]=col.value; hex.value=col.value; hlKick(6); refreshExport();
      });
      col.addEventListener('change',function(){
        eclog('info','background.color',{which:key,value:BG[key]},'Background '+key+' = '+BG[key]);
        commitHistory();
      });
      function commitHex(){
        var v=hex.value.trim();
        if(v&&v[0]!=='#') v='#'+v;
        if(hexOk(v)){
          BG[key]=v.toLowerCase(); col.value=BG[key]; hex.value=BG[key]; hlKick(6); refreshExport();
          eclog('info','background.color',{which:key,value:BG[key]},'Background '+key+' = '+BG[key]);
          commitHistory();
        } else hex.value=BG[key];
      }
      hex.addEventListener('blur',commitHex);
      hex.addEventListener('keydown',function(e){
        if(e.key==='Enter'){ e.preventDefault(); hex.blur(); }
        else if(e.key==='Escape'){ hex.value=BG[key]; hex.blur(); }
      });
      return {row:row,col:col,hex:hex};
    }

    var top=mkColorRow('bgTop','Backdrop top','top','Top of the baked-in gradient backdrop (used when Transparent is off). Type a hex value or pick.');
    var bot=mkColorRow('bgBottom','Backdrop bottom','bottom','Bottom of the baked-in gradient backdrop. Set both the same for a solid color.');
    bgRefs={chk:chk,top:top,bot:bot};

    chk.addEventListener('change',function(){
      BG.transparent=chk.checked;
      syncBgUI(); hlKick(6); refreshExport();
      eclog('info','background.transparent',{transparent:BG.transparent},'Transparent background '+(BG.transparent?'on':'off'));
      commitHistory();
    });
  })();
  function syncBgUI(){
    if(!bgRefs.chk) return;
    bgRefs.chk.checked=BG.transparent;
    bgRefs.top.col.value=BG.top; bgRefs.top.hex.value=BG.top;
    bgRefs.bot.col.value=BG.bottom; bgRefs.bot.hex.value=BG.bottom;
    bgRefs.top.row.classList.toggle('is-off',BG.transparent);
    bgRefs.bot.row.classList.toggle('is-off',BG.transparent);
  }
  syncBgUI();

  function syncUI(){
    CONFIG.forEach(function(c){
      var r=refs[c.key]; r.input.value=params[c.key];
      if(document.activeElement!==r.val) r.val.value=fmt(c,params[c.key]);
      r.input.style.setProperty('--p',pct(c,params[c.key])+'%');
    });
  }

  /* ---------- PRESET DROPDOWN ---------- */
  var presetSel=document.getElementById('crtPreset');
  var btnDeletePreset=document.getElementById('btnDeletePreset');
  function buildPresetOptions(){
    presetSel.innerHTML='';
    var o0=document.createElement('option'); o0.value=''; o0.textContent='— custom —';
    presetSel.appendChild(o0);
    var ogB=document.createElement('optgroup'); ogB.label='Built-in';
    Object.keys(BUILTIN_PRESETS).forEach(function(name){
      var o=document.createElement('option'); o.value=name; o.textContent=name; ogB.appendChild(o);
    });
    presetSel.appendChild(ogB);
    var userNames=Object.keys(USER_PRESETS);
    if(userNames.length){
      var ogU=document.createElement('optgroup'); ogU.label='Yours';
      userNames.forEach(function(name){
        var o=document.createElement('option'); o.value=name; o.textContent=name; ogU.appendChild(o);
      });
      presetSel.appendChild(ogU);
    }
  }
  function syncPresetUI(){
    var cur=presetSel.value||'';
    btnDeletePreset.hidden=!(cur&&USER_PRESETS[cur]);
  }
  presetSel.addEventListener('change',function(){
    var p=PRESETS[presetSel.value]; if(!p){ syncPresetUI(); return; }
    CONFIG.forEach(function(c){ if(p[c.key]!==undefined) params[c.key]=p[c.key]; });
    if(p._bg){
      BG.transparent=!!p._bg.transparent;
      if(hexOk(p._bg.top)) BG.top=p._bg.top;
      if(hexOk(p._bg.bottom)) BG.bottom=p._bg.bottom;
    }
    syncUI(); syncBgUI(); refreshExport(); updateAuto(); syncPresetUI();
    if(!hist_lock){
      eclog('info','preset.apply',{name:presetSel.value},'Applied preset "'+presetSel.value+'"');
      commitHistory();
    }
  });
  buildPresetOptions(); syncPresetUI();

  /* ---------- Save preset (dialog) ---------- */
  var dlgSave=document.getElementById('dlgSave');
  var presetNameInp=document.getElementById('presetName');
  var presetSaveStatus=document.getElementById('presetSaveStatus');
  document.getElementById('btnSavePreset').addEventListener('click',function(){
    presetNameInp.value=(presetSel.value&&USER_PRESETS[presetSel.value])?presetSel.value:'';
    presetSaveStatus.textContent=''; presetSaveStatus.className='status';
    openDialog(dlgSave);
    presetNameInp.focus();
  });
  presetNameInp.addEventListener('keydown',function(e){
    if(e.key==='Enter'){ e.preventDefault(); document.getElementById('presetSaveBtn').click(); }
  });
  document.getElementById('presetSaveBtn').addEventListener('click',function(){
    var name=presetNameInp.value.trim();
    if(!name){ presetSaveStatus.textContent='Give it a name first.'; presetSaveStatus.className='status err'; return; }
    if(Object.prototype.hasOwnProperty.call(BUILTIN_PRESETS,name)){
      presetSaveStatus.textContent='"'+name+'" is a built-in preset name — pick another.'; presetSaveStatus.className='status err'; return;
    }
    if(USER_PRESETS[name]&&!confirm('Replace existing preset "'+name+'"?')) return;
    var snapP={};
    CONFIG.forEach(function(c){ snapP[c.key]=c.step>=1?Math.round(params[c.key]):parseFloat(Number(params[c.key]).toFixed(Math.max(decimals(c.step),3))); });
    snapP._bg={transparent:BG.transparent,top:BG.top,bottom:BG.bottom};
    USER_PRESETS[name]=snapP; PRESETS[name]=snapP;
    var persisted=persistUserPresets();
    buildPresetOptions();
    presetSel.value=name;
    syncPresetUI(); refreshExport();
    eclog('info','preset.save',{name:name,persisted:persisted},'Saved preset "'+name+'"');
    if(persisted){ dlgSave.close(); }
    else{
      presetSaveStatus.textContent='Saved for this session, but the browser is blocking storage (private mode or quota) — it will vanish on reload.';
      presetSaveStatus.className='status err';
    }
  });

  /* ---------- Delete preset (undoable — no confirm dialog) ---------- */
  btnDeletePreset.addEventListener('click',function(){
    var name=presetSel.value;
    if(!name||!USER_PRESETS[name]) return;
    var saved=USER_PRESETS[name];
    delete USER_PRESETS[name]; delete PRESETS[name];
    persistUserPresets();
    buildPresetOptions();
    presetSel.value=''; syncPresetUI();
    eclog('info','preset.delete',{name:name},'Deleted preset "'+name+'"');
    showToast('Deleted preset “'+name+'”',function(){
      USER_PRESETS[name]=saved; PRESETS[name]=saved;
      persistUserPresets();
      buildPresetOptions();
      presetSel.value=name; syncPresetUI();
      eclog('info','preset.restore',{name:name},'Restored preset "'+name+'"');
    });
  });

  /* ---------- WEBGL ---------- */
  var canvas=document.getElementById('crtCanvas');
  var glOpts={alpha:true,preserveDrawingBuffer:true,antialias:true,premultipliedAlpha:false};
  var gl=canvas.getContext('webgl',glOpts)||canvas.getContext('experimental-webgl',glOpts);
  if(!gl){
    document.getElementById('crtFallback').style.display='flex';
    disableEngineUI();
    setTimeout(function(){ eclog('error','gl.unavailable',{},'WebGL not available'); },0);
    return;
  }

  var VERT='attribute vec2 a_pos;void main(){gl_Position=vec4(a_pos,0.0,1.0);}';
  var FRAG=[
  'precision highp float;',
  'uniform vec2 u_resolution;uniform float u_time;',
  'uniform float u_radius,u_thickness,u_rotSpeed,u_pulseSpeed,u_pulseAmount,u_wobble;',
  'uniform float u_timeJitter,u_jitterRate;',
  'uniform float u_burn,u_noiseScale,u_flowSpeed,u_glow,u_chroma;',
  'uniform float u_tracerCount,u_tracerSpeed,u_cometHead,u_tailLength,u_cometBulge,u_tracerGlow,u_sparkle;',
  'uniform float u_hue,u_tracerHue,u_saturation,u_exposure,u_contrast,u_gamma,u_vignette,u_alphaMode;',
  'uniform float u_loop,u_phase,u_loopDur;',
  'uniform float u_bgOn;uniform vec3 u_bgA,u_bgB;',
  'uniform float u_hlMode,u_hlStrength,u_hlPulse;',
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
  // Time jitter: warp time with a loop-periodic oscillation so motion surges
  // and reverses inside the cycle. jw is identical at ph=0 and ph=1, so the
  // export stays seamless; phw carries the warp into the phase-locked terms.
  ' float jw=0.0;',
  ' if(u_timeJitter>0.001){',
  '  if(lp>0.5){ float jn=max(1.0,floor(u_jitterRate*Td/TAU+0.5)); jw=u_timeJitter*sin(TAU*jn*ph); }',
  '  else { jw=u_timeJitter*sin(u_jitterRate*t); }',
  '  t+=jw;',
  ' }',
  ' float phw=ph+((lp>0.5)?jw/max(Td,0.001):0.0);',
  ' vec2 pol=vec2(cos(ang),sin(ang))*u_noiseScale+vec2(0.0,dist*u_noiseScale);',
  ' vec2 fv=vec2(0.6*u_flowSpeed,-0.9*u_flowSpeed);',
  ' float bt=pow(fbm(pol+fv*t),1.6);',
  // The crossfade weight stays the UNWARPED ph: it must run 0→1 monotonically
  // across the loop or the seam blend itself would jitter.
  ' if(lp>0.5){ float bt2=pow(fbm(pol+fv*(t-Td)),1.6); bt=mix(bt,bt2,ph); }',
  ' float pulse;',
  ' if(lp>0.5){ float np=floor(u_pulseSpeed*Td/TAU+0.5); pulse=sin(TAU*np*phw); }',
  ' else { pulse=sin(t*u_pulseSpeed); }',
  ' float wob;',
  ' if(lp>0.5){',
  '  float n1=floor(1.3*Td/TAU+0.5),n2=floor(0.9*Td/TAU+0.5),n3=floor(0.5*Td/TAU+0.5);',
  '  wob=sin(ang*3.0+TAU*n1*phw)*0.5+sin(ang*5.0-TAU*n2*phw)*0.3+sin(ang*2.0+TAU*n3*phw)*0.2;',
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
  '  rotAng=TAU*M*phw; headBase=0.0;',
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
  // Param highlight overlay (live preview only — exports force u_hlStrength=0):
  // a translucent in-fill plus a faint rim on the region the hovered/adjusted
  // parameter controls. Computed from the same fields, so it tracks motion.
  ' if(u_hlMode>0.5&&u_hlStrength>0.004){',
  '  float hm=0.0;',
  '  if(u_hlMode<1.5) hm=bMax;',
  '  else if(u_hlMode<2.5) hm=clamp(gG*0.85,0.0,1.0);',
  '  else if(u_hlMode<3.5) hm=clamp(comet*(bMax+gG),0.0,1.0);',
  '  else if(u_hlMode<4.5) hm=smoothstep(0.5,1.05,dist);',
  '  else if(u_hlMode<5.5) hm=0.45;',
  '  else if(u_hlMode<6.5) hm=clamp(1.0-(bMax+gG)-smoothstep(pr,pr-0.3,dist),0.0,1.0);',
  '  else hm=clamp(max(bMax,comet*(bMax+gG)),0.0,1.0);',
  '  float rim=smoothstep(0.03,0.16,hm)*(1.0-smoothstep(0.3,0.6,hm));',
  '  col+=vec3(1.0,0.72,0.35)*(hm*(0.14+0.10*u_hlPulse)+rim*(0.30+0.45*u_hlPulse))*u_hlStrength;',
  ' }',
  ' float oa=clamp(max(col.r,max(col.g,col.b)),0.0,1.0);',
  ' vec3 oc=col/max(oa,0.0025);',
  ' if(u_alphaMode>0.5){ gl_FragColor=vec4(clamp(oc,0.0,1.0),oa); }',
  ' else if(u_bgOn>0.5){',
  '  vec3 bg=mix(u_bgA,u_bgB,clamp(0.5-uv.y,0.0,1.0));',
  '  gl_FragColor=vec4(bg*(1.0-oa)+col,1.0);',
  ' }',
  ' else gl_FragColor=vec4(col,1.0);}'
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
  if(!gl.getProgramParameter(prog,gl.LINK_STATUS)){ document.getElementById('crtFallback').style.display='flex'; disableEngineUI(); return; }
  gl.useProgram(prog);

  var buf=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  var loc=gl.getAttribLocation(prog,'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);

  var U={res:gl.getUniformLocation(prog,'u_resolution'),time:gl.getUniformLocation(prog,'u_time'),
         alphaMode:gl.getUniformLocation(prog,'u_alphaMode'),loop:gl.getUniformLocation(prog,'u_loop'),
         phase:gl.getUniformLocation(prog,'u_phase'),loopDur:gl.getUniformLocation(prog,'u_loopDur'),
         bgOn:gl.getUniformLocation(prog,'u_bgOn'),bgA:gl.getUniformLocation(prog,'u_bgA'),bgB:gl.getUniformLocation(prog,'u_bgB'),
         hlMode:gl.getUniformLocation(prog,'u_hlMode'),hlStrength:gl.getUniformLocation(prog,'u_hlStrength'),hlPulse:gl.getUniformLocation(prog,'u_hlPulse')};
  CONFIG.forEach(function(c){ U[c.key]=gl.getUniformLocation(prog,'u_'+c.key); });

  function setBgUniforms(on){
    gl.uniform1f(U.bgOn,on?1.0:0.0);
    var a=hexToRgbF(BG.top),b=hexToRgbF(BG.bottom);
    gl.uniform3f(U.bgA,a[0],a[1],a[2]);
    gl.uniform3f(U.bgB,b[0],b[1],b[2]);
  }

  var exporting=false,estimating=false,renderQueued=false;
  function resize(){
    if(exporting||estimating) return;
    var dpr=Math.min(window.devicePixelRatio||1,2);
    var w=Math.max(2,Math.round(canvas.clientWidth*dpr));
    var h=Math.max(2,Math.round(canvas.clientHeight*dpr));
    if(canvas.width!==w||canvas.height!==h){ canvas.width=w; canvas.height=h; }
    gl.viewport(0,0,canvas.width,canvas.height);
  }
  if(window.ResizeObserver){ new ResizeObserver(resize).observe(canvas); }
  window.addEventListener('resize',resize);

  /* ---------- Transport (play / scrub / fullscreen) ---------- */
  var playing=true,elapsed=0,last=performance.now();
  var btnPlay=document.getElementById('btnPlay');
  var scrub=document.getElementById('crtScrub');
  var timeEl=document.getElementById('crtTime');
  var transportEl=document.getElementById('transport');
  var SVG_PAUSE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
  var SVG_PLAY='<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="7 4 20 12 7 20 7 4"/></svg>';
  function setPlayingQuiet(p){
    playing=p;
    btnPlay.dataset.playing=p?'true':'false';
    btnPlay.innerHTML=p?SVG_PAUSE:SVG_PLAY;
    btnPlay.title=p?'Pause (Space)':'Play (Space)';
    btnPlay.setAttribute('aria-label',p?'Pause':'Play');
  }
  function togglePlay(){
    setPlayingQuiet(!playing);
    eclog('info','playback.'+(playing?'resume':'pause'),{playing:playing},playing?'Playback resumed':'Playback paused');
  }
  btnPlay.addEventListener('click',togglePlay);
  (function(){
    var stage=document.querySelector('.stage');
    if(!stage) return;
    stage.setAttribute('title','Click to pause or resume');
    stage.addEventListener('click',function(){ if(!exporting) togglePlay(); });
  })();

  var scrubActive=false,scrubWasPlaying=true;
  scrub.addEventListener('pointerdown',function(){
    scrubActive=true; scrubWasPlaying=playing;
    if(playing) setPlayingQuiet(false);
  });
  scrub.addEventListener('input',function(){
    if(!scrubActive&&playing) setPlayingQuiet(false); // keyboard scrubbing
    var T=currentDur();
    elapsed=parseFloat(scrub.value)*T;
  });
  function endScrub(){
    if(!scrubActive) return;
    scrubActive=false;
    eclog('info','playback.scrub',{t:+(elapsed%currentDur()).toFixed(3)},'Scrubbed to '+(elapsed%currentDur()).toFixed(2)+' s');
    if(scrubWasPlaying) setPlayingQuiet(true);
  }
  scrub.addEventListener('pointerup',endScrub);
  scrub.addEventListener('pointercancel',endScrub);

  var stageFrame=document.getElementById('stageFrame');
  function toggleFullscreen(){
    if(document.fullscreenElement){ document.exitFullscreen(); }
    else if(stageFrame.requestFullscreen){ stageFrame.requestFullscreen(); }
    eclog('info','ui.fullscreen',{on:!document.fullscreenElement},'Fullscreen toggled');
  }
  document.getElementById('btnFull').addEventListener('click',toggleFullscreen);

  function frame(now){
    var dt=Math.min((now-last)/1000,0.05);
    if(playing&&!exporting&&!estimating){ elapsed+=dt; }
    last=now;
    // highlight envelope: ease toward hover target, decay the adjust pulse
    HL.cur+=(HL.target-HL.cur)*Math.min(1,dt*10);
    HL.pulse*=Math.exp(-dt*5);
    if(!exporting&&!estimating){
      resize();
      gl.uniform2f(U.res,canvas.width,canvas.height);
      gl.uniform1f(U.time,elapsed);
      gl.uniform1f(U.alphaMode,0.0);
      gl.uniform1f(U.loop,0.0); gl.uniform1f(U.phase,0.0); gl.uniform1f(U.loopDur,1.0);
      setBgUniforms(!BG.transparent);
      gl.uniform1f(U.hlMode,HL.mode);
      gl.uniform1f(U.hlStrength,Math.min(1,HL.cur+HL.pulse*0.7));
      gl.uniform1f(U.hlPulse,HL.pulse);
      CONFIG.forEach(function(c){ gl.uniform1f(U[c.key],params[c.key]); });
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      var T=currentDur();
      if(playing&&!scrubActive) scrub.value=String(((elapsed%T)/T).toFixed(3));
      if(timeEl) timeEl.textContent=(elapsed%T).toFixed(2)+' / '+T.toFixed(2)+' s';
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- JSON export / import (separate dialogs) ---------- */
  var dlgImport=document.getElementById('dlgImport'),dlgJson=document.getElementById('dlgJson');
  var jsonArea=document.getElementById('crtJson'),jsonOut=document.getElementById('crtJsonOut'),statusEl=document.getElementById('crtStatus');
  function setStatus(msg,kind){ statusEl.textContent=msg; statusEl.className='status'+(kind?' '+kind:''); }
  function buildJSON(){
    var p={};
    CONFIG.forEach(function(c){ p[c.key]=c.step>=1?Math.round(params[c.key]):parseFloat(Number(params[c.key]).toFixed(Math.max(decimals(c.step),3))); });
    return JSON.stringify({
      effect:'chromatic_burning_comet_ring',
      version:12,
      exportedAt:new Date().toISOString(),
      preset:presetSel.value||null,
      background:{transparent:BG.transparent,top:BG.top,bottom:BG.bottom},
      parameters:p
    },null,2);
  }
  function refreshExport(){
    if(dlgJson&&dlgJson.open) jsonOut.value=buildJSON();
    scheduleEstimate();
  }
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
    var bgIn=data&&data.background;
    if(bgIn&&typeof bgIn==='object'){
      if(typeof bgIn.transparent==='boolean') BG.transparent=bgIn.transparent;
      if(hexOk(bgIn.top)) BG.top=bgIn.top.toLowerCase();
      if(hexOk(bgIn.bottom)) BG.bottom=bgIn.bottom.toLowerCase();
    }
    syncUI(); syncBgUI(); updateAuto();
    presetSel.value=(data&&data.preset&&PRESETS[data.preset])?data.preset:'';
    syncPresetUI();
    setStatus('Applied '+applied+' of '+CONFIG.length+' parameters'+(clamped?' ('+clamped+' clamped to range)':'')+'.','ok');
    eclog('info','config.import',{applied:applied,clamped:clamped,preset:presetSel.value||null},'Imported '+applied+' parameters');
    commitHistory();
    refreshExport();
  }
  document.getElementById('btnImportJson').addEventListener('click',function(){
    setStatus('','');
    openDialog(dlgImport);
    jsonArea.focus();
    eclog('info','ui.dialog.open',{dialog:'import'},'Import dialog opened');
  });
  document.getElementById('btnExportJson').addEventListener('click',function(){
    jsonOut.value=buildJSON();
    openDialog(dlgJson);
    eclog('info','ui.dialog.open',{dialog:'export_json'},'Export JSON dialog opened');
  });
  document.getElementById('crtApplyBtn').addEventListener('click',importJSON);
  document.getElementById('crtCopyBtn').addEventListener('click',function(){
    var btn=this;
    function done(){
      var orig=btn.innerHTML;
      btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Copied';
      setTimeout(function(){ btn.innerHTML=orig; },1400);
      eclog('info','config.copy',{},'Copied parameter JSON to clipboard');
    }
    function fallback(){ jsonOut.select(); try{ if(document.execCommand('copy'))done(); }catch(e){} }
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(jsonOut.value).then(done,fallback);
    } else fallback();
  });
  document.getElementById('crtDownloadBtn').addEventListener('click',function(){
    var blob=new Blob([jsonOut.value||buildJSON()],{type:'application/json'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a'); a.href=url; a.download='orb-forge.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); },1000);
    eclog('info','config.download',{filename:'orb-forge.json'},'Downloaded orb-forge.json');
  });

  /* ---------- Reset & randomize ---------- */
  document.getElementById('crtResetBtn').addEventListener('click',function(){
    CONFIG.forEach(function(c){ params[c.key]=c.def; });
    BG.transparent=BG_DEF.transparent; BG.top=BG_DEF.top; BG.bottom=BG_DEF.bottom;
    syncUI(); syncBgUI(); presetSel.value=''; refreshExport(); updateAuto(); syncPresetUI();
    HL.mode=5; HL.pulse=1;
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
    // Backdrop colors ride along only when they're visible; the Transparent
    // toggle itself is never randomized.
    if(!BG.transparent){
      var h=Math.random()*360;
      BG.top=hslToHex(h,40+Math.random()*20,7+Math.random()*7);
      BG.bottom=hslToHex((h+30+Math.random()*90)%360,45+Math.random()*20,12+Math.random()*8);
    }
    syncUI(); syncBgUI(); presetSel.value=''; refreshExport(); updateAuto(); syncPresetUI();
    HL.mode=5; HL.pulse=1;
    eclog('info','params.randomize',{},'Randomized within sensible ranges');
    commitHistory();
  });

  /* ---------- Keyboard shortcuts ---------- */
  document.addEventListener('keydown',function(e){
    var t=e.target,tag=(t&&t.tagName)||'',typ=(t&&t.type)||'';
    // Block shortcuts only where keys mean typing; sliders and checkboxes are
    // exactly where focus rests after adjusting, so undo/redo must work there.
    var textEntry=tag==='TEXTAREA'||(tag==='INPUT'&&!/^(range|checkbox)$/.test(typ));
    if(textEntry) return;
    if(document.querySelector('dialog[open]')) return;
    var mod=e.ctrlKey||e.metaKey;
    if(mod&&!e.shiftKey&&(e.key==='z'||e.key==='Z')){ e.preventDefault(); undo(); }
    else if(mod&&(e.shiftKey&&(e.key==='z'||e.key==='Z')||e.key==='y'||e.key==='Y')){ e.preventDefault(); redo(); }
    // 'f' types into a focused <select> (jump-to-option) — leave that alone.
    else if((e.key==='f'||e.key==='F')&&!mod&&tag!=='SELECT'){ e.preventDefault(); toggleFullscreen(); }
    // Space must not steal native activation from buttons/links/selects/checkboxes.
    else if((e.key===' '||e.code==='Space')&&!/^(BUTTON|A|SELECT)$/.test(tag)&&typ!=='checkbox'){ e.preventDefault(); togglePlay(); }
  });

  /* ---------- Export (WebP / GIF) ---------- */
  var dlgExport=document.getElementById('dlgExport'),webpStatus=document.getElementById('crtWebpStatus');
  var progWrap=document.getElementById('crtProg'),progFill=document.getElementById('crtProgFill'),progText=document.getElementById('crtProgText');
  var resSel=document.getElementById('crtRes'),fpsSel=document.getElementById('crtFps'),qualSel=document.getElementById('crtQual'),targetSel=document.getElementById('crtTarget'),formatSel=document.getElementById('crtFormat');
  var durInp=document.getElementById('crtDur'),durVal=document.getElementById('crtDurVal'),frameInfo=document.getElementById('crtFrameInfo');
  var renderBtn=document.getElementById('crtRenderBtn'),autoChk=document.getElementById('crtAuto');
  var resultWrap=document.getElementById('crtResult'),resultImg=document.getElementById('crtResultImg'),resultMeta=document.getElementById('crtResultMeta');
  var autoT=3.0;
  var manualDl=document.getElementById('crtManualDl'),lastBlobUrl=null;
  function setWebpStatus(msg,kind){ webpStatus.textContent=msg; webpStatus.className='status'+(kind?' '+kind:''); }
  function setOv(t,frac){
    progWrap.classList.add('on');
    progText.textContent=t;
    progFill.style.width=Math.round(clamp(frac,0,1)*100)+'%';
  }
  function hideProg(){ progWrap.classList.remove('on'); }
  function showResult(url,blob,ext,meta){
    if(lastBlobUrl&&lastBlobUrl!==url) URL.revokeObjectURL(lastBlobUrl);
    lastBlobUrl=url;
    resultImg.src=url;
    resultMeta.innerHTML=meta;
    manualDl.href=url; manualDl.hidden=false;
    manualDl.setAttribute('download','orb-forge.'+ext);
    manualDl.title='Save orb-forge.'+ext+' ('+fmtSize(blob.size)+')';
    resultWrap.classList.add('on');
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
    frameInfo.textContent=Math.max(2,Math.round(fps*dur))+' frames · '+dur.toFixed(2)+' s';
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
  function syncFormatUI(){
    var gif=formatSel.value==='gif';
    qualSel.disabled=gif;
    targetSel.disabled=gif;
    if(gif){
      // Park the target while GIF is selected and restore it on the way back —
      // a format round-trip must not silently discard the user's size cap.
      if(targetSel.value!=='0') targetSel.dataset.prevTarget=targetSel.value;
      targetSel.value='0';
    } else if(targetSel.dataset.prevTarget){
      targetSel.value=targetSel.dataset.prevTarget;
      delete targetSel.dataset.prevTarget;
    }
    qualSel.title=gif?'GIF uses a fixed 255-color palette — size is driven by resolution and frame rate instead.':'WebP encoder quality. Max is near-lossless; High is usually indistinguishable at roughly half the size.';
    targetSel.title=gif?'Target-size auto-tuning is WebP-only.':'Hard cap on file size. The exporter measures real frame cost, then picks the sharpest resolution that fits, flexing quality and frame rate first (never below 24 fps unless nothing fits).';
  }
  autoChk.addEventListener('change',function(){ updateAuto(); scheduleEstimate(); });
  fpsSel.addEventListener('change',function(){ updFrameInfo(); scheduleEstimate(); });
  targetSel.addEventListener('change',function(){ updFrameInfo(); scheduleEstimate(); });
  resSel.addEventListener('change',scheduleEstimate);
  qualSel.addEventListener('change',scheduleEstimate);
  formatSel.addEventListener('change',function(){ syncFormatUI(); scheduleEstimate(); });
  durInp.addEventListener('input',function(){ updateAuto(); });
  durInp.addEventListener('change',scheduleEstimate);
  updateAuto(); syncFormatUI();

  document.getElementById('crtWebpBtn').addEventListener('click',function(){
    updateAuto();
    openDialog(dlgExport);
    scheduleEstimate();
    eclog('info','ui.dialog.open',{dialog:'export'},'Export dialog opened');
  });

  /* ---------- Auto size estimate (no button — debounced on change) ---------- */
  var estTimer=null;
  function scheduleEstimate(){
    if(!dlgExport||!dlgExport.open) return;
    clearTimeout(estTimer);
    estTimer=setTimeout(function(){
      if(dlgExport.open&&!exporting&&!estimating) runExport(true);
    },450);
  }

  /* ---------- WebP muxing ---------- */
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

  /* ---------- GIF89a encoder (median-cut palette + FS dither + LZW) ---------- */
  function gifPalette(frames,hasAlpha,maxColors){
    var samples=[],total=0,f;
    for(f=0;f<frames.length;f++) total+=frames[f].length/4;
    var stride=Math.max(1,Math.floor(total/9000));
    for(f=0;f<frames.length;f++){
      var d=frames[f];
      for(var i=0;i<d.length;i+=4*stride){
        if(hasAlpha&&d[i+3]<90) continue;
        samples.push([d[i],d[i+1],d[i+2]]);
      }
    }
    if(!samples.length) samples.push([0,0,0]);
    var boxes=[samples];
    while(boxes.length<maxColors){
      var bi=-1,bscore=-1,bch=0;
      for(var b=0;b<boxes.length;b++){
        var bx=boxes[b]; if(bx.length<2) continue;
        var mn=[255,255,255],mx=[0,0,0];
        for(var j=0;j<bx.length;j++){
          var sm=bx[j];
          if(sm[0]<mn[0])mn[0]=sm[0]; if(sm[0]>mx[0])mx[0]=sm[0];
          if(sm[1]<mn[1])mn[1]=sm[1]; if(sm[1]>mx[1])mx[1]=sm[1];
          if(sm[2]<mn[2])mn[2]=sm[2]; if(sm[2]>mx[2])mx[2]=sm[2];
        }
        var ch=0,range=mx[0]-mn[0];
        if(mx[1]-mn[1]>range){range=mx[1]-mn[1];ch=1;}
        if(mx[2]-mn[2]>range){range=mx[2]-mn[2];ch=2;}
        var score=range*Math.sqrt(bx.length);
        if(score>bscore){bscore=score;bi=b;bch=ch;}
      }
      if(bi<0||bscore<=0) break;
      var box=boxes[bi];
      box.sort(function(a,b2){ return a[bch]-b2[bch]; });
      var mid=box.length>>1;
      boxes.splice(bi,1,box.slice(0,mid),box.slice(mid));
    }
    return boxes.map(function(bx){
      var r=0,g=0,bl=0,n=bx.length||1;
      for(var j=0;j<bx.length;j++){ r+=bx[j][0]; g+=bx[j][1]; bl+=bx[j][2]; }
      return [Math.round(r/n),Math.round(g/n),Math.round(bl/n)];
    });
  }
  function gifIndexFrame(rgba,size,palette,hasAlpha){
    var n=size*size,idx=new Uint8Array(n);
    var offset=hasAlpha?1:0; // index 0 reserved for transparency
    var cache=new Map();
    function nearest(r,g,b){
      var key=((r>>2)<<12)|((g>>2)<<6)|(b>>2);
      var v=cache.get(key);
      if(v===undefined){
        var bd=1e9,bi=0;
        for(var p=0;p<palette.length;p++){
          var dr=palette[p][0]-r,dg=palette[p][1]-g,db=palette[p][2]-b;
          var d=dr*dr+dg*dg+db*db;
          if(d<bd){bd=d;bi=p;}
        }
        v=bi; cache.set(key,v);
      }
      return v;
    }
    // Floyd–Steinberg on a float copy: the orb is mostly smooth glow gradients,
    // which band badly on a 255-color palette without error diffusion.
    var fr=new Float32Array(n*3);
    for(var i=0,j=0;i<n;i++,j+=3){ fr[j]=rgba[i*4]; fr[j+1]=rgba[i*4+1]; fr[j+2]=rgba[i*4+2]; }
    function diffuse(j2,er,eg,eb,w){ fr[j2]+=er*w; fr[j2+1]+=eg*w; fr[j2+2]+=eb*w; }
    for(var y=0;y<size;y++){
      for(var x=0;x<size;x++){
        var pi=y*size+x;
        if(hasAlpha&&rgba[pi*4+3]<90){ idx[pi]=0; continue; }
        var j3=pi*3;
        var r=Math.max(0,Math.min(255,Math.round(fr[j3])));
        var g=Math.max(0,Math.min(255,Math.round(fr[j3+1])));
        var b=Math.max(0,Math.min(255,Math.round(fr[j3+2])));
        var ni=nearest(r,g,b);
        idx[pi]=ni+offset;
        var pe=palette[ni];
        var er=r-pe[0],eg=g-pe[1],eb=b-pe[2];
        if(x+1<size) diffuse(j3+3,er,eg,eb,7/16);
        if(y+1<size){
          if(x>0) diffuse(j3+(size-1)*3,er,eg,eb,3/16);
          diffuse(j3+size*3,er,eg,eb,5/16);
          if(x+1<size) diffuse(j3+(size+1)*3,er,eg,eb,1/16);
        }
      }
    }
    return idx;
  }
  function gifLZW(indices,minCodeSize,parts){
    var CLEAR=1<<minCodeSize,EOI=CLEAR+1;
    var codeSize=minCodeSize+1,next=EOI+1;
    var dict=new Map();
    var bytes=[],acc=0,nbits=0;
    function emit(code){
      acc|=code<<nbits; nbits+=codeSize;
      while(nbits>=8){ bytes.push(acc&255); acc>>>=8; nbits-=8; }
    }
    emit(CLEAR);
    var prev=indices[0];
    for(var i=1;i<indices.length;i++){
      var k=indices[i],key=(prev<<8)|k,got=dict.get(key);
      if(got!==undefined){ prev=got; continue; }
      emit(prev);
      if(next===4096){ emit(CLEAR); dict.clear(); next=EOI+1; codeSize=minCodeSize+1; }
      else{
        if(next>=(1<<codeSize)&&codeSize<12) codeSize++;
        dict.set(key,next++);
      }
      prev=k;
    }
    emit(prev); emit(EOI);
    if(nbits>0) bytes.push(acc&255);
    parts.push(Uint8Array.of(minCodeSize));
    for(var p=0;p<bytes.length;p+=255){
      var len=Math.min(255,bytes.length-p);
      var blk=new Uint8Array(len+1); blk[0]=len;
      for(var q=0;q<len;q++) blk[q+1]=bytes[p+q];
      parts.push(blk);
    }
    parts.push(Uint8Array.of(0));
  }
  // delays: centiseconds — one number for every frame, or an array per frame.
  function encodeGIF(frames,size,delays,hasAlpha,onProgress,done,onError){
    var palette,parts=[];
    try{
      palette=gifPalette(frames,hasAlpha,hasAlpha?255:256);
      var offset=hasAlpha?1:0;
      var hdr=new Uint8Array(13);
      hdr[0]=71;hdr[1]=73;hdr[2]=70;hdr[3]=56;hdr[4]=57;hdr[5]=97; // GIF89a
      hdr[6]=size&255;hdr[7]=(size>>8)&255;hdr[8]=size&255;hdr[9]=(size>>8)&255;
      hdr[10]=0xF7;hdr[11]=0;hdr[12]=0; // 256-entry global color table
      parts.push(hdr);
      var gct=new Uint8Array(256*3);
      for(var p=0;p<palette.length;p++){
        var o=(p+offset)*3;
        gct[o]=palette[p][0]; gct[o+1]=palette[p][1]; gct[o+2]=palette[p][2];
      }
      parts.push(gct);
      parts.push(Uint8Array.of(0x21,0xFF,0x0B,78,69,84,83,67,65,80,69,50,46,48,3,1,0,0,0)); // NETSCAPE2.0 infinite loop
    }catch(e){ if(onError) onError(e); return; }
    var fi=0;
    function step(){
      // Exceptions in a setTimeout chain escape every caller — route them to
      // onError so the exporting flag can never wedge the UI.
      try{
        if(fi>=frames.length){
          parts.push(Uint8Array.of(0x3B));
          done(concat(parts));
          return;
        }
        var idx=gifIndexFrame(frames[fi],size,palette,hasAlpha);
        var delayCs=Array.isArray(delays)?delays[fi]:delays;
        parts.push(Uint8Array.of(0x21,0xF9,4,hasAlpha?((2<<2)|1):(1<<2),delayCs&255,(delayCs>>8)&255,0,0));
        parts.push(Uint8Array.of(0x2C,0,0,0,0,size&255,(size>>8)&255,size&255,(size>>8)&255,0));
        gifLZW(idx,8,parts);
        fi++;
        if(onProgress) onProgress(fi,frames.length);
        setTimeout(step,0);
      }catch(e){ if(onError) onError(e); }
    }
    step();
  }

  function finishExport(msg,kind,data){
    exporting=false; renderBtn.disabled=false; hideProg();
    transportEl.classList.remove('is-disabled');
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

  // Estimates and renders share the GL canvas but not a fate: a render click
  // that lands during an in-flight estimate queues instead of being dropped.
  function endEstimate(){
    estimating=false; resize();
    if(renderQueued){ renderQueued=false; if(dlgExport.open) runExport(false); }
  }
  function runExport(estimateOnly){
    if(exporting) return;
    if(estimateOnly&&estimating) return;
    if(!estimateOnly&&estimating){ renderQueued=true; return; }
    var format=formatSel.value;
    var size0=parseInt(resSel.value,10),fps0=parseInt(fpsSel.value,10),manualQ=parseFloat(qualSel.value);
    var T=currentDur(),transparent=BG.transparent,target=(format==='gif')?0:parseFloat(targetSel.value);
    if(estimateOnly){ estimating=true; }
    else{
      exporting=true;
      renderBtn.disabled=true;
      transportEl.classList.add('is-disabled');
      resultWrap.classList.remove('on');
      manualDl.hidden=true;
      eclog('info','export.start',{format:format,size:size0,fps:fps0,quality:manualQ,duration:T,target:target||null,transparent:transparent},'Exporting — '+format.toUpperCase()+', '+size0+' px, '+fps0+' fps, '+T.toFixed(2)+' s');
    }

    function setupGL(size){
      canvas.width=size; canvas.height=size;
      gl.viewport(0,0,size,size);
      gl.uniform2f(U.res,size,size);
      gl.uniform1f(U.alphaMode,transparent?1.0:0.0);
      setBgUniforms(!transparent);
      gl.uniform1f(U.hlMode,0.0); gl.uniform1f(U.hlStrength,0.0); gl.uniform1f(U.hlPulse,0.0);
      gl.uniform1f(U.loop,1.0); gl.uniform1f(U.loopDur,T);
      CONFIG.forEach(function(c){ gl.uniform1f(U[c.key],params[c.key]); });
    }
    function makeCtx(size){ var cv=document.createElement('canvas'); cv.width=cv.height=size; return {cv:cv,ctx:cv.getContext('2d')}; }
    function capturePixels(size,phase,pix){
      gl.uniform1f(U.phase,phase); gl.uniform1f(U.time,phase*T);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      gl.readPixels(0,0,size,size,gl.RGBA,gl.UNSIGNED_BYTE,pix);
      var out=new Uint8Array(size*size*4);
      for(var y=0;y<size;y++){ out.set(pix.subarray((size-1-y)*size*4,(size-y)*size*4),y*size*4); }
      return out;
    }
    function drawToCtx(size,flipped,ctx){
      var img=ctx.createImageData(size,size);
      img.data.set(flipped);
      ctx.putImageData(img,0,0);
    }
    // GIF wants premultiplied color (light over black) — alphaMode 1 gives
    // straight alpha, so multiply back before palette mapping.
    function premultiply(flipped){
      for(var i=0;i<flipped.length;i+=4){
        var a=flipped[i+3];
        if(a<255){ flipped[i]=(flipped[i]*a)/255|0; flipped[i+1]=(flipped[i+1]*a)/255|0; flipped[i+2]=(flipped[i+2]*a)/255|0; }
      }
      return flipped;
    }
    function deliver(bytes,mime,ext,size,fps,nF,note){
      var blob=new Blob([bytes],{type:mime});
      var url=URL.createObjectURL(blob);
      var a=document.createElement('a'); a.href=url; a.download='orb-forge.'+ext;
      document.body.appendChild(a); a.click(); a.remove();
      showResult(url,blob,ext,
        '<b>orb-forge.'+ext+'</b> · '+fmtSize(blob.size)+'<br>'+
        size+' px · '+fps+' fps · '+nF+' frames · '+T.toFixed(2)+' s'+(transparent?' · transparent':''));
      finishExport('Exported '+fmtSize(blob.size)+' — '+size+' px, '+fps+' fps, '+nF+' frames, '+T.toFixed(2)+' s'+(transparent?', transparent':'')+note,'ok',
        {format:ext,bytes:blob.size,size:size,fps:fps,frames:nF,duration:T,transparent:transparent});
    }

    function fullRenderWebP(size,fps,q,note){
      var nF=Math.max(2,Math.round(fps*T)),delay=Math.max(1,Math.round(1000*T/nF));
      var o=makeCtx(size),pix=new Uint8Array(size*size*4),frames=[];
      setupGL(size);
      setWebpStatus('Rendering '+nF+' frames…','');
      function cap(i){
        if(i>=nF){
          setOv('Assembling WebP…',0.98);
          setTimeout(function(){
            try{
              var bytes=muxAnimatedWebP(frames,size,delay);
              deliver(bytes,'image/webp','webp',size,fps,nF,note);
            }catch(e){ finishExport('Assembly failed: '+(e&&e.message||e),'err',{reason:e&&e.message||String(e)}); }
          },20);
          return;
        }
        drawToCtx(size,capturePixels(size,i/nF,pix),o.ctx);
        o.cv.toBlob(function(blob){
          if(!blob){ finishExport('Frame export returned nothing.','err',{}); return; }
          if(blob.type!=='image/webp'){ finishExport('This browser cannot encode WebP — switch Format to GIF, or use Chrome, Edge, or a recent Firefox.','err',{reason:'no_webp'}); return; }
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

    function fullRenderGIF(size,fps){
      // GIF's minimum frame delay is 2 cs, so >50 fps is unrepresentable —
      // cap the frame count instead of silently stretching the loop.
      var fpsEff=Math.min(fps,50);
      var nF=Math.max(2,Math.round(fpsEff*T));
      // Accumulated-timestamp rounding: each delay is the difference of two
      // rounded running totals, so the loop duration stays true to T instead
      // of drifting with a single uniformly-rounded delay.
      var delays=[];
      for(var di=0;di<nF;di++) delays.push(Math.max(2,Math.round(100*T*(di+1)/nF)-Math.round(100*T*di/nF)));
      // Raw RGBA frames are held in memory until encoding; cap the worst case
      // (512 px @ 50 fps @ 9 s ≈ 450 MB) before it can take down the tab.
      var rawBytes=size*size*4*nF;
      if(rawBytes>420*1048576){
        finishExport('That GIF needs ~'+Math.round(rawBytes/1048576)+' MB of frame memory — lower the resolution, frame rate, or duration (or use WebP).','err',{reason:'gif_memory',bytes:rawBytes});
        return;
      }
      var pix=new Uint8Array(size*size*4),frames=[];
      setupGL(size);
      setWebpStatus('Rendering '+nF+' frames…','');
      function cap(i){
        if(i>=nF){
          setOv('Encoding GIF…',0.6);
          encodeGIF(frames,size,delays,transparent,
            function(n,of){ setOv('Encoding GIF '+n+' / '+of,0.55+n/of*0.43); },
            function(bytes){ deliver(bytes,'image/gif','gif',size,fpsEff,nF,fpsEff!==fps?' · GIF caps at '+fpsEff+' fps':''); },
            function(e){ finishExport('GIF encoding failed: '+(e&&e.message||e),'err',{reason:e&&e.message||String(e)}); });
          return;
        }
        var flipped=capturePixels(size,i/nF,pix);
        frames.push(transparent?premultiply(flipped):flipped);
        if(i%10===0||i===nF-1) eclog('info','export.frame',{n:i+1,of:nF},'Captured frame '+(i+1)+'/'+nF);
        setOv('Rendering frame '+(i+1)+' / '+nF,(i+1)/nF*0.5);
        setTimeout(function(){ cap(i+1); },0);
      }
      cap(0);
    }

    /* ----- estimate (single probe frame, silent) ----- */
    if(estimateOnly){
      var fpsE=(format==='gif')?Math.min(fps0,50):fps0;
      var nFe=Math.max(2,Math.round(fpsE*T));
      var oE=makeCtx(size0),pixE=new Uint8Array(size0*size0*4);
      setupGL(size0);
      var flippedE=capturePixels(size0,0.3,pixE);
      if(format==='gif'){
        encodeGIF([transparent?premultiply(flippedE):flippedE],size0,4,transparent,null,function(bytes){
          var overhead=13+768+19+1;
          var est=Math.max(0,bytes.length-overhead)*nFe+overhead;
          endEstimate();
          setWebpStatus('≈ '+fmtSize(est)+' estimated · GIF · '+size0+' px · '+fpsE+' fps · '+nFe+' frames','');
        },function(){ endEstimate(); });
        return;
      }
      drawToCtx(size0,flippedE,oE.ctx);
      encodeBlob(oE.cv,manualQ).then(function(b){
        var est=b.size*nFe*1.04+400;
        endEstimate();
        setWebpStatus('≈ '+fmtSize(est)+' estimated · '+size0+' px · '+fps0+' fps · '+nFe+' frames'+(target>0?' · auto-fits '+fmtSize(target):''),'');
      }).catch(function(){
        endEstimate();
        setWebpStatus('This browser cannot encode WebP — switch Format to GIF.','err');
      });
      return;
    }

    /* ----- full render ----- */
    if(format==='gif'){
      setOv('Rendering…',0.05);
      fullRenderGIF(size0,fps0);
      return;
    }
    if(!target){
      setOv('Rendering…',0.05);
      fullRenderWebP(size0,fps0,manualQ,'');
      return;
    }

    var qLadder=[0.18,0.3,0.45,0.6,0.78,1.0];
    var resCand=[192,256,360,480,512].filter(function(r){ return r<=size0; });
    var fpsCand=[12,15,24,30,60].filter(function(f){ return f<=fps0; });
    var perFrame={};
    function calibrate(ri){
      if(ri>=resCand.length){ choose(); return; }
      var rs=resCand[ri];
      setupGL(rs);
      var o=makeCtx(rs),pix=new Uint8Array(rs*rs*4);
      drawToCtx(rs,capturePixels(rs,0.3,pix),o.ctx);
      perFrame[rs]={};
      function eq(qi){
        if(qi>=qLadder.length){
          eclog('info','export.calibrate',{resolution:rs,samples:Object.keys(perFrame[rs]).length},'Calibrated '+rs+' px');
          setOv('Calibrating sizes… '+rs+' px',0.05+0.35*(ri+1)/resCand.length);
          setTimeout(function(){ calibrate(ri+1); },0);
          return;
        }
        encodeBlob(o.cv,qLadder[qi]).then(function(b){
          perFrame[rs][qLadder[qi]]=b.size; eq(qi+1);
        }).catch(function(){ finishExport('This browser cannot encode WebP — switch Format to GIF.','err',{reason:'no_webp'}); });
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
        note=' · auto-tuned to fit '+fmtSize(target);
        eclog('info','export.autotune',{resolution:pick.rs,fps:pick.fp,quality:pick.q,target:target,estimated:pick.est},'Auto-tuned to '+pick.rs+' px / '+pick.fp+' fps / q'+pick.q.toFixed(2));
      } else {
        var rs=resCand[0],fp=fpsCand[0],q=qLadder[0],nF=Math.max(2,Math.round(fp*T));
        pick={rs:rs,fp:fp,q:q,nF:nF};
        note=' · smallest possible — still over '+fmtSize(target)+', shorten the loop or lower the base resolution';
        eclog('warn','export.autotune_overflow',{target:target},'No configuration fits the target — using smallest');
      }
      setOv('Rendering…',0.42);
      fullRenderWebP(pick.rs,pick.fp,pick.q,note);
    }
    setOv('Calibrating sizes…',0.05);
    setWebpStatus('Calibrating frame sizes…','');
    calibrate(0);
  }

  renderBtn.addEventListener('click',function(){ runExport(false); });

  /* ---------- Initial events + history baseline ---------- */
  var glInfo={vendor:gl.getParameter(gl.VENDOR),renderer:gl.getParameter(gl.RENDERER)};
  try{ var dbg=gl.getExtension('WEBGL_debug_renderer_info'); if(dbg){ glInfo.unmasked_renderer=gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL); } }catch(e){}
  eclog('ready','app.start',{params:CONFIG.length,presets:Object.keys(PRESETS).length},'Orb Forge initialized');
  eclog('info','gl.ready',glInfo,'WebGL context ready');
  HIST.push(snapshot()); updateHistoryUI();

  /* ---------- Wire history buttons ---------- */
  document.getElementById('btnUndo').addEventListener('click',undo);
  document.getElementById('btnRedo').addEventListener('click',redo);
})();
