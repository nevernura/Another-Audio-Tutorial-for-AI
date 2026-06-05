// AUTO-GENERATED — reuses the tested canvas visuals from the standalone tutorial.
"use client";

// helpers.js — shared utilities used by every step and the shell.
// Loaded first. Defines TAU, el(), fitCanvas(), roundedRect(),
// drawStageTitle(), palette(), ac() (audio context) and the global STEPS list.

let AC = null;
  function ac(){
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if(AC.state === "suspended") AC.resume();
    return AC;
  }

  const TAU = Math.PI * 2;
  const $ = (s,r=document)=>r.querySelector(s);
  const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));
  function el(tag, cls, html){
    const e=document.createElement(tag);
    if(cls) e.className=cls;
    if(html != null) e.innerHTML=html;
    return e;
  }
  function fitCanvas(cv){
    const r=cv.getBoundingClientRect(), dpr=Math.min(window.devicePixelRatio || 1, 2);
    cv.width=Math.max(1, Math.round(r.width*dpr));
    cv.height=Math.max(1, Math.round(r.height*dpr));
    return dpr;
  }
  function roundedRect(ctx,x,y,w,h,r){
    const rr=Math.min(r,w/2,h/2);
    ctx.beginPath();
    ctx.moveTo(x+rr,y);
    ctx.arcTo(x+w,y,x+w,y+h,rr);
    ctx.arcTo(x+w,y+h,x,y+h,rr);
    ctx.arcTo(x,y+h,x,y,rr);
    ctx.arcTo(x,y,x+w,y,rr);
    ctx.closePath();
  }
  function drawStageTitle(ctx,dpr,text,sub){
    ctx.save();
    ctx.font=`${16*dpr}px "Spline Sans Mono", monospace`;
    ctx.fillStyle="rgba(237,246,255,.82)";
    ctx.fillText(text,22*dpr,56*dpr);
    if(sub){
      ctx.font=`${11*dpr}px "Spline Sans Mono", monospace`;
      ctx.fillStyle="rgba(237,246,255,.52)";
      ctx.fillText(sub,22*dpr,76*dpr);
    }
    ctx.restore();
  }
  function palette(i){
    return ["#ffd84d","#ff5c9d","#3d7cff","#25d8d0","#55d66b","#8b5cf6","#ff8a4c"][i%7];
  }

function IntroViz(){
    let mode="messages";
    let cv,ctx,raf,t=0;
    const words=["traffic","audio","image","gesture","code","sensor","voice","music","beacon","heartbeat"];
    return {
      controls:[
        {type:"seg",label:"View",opts:[["messages","Messages"],["function","Function"]],val:()=>mode,on:v=>mode=v}
      ],
      note:"a signal is a changing message",
      legend:[["#ffd84d","message"],["#25d8d0","measurable change"]],
      mount(host){ cv=el("canvas"); host.appendChild(cv); loop(); },
      unmount(){ cancelAnimationFrame(raf); }
    };
    function loop(){ raf=requestAnimationFrame(loop); t+=0.018; draw(); }
    function draw(){
      const dpr=fitCanvas(cv), W=cv.width, H=cv.height; ctx=ctx || cv.getContext("2d");
      ctx.clearRect(0,0,W,H);
      drawStageTitle(ctx,dpr,"Signals carry messages","anything measurable that changes can become data");
      if(mode==="messages") drawMessages(dpr,W,H); else drawFunction(dpr,W,H);
    }
    function drawMessages(dpr,W,H){
      const cx=W/2, cy=H/2+10*dpr, orbit=Math.min(W,H)*0.27;
      ctx.save();
      ctx.lineWidth=2*dpr; ctx.strokeStyle="rgba(255,255,255,.12)";
      for(let r=0.36;r<=1;r+=0.32){ ctx.beginPath(); ctx.arc(cx,cy,orbit*r,0,TAU); ctx.stroke(); }
      words.forEach((word,i)=>{
        const a=t*0.8+i*TAU/words.length, r=orbit*(0.58+0.34*((i%3)/2));
        const x=cx+Math.cos(a)*r, y=cy+Math.sin(a)*r;
        const w=(word.length*8+28)*dpr, h=34*dpr;
        roundedRect(ctx,x-w/2,y-h/2,w,h,17*dpr);
        ctx.fillStyle=`${palette(i)}dd`; ctx.fill();
        ctx.fillStyle="#10172a"; ctx.font=`700 ${12*dpr}px "Spline Sans Mono", monospace`;
        ctx.fillText(word,x-w/2+14*dpr,y+4*dpr);
      });
      const pulse=1+Math.sin(t*4)*0.05;
      ctx.beginPath(); ctx.arc(cx,cy,58*dpr*pulse,0,TAU); ctx.fillStyle="#fffaf0"; ctx.fill();
      ctx.beginPath(); ctx.arc(cx,cy,42*dpr,0,TAU); ctx.fillStyle="#3d7cff"; ctx.fill();
      ctx.fillStyle="#fff"; ctx.font=`800 ${14*dpr}px "Hanken Grotesk"`; ctx.textAlign="center";
      ctx.fillText("SIGNAL",cx,cy+5*dpr); ctx.textAlign="left";
      ctx.restore();
    }
    function drawFunction(dpr,W,H){
      const left=70*dpr,right=W-40*dpr,mid=H*0.55,amp=H*.2;
      ctx.save();
      ctx.strokeStyle="rgba(255,255,255,.14)"; ctx.lineWidth=1*dpr;
      ctx.beginPath(); ctx.moveTo(left,mid); ctx.lineTo(right,mid); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(left,mid-amp-34*dpr); ctx.lineTo(left,mid+amp+34*dpr); ctx.stroke();
      ctx.strokeStyle="#25d8d0"; ctx.lineWidth=5*dpr; ctx.lineCap="round"; ctx.beginPath();
      for(let x=left;x<=right;x+=3*dpr){
        const u=(x-left)/(right-left);
        const y=mid-(Math.sin(u*TAU*2.1-t*1.8)*.62+Math.sin(u*TAU*5+t)*.22)*amp;
        x===left?ctx.moveTo(x,y):ctx.lineTo(x,y);
      }
      ctx.stroke();
      for(let i=0;i<11;i++){
        const u=i/10, x=left+u*(right-left);
        const y=mid-(Math.sin(u*TAU*2.1-t*1.8)*.62+Math.sin(u*TAU*5+t)*.22)*amp;
        ctx.beginPath(); ctx.arc(x,y,7*dpr,0,TAU); ctx.fillStyle=palette(i); ctx.fill();
      }
      ctx.fillStyle="rgba(237,246,255,.7)"; ctx.font=`${12*dpr}px "Spline Sans Mono"`;
      ctx.fillText("parameter: time, space, or anything measurable",left,mid+amp+62*dpr);
      ctx.fillText("value: pressure, brightness, voltage, position...",left,mid-amp-48*dpr);
      ctx.restore();
    }
  }

function WaveViz(){
    let cv,ctx,raf,osc,gain,playing=false,freq=3,amp=0.7,phase=0,playHz=220,wave="sine";
    return {
      controls:[
        {type:"range",label:"Frequency",min:1,max:8,step:0.1,val:()=>freq,fmt:v=>v.toFixed(1)+"x",on:v=>{freq=v; playHz=110*v; if(osc) osc.frequency.value=playHz;}},
        {type:"range",label:"Amplitude",min:0.1,max:1,step:0.01,val:()=>amp,fmt:v=>v.toFixed(2),on:v=>{amp=v; if(gain) gain.gain.value=v*0.16;}},
        {type:"seg",label:"Shape",opts:[["sine","Sine"],["square","Square"],["sawtooth","Saw"]],val:()=>wave,on:v=>{wave=v; if(osc) osc.type=wave;}},
        {type:"play",label:()=>playing?"Stop":"Play tone",on:()=>toggle()}
      ],
      note:"x(t) = A sin(2 pi f t)",
      legend:[["#ff5c9d","wave"],["#ffd84d","air pressure samples"]],
      mount(host){ cv=el("canvas"); host.appendChild(cv); loop(); },
      unmount(){ cancelAnimationFrame(raf); stop(); }
    };
    function toggle(){ playing ? stop() : start(); }
    function start(){
      const c=ac(); osc=c.createOscillator(); gain=c.createGain();
      osc.type=wave; osc.frequency.value=playHz; gain.gain.value=amp*0.16;
      osc.connect(gain); gain.connect(c.destination); osc.start(); playing=true; refreshPlay();
    }
    function stop(){
      if(osc){ try{osc.stop();}catch(e){} osc.disconnect(); osc=null; }
      playing=false; refreshPlay();
    }
    function refreshPlay(){
      const b=document.querySelector(".playbtn");
      if(b){ b.classList.toggle("on",playing); b.textContent=playing?"■ Stop":"▶ Play tone"; }
    }
    function value(u){
      if(wave==="square") return Math.sign(Math.sin(u*freq*TAU-phase)) || 0;
      if(wave==="sawtooth") return 2*((u*freq-phase/TAU)%1)-1;
      return Math.sin(u*freq*TAU-phase);
    }
    function loop(){ raf=requestAnimationFrame(loop); phase+=0.035; draw(); }
    function draw(){
      const dpr=fitCanvas(cv),W=cv.width,H=cv.height; ctx=ctx||cv.getContext("2d");
      ctx.clearRect(0,0,W,H); drawStageTitle(ctx,dpr,"Wave anatomy","frequency controls pitch; amplitude controls loudness");
      const left=36*dpr,right=W-36*dpr,mid=H*.55,A=amp*H*.28;
      ctx.strokeStyle="rgba(255,255,255,.16)"; ctx.lineWidth=1*dpr;
      ctx.beginPath(); ctx.moveTo(left,mid); ctx.lineTo(right,mid); ctx.stroke();
      ctx.lineWidth=4*dpr; ctx.strokeStyle="#ff5c9d"; ctx.lineCap="round"; ctx.beginPath();
      for(let x=left;x<=right;x+=2*dpr){
        const u=(x-left)/(right-left), y=mid-value(u)*A;
        x===left?ctx.moveTo(x,y):ctx.lineTo(x,y);
      }
      ctx.stroke();
      ctx.globalAlpha=.18; ctx.lineWidth=12*dpr; ctx.stroke(); ctx.globalAlpha=1;
      ctx.fillStyle="#ffd84d";
      for(let i=0;i<20;i++){
        const u=i/19, x=left+u*(right-left), y=mid-value(u)*A;
        ctx.beginPath(); ctx.arc(x,y,4.5*dpr,0,TAU); ctx.fill();
      }
      ctx.strokeStyle="#25d8d0"; ctx.lineWidth=2*dpr; ctx.setLineDash([5*dpr,6*dpr]);
      const ax=left+(right-left)*.16, ay=mid-value(.16)*A;
      ctx.beginPath(); ctx.moveTo(ax,mid); ctx.lineTo(ax,ay); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle="#25d8d0"; ctx.font=`${12*dpr}px "Spline Sans Mono"`;
      ctx.fillText("amplitude",ax+8*dpr,(mid+ay)/2);
    }
  }

function SamplingViz(){
    let cv,ctx,raf,phase=0,rate=18,showRecon=true,sigHz=4.2;
    return {
      controls:[
        {type:"range",label:"Sample rate",min:5,max:64,step:1,val:()=>rate,fmt:v=>v+" /s",on:v=>rate=v},
        {type:"range",label:"Signal speed",min:1,max:9,step:0.1,val:()=>sigHz,fmt:v=>v.toFixed(1)+"x",on:v=>sigHz=v},
        {type:"seg",label:"Rebuild",opts:[["on","Show"],["off","Hide"]],val:()=>showRecon?"on":"off",on:v=>showRecon=(v==="on")}
      ],
      note:"sample rate vs. the wave",
      legend:[["#8b95a7","analog"],["#ffd84d","samples"],["#3d7cff","digital rebuild"]],
      mount(host){ cv=el("canvas"); host.appendChild(cv); loop(); },
      unmount(){ cancelAnimationFrame(raf); }
    };
    function loop(){ raf=requestAnimationFrame(loop); phase+=0.014; draw(); }
    function wave(u){ return Math.sin(u*sigHz*TAU - phase) + .24*Math.sin(u*sigHz*TAU*2 - phase*.7); }
    function draw(){
      const dpr=fitCanvas(cv),W=cv.width,H=cv.height; ctx=ctx||cv.getContext("2d");
      ctx.clearRect(0,0,W,H); drawStageTitle(ctx,dpr,"Sampling: snapshots in time","the computer only sees the dots");
      const left=36*dpr,right=W-36*dpr,mid=H*.55,A=H*.24;
      ctx.strokeStyle="rgba(255,255,255,.16)"; ctx.lineWidth=1*dpr; ctx.beginPath(); ctx.moveTo(left,mid); ctx.lineTo(right,mid); ctx.stroke();
      ctx.strokeStyle="rgba(237,246,255,.38)"; ctx.lineWidth=3*dpr; ctx.beginPath();
      for(let x=left;x<=right;x+=2*dpr){ const u=(x-left)/(right-left),y=mid-wave(u)*A; x===left?ctx.moveTo(x,y):ctx.lineTo(x,y); }
      ctx.stroke();
      const N=rate, pts=[];
      for(let i=0;i<=N;i++){ const u=i/N, x=left+u*(right-left), y=mid-wave(u)*A; pts.push([x,y]); }
      if(showRecon){
        ctx.strokeStyle="#3d7cff"; ctx.lineWidth=3*dpr; ctx.lineCap="round"; ctx.beginPath();
        pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.stroke();
        ctx.globalAlpha=.16; ctx.lineWidth=10*dpr; ctx.stroke(); ctx.globalAlpha=1;
      }
      pts.forEach((p,i)=>{
        ctx.strokeStyle="rgba(255,216,77,.28)"; ctx.lineWidth=1*dpr; ctx.beginPath(); ctx.moveTo(p[0],mid+H*.28); ctx.lineTo(p[0],mid-H*.28); ctx.stroke();
        ctx.fillStyle=i%2?"#ffd84d":"#ff5c9d"; ctx.beginPath(); ctx.arc(p[0],p[1],5*dpr,0,TAU); ctx.fill();
      });
      const ok=rate>=sigHz*2.2;
      ctx.font=`700 ${13*dpr}px "Spline Sans Mono"`;
      ctx.fillStyle=ok?"#25d8d0":"#ff8a7a";
      ctx.fillText(ok?"above Nyquist: the shape survives":"below Nyquist: aliases appear",24*dpr,H-26*dpr);
    }
  }

function QuantizationViz(){
    let cv,ctx,raf,t=0,rate=24,bits=3;
    return {
      controls:[
        {type:"range",label:"Sample rate",min:8,max:72,step:1,val:()=>rate,fmt:v=>v+" /s",on:v=>rate=v},
        {type:"range",label:"Bit depth",min:2,max:8,step:1,val:()=>bits,fmt:v=>v+" bits",on:v=>bits=v}
      ],
      note:"x axis: sampling rate · y axis: bit depth",
      legend:[["#25d8d0","true wave"],["#ffd84d","quantized steps"],["#ff5c9d","rounding error"]],
      mount(host){ cv=el("canvas"); host.appendChild(cv); loop(); },
      unmount(){ cancelAnimationFrame(raf); }
    };
    function loop(){ raf=requestAnimationFrame(loop); t+=0.012; draw(); }
    function signal(u){ return .72*Math.sin(u*TAU*2-t*1.8)+.22*Math.sin(u*TAU*5+t); }
    function quant(y){ const levels=Math.pow(2,bits); return Math.round(((y+1)/2)*(levels-1))/(levels-1)*2-1; }
    function draw(){
      const dpr=fitCanvas(cv),W=cv.width,H=cv.height; ctx=ctx||cv.getContext("2d");
      ctx.clearRect(0,0,W,H); drawStageTitle(ctx,dpr,"Quantization: measuring height","bit depth decides how many vertical slots exist");
      const left=54*dpr,right=W-42*dpr,top=98*dpr,bottom=H-58*dpr,mid=(top+bottom)/2,A=(bottom-top)*.42;
      const levels=Math.pow(2,bits);
      ctx.strokeStyle="rgba(255,255,255,.11)"; ctx.lineWidth=1*dpr;
      for(let i=0;i<levels;i++){
        const q=-1+i/(levels-1)*2, y=mid-q*A;
        ctx.beginPath(); ctx.moveTo(left,y); ctx.lineTo(right,y); ctx.stroke();
      }
      ctx.strokeStyle="#25d8d0"; ctx.lineWidth=3*dpr; ctx.beginPath();
      for(let x=left;x<=right;x+=2*dpr){ const u=(x-left)/(right-left), y=mid-signal(u)*A; x===left?ctx.moveTo(x,y):ctx.lineTo(x,y); }
      ctx.stroke();
      const pts=[];
      for(let i=0;i<=rate;i++){ const u=i/rate, x=left+u*(right-left), y=signal(u), q=quant(y); pts.push([x,mid-y*A,mid-q*A]); }
      ctx.strokeStyle="#ffd84d"; ctx.lineWidth=4*dpr; ctx.lineCap="round"; ctx.lineJoin="round"; ctx.beginPath();
      pts.forEach((p,i)=>{ if(i===0) ctx.moveTo(p[0],p[2]); else { const prev=pts[i-1]; ctx.lineTo(p[0],prev[2]); ctx.lineTo(p[0],p[2]); }});
      ctx.stroke();
      pts.forEach(p=>{
        ctx.strokeStyle="rgba(255,92,157,.5)"; ctx.lineWidth=2*dpr; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(p[0],p[2]); ctx.stroke();
        ctx.fillStyle="#ff5c9d"; ctx.beginPath(); ctx.arc(p[0],p[2],4*dpr,0,TAU); ctx.fill();
      });
      ctx.fillStyle="rgba(237,246,255,.7)"; ctx.font=`${12*dpr}px "Spline Sans Mono"`;
      ctx.fillText(`${levels} amplitude levels`,left,bottom+28*dpr);
      ctx.fillText("quantization error becomes noise",right-260*dpr,bottom+28*dpr);
    }
  }

function SpectrumViz(){
    let cv,ctx,raf,phase=0,playing=false,oscillators=[],gain;
    const comps=[{f:1,a:.8},{f:2,a:.25},{f:3,a:.15},{f:5,a:0}];
    return {
      controls:[
        {type:"range",label:"Tone 1",min:0,max:1,step:0.01,val:()=>comps[0].a,fmt:v=>v.toFixed(2),on:v=>{comps[0].a=v; updateGain();}},
        {type:"range",label:"Tone 2",min:0,max:1,step:0.01,val:()=>comps[1].a,fmt:v=>v.toFixed(2),on:v=>{comps[1].a=v; updateGain();}},
        {type:"range",label:"Tone 3",min:0,max:1,step:0.01,val:()=>comps[2].a,fmt:v=>v.toFixed(2),on:v=>{comps[2].a=v; updateGain();}},
        {type:"range",label:"Tone 5",min:0,max:1,step:0.01,val:()=>comps[3].a,fmt:v=>v.toFixed(2),on:v=>{comps[3].a=v; updateGain();}},
        {type:"play",label:()=>playing?"Stop":"Play mix",on:()=>playing?stop():start()}
      ],
      note:"left: wave · right: frequency recipe",
      legend:[["#ff5c9d","sum"],["#3d7cff","spectrum bars"]],
      mount(host){ cv=el("canvas"); host.appendChild(cv); loop(); },
      unmount(){ cancelAnimationFrame(raf); stop(); }
    };
    function start(){
      const c=ac(); gain=c.createGain(); gain.gain.value=.045; gain.connect(c.destination);
      oscillators=comps.map((comp)=>{
        const osc=c.createOscillator(), g=c.createGain();
        osc.type="sine"; osc.frequency.value=180*comp.f; g.gain.value=comp.a;
        osc.connect(g); g.connect(gain); osc.start(); return {osc,g};
      });
      playing=true; refreshPlay();
    }
    function stop(){
      oscillators.forEach(({osc})=>{ try{osc.stop();}catch(e){} try{osc.disconnect();}catch(e){} });
      oscillators=[]; if(gain){gain.disconnect(); gain=null;} playing=false; refreshPlay();
    }
    function updateGain(){ oscillators.forEach((o,i)=>o.g.gain.value=comps[i].a); }
    function refreshPlay(){ const b=document.querySelector(".playbtn"); if(b){ b.classList.toggle("on",playing); b.textContent=playing?"■ Stop":"▶ Play mix"; } }
    function loop(){ raf=requestAnimationFrame(loop); phase+=0.027; draw(); }
    function draw(){
      const dpr=fitCanvas(cv),W=cv.width,H=cv.height; ctx=ctx||cv.getContext("2d");
      ctx.clearRect(0,0,W,H); drawStageTitle(ctx,dpr,"Fourier: the recipe","a complex sound is a stack of simple tones");
      const split=W*.62,left=36*dpr,mid=H*.55,A=H*.22;
      ctx.strokeStyle="rgba(255,255,255,.15)"; ctx.lineWidth=1*dpr; ctx.beginPath(); ctx.moveTo(left,mid); ctx.lineTo(split-24*dpr,mid); ctx.stroke();
      const amax=comps.reduce((s,c)=>s+c.a,0)||1;
      ctx.strokeStyle="#ff5c9d"; ctx.lineWidth=4*dpr; ctx.lineCap="round"; ctx.beginPath();
      for(let x=left;x<=split-24*dpr;x+=2*dpr){
        const u=(x-left)/(split-24*dpr-left); let y=0;
        comps.forEach(c=>{ y+=c.a*Math.sin(u*c.f*TAU*3 - phase*c.f); });
        const py=mid-(y/amax)*A; x===left?ctx.moveTo(x,py):ctx.lineTo(x,py);
      }
      ctx.stroke(); ctx.globalAlpha=.16; ctx.lineWidth=12*dpr; ctx.stroke(); ctx.globalAlpha=1;
      ctx.strokeStyle="rgba(255,255,255,.16)"; ctx.lineWidth=1*dpr; ctx.beginPath(); ctx.moveTo(split,84*dpr); ctx.lineTo(split,H-54*dpr); ctx.stroke();
      const bx0=split+46*dpr, bw=W-bx0-44*dpr, base=H-78*dpr;
      ctx.strokeStyle="rgba(255,255,255,.22)"; ctx.lineWidth=2*dpr; ctx.beginPath(); ctx.moveTo(bx0-16*dpr,base); ctx.lineTo(W-30*dpr,base); ctx.stroke();
      comps.forEach((c,i)=>{
        const x=bx0+(i+.5)/comps.length*bw, h=c.a*(H*.48);
        ctx.strokeStyle=palette(i+2); ctx.lineWidth=16*dpr; ctx.lineCap="round";
        ctx.beginPath(); ctx.moveTo(x,base); ctx.lineTo(x,base-h); ctx.stroke();
        ctx.fillStyle="rgba(237,246,255,.72)"; ctx.font=`${12*dpr}px "Spline Sans Mono"`;
        ctx.fillText(`${c.f}f`,x-12*dpr,base+26*dpr);
      });
      ctx.fillStyle="rgba(237,246,255,.55)"; ctx.font=`${11*dpr}px "Spline Sans Mono"`;
      ctx.fillText("frequency",bx0-16*dpr,H-28*dpr);
    }
  }

function WindowViz(){
    let cv,ctx,raf,t=0,windowSize=.22,overlap=.5;
    return {
      controls:[
        {type:"range",label:"Window size",min:.12,max:.5,step:.01,val:()=>windowSize,fmt:v=>Math.round(v*100)+"%",on:v=>windowSize=v},
        {type:"range",label:"Overlap",min:0,max:.85,step:.05,val:()=>overlap,fmt:v=>Math.round(v*100)+"%",on:v=>overlap=v}
      ],
      note:"short windows let changing audio look nearly still",
      legend:[["#25d8d0","signal"],["#ffd84d","analysis window"],["#ff5c9d","frames"]],
      mount(host){ cv=el("canvas"); host.appendChild(cv); loop(); },
      unmount(){ cancelAnimationFrame(raf); }
    };
    function loop(){ raf=requestAnimationFrame(loop); t+=0.008; draw(); }
    function sig(u){ return Math.sin(TAU*(2.2+5*u)*u - t*3)*(.25+.65*u); }
    function draw(){
      const dpr=fitCanvas(cv),W=cv.width,H=cv.height; ctx=ctx||cv.getContext("2d");
      ctx.clearRect(0,0,W,H); drawStageTitle(ctx,dpr,"Windowing: small slices","spectrograms analyze short overlapping frames");
      const left=42*dpr,right=W-42*dpr,mid=H*.48,A=H*.22;
      ctx.strokeStyle="rgba(255,255,255,.15)"; ctx.lineWidth=1*dpr; ctx.beginPath(); ctx.moveTo(left,mid); ctx.lineTo(right,mid); ctx.stroke();
      ctx.strokeStyle="#25d8d0"; ctx.lineWidth=3*dpr; ctx.lineCap="round"; ctx.beginPath();
      for(let x=left;x<=right;x+=2*dpr){ const u=(x-left)/(right-left),y=mid-sig(u)*A; x===left?ctx.moveTo(x,y):ctx.lineTo(x,y); }
      ctx.stroke();
      const winW=(right-left)*windowSize, step=winW*(1-overlap), start=left+((t*70*dpr)%Math.max(step,1));
      for(let x=start-winW;x<right;x+=Math.max(step,10*dpr)){
        if(x+winW<left) continue;
        const active=x<=left+(right-left)*.5 && x+winW>=left+(right-left)*.5;
        ctx.fillStyle=active?"rgba(255,216,77,.24)":"rgba(255,92,157,.13)";
        ctx.strokeStyle=active?"#ffd84d":"rgba(255,92,157,.5)";
        roundedRect(ctx,x,mid-A-28*dpr,winW,A*2+56*dpr,16*dpr); ctx.fill(); ctx.stroke();
      }
      const miniTop=H-104*dpr, frameCount=Math.floor(1/windowSize/(1-overlap));
      ctx.fillStyle="rgba(237,246,255,.58)"; ctx.font=`${12*dpr}px "Spline Sans Mono"`;
      ctx.fillText("frames become columns in the spectrogram",left,miniTop-18*dpr);
      for(let i=0;i<Math.min(frameCount,18);i++){
        const x=left+i*24*dpr, h=(24+Math.sin(i*.8+t*3)*18+windowSize*50)*dpr;
        roundedRect(ctx,x,miniTop+54*dpr-h,15*dpr,h,7*dpr);
        ctx.fillStyle=i%2?"#ff5c9d":"#ffd84d"; ctx.fill();
      }
    }
  }

function MelViz(){
    let cv,ctx,raf,t=0,toneHz=700,view="mel";
    return {
      controls:[
        {type:"range",label:"Frequency",min:80,max:8000,step:10,val:()=>toneHz,fmt:v=>Math.round(v)+" Hz",on:v=>toneHz=v},
        {type:"seg",label:"Scale",opts:[["hz","Hz"],["mel","Mel"]],val:()=>view,on:v=>view=v}
      ],
      note:"humans hear pitch spacing more like mel than linear hertz",
      legend:[["#ffd84d","equal Hz"],["#25d8d0","mel spacing"],["#ff5c9d","selected tone"]],
      mount(host){ cv=el("canvas"); host.appendChild(cv); loop(); },
      unmount(){ cancelAnimationFrame(raf); }
    };
    function hzToMel(f){ return 2595*Math.log10(1+f/700); }
    function normHz(f){ return f/8000; }
    function normMel(f){ return hzToMel(f)/hzToMel(8000); }
    function loop(){ raf=requestAnimationFrame(loop); t+=0.012; draw(); }
    function draw(){
      const dpr=fitCanvas(cv),W=cv.width,H=cv.height; ctx=ctx||cv.getContext("2d");
      ctx.clearRect(0,0,W,H); drawStageTitle(ctx,dpr,"Mel scale: hearing is not linear","low frequencies get more perceptual detail");
      const left=72*dpr,right=W-54*dpr,y1=H*.42,y2=H*.62;
      drawRail(left,right,y1,"Linear Hz",normHz,dpr);
      drawRail(left,right,y2,"Mel scale",normMel,dpr);
      const selected=view==="hz"?normHz(toneHz):normMel(toneHz);
      const x=left+selected*(right-left);
      ctx.strokeStyle="#ff5c9d"; ctx.lineWidth=3*dpr; ctx.beginPath(); ctx.moveTo(x,y1-64*dpr); ctx.lineTo(x,y2+64*dpr); ctx.stroke();
      ctx.beginPath(); ctx.arc(x,view==="hz"?y1:y2,13*dpr+Math.sin(t*5)*2*dpr,0,TAU); ctx.fillStyle="#ff5c9d"; ctx.fill();
      ctx.fillStyle="#fff"; ctx.font=`700 ${13*dpr}px "Spline Sans Mono"`; ctx.fillText(`${Math.round(toneHz)} Hz`,x+16*dpr,(view==="hz"?y1:y2)+5*dpr);
      ctx.fillStyle="rgba(237,246,255,.66)"; ctx.font=`${12*dpr}px "Spline Sans Mono"`;
      ctx.fillText("500 -> 1000 Hz feels much larger than 10000 -> 10500 Hz, even with the same raw gap.",left,H-48*dpr);
    }
    function drawRail(left,right,y,label,map,dpr){
      ctx.strokeStyle="rgba(255,255,255,.18)"; ctx.lineWidth=8*dpr; ctx.lineCap="round";
      ctx.beginPath(); ctx.moveTo(left,y); ctx.lineTo(right,y); ctx.stroke();
      [125,250,500,1000,2000,4000,8000].forEach((f,i)=>{
        const x=left+map(f)*(right-left);
        ctx.fillStyle=label==="Mel scale"?"#25d8d0":"#ffd84d";
        ctx.beginPath(); ctx.arc(x,y,6*dpr,0,TAU); ctx.fill();
        ctx.fillStyle="rgba(237,246,255,.58)"; ctx.font=`${10*dpr}px "Spline Sans Mono"`;
        if(i%2===0) ctx.fillText(f>=1000?(f/1000)+"k":String(f),x-10*dpr,y+28*dpr);
      });
      ctx.fillStyle="rgba(237,246,255,.8)"; ctx.font=`700 ${13*dpr}px "Spline Sans Mono"`;
      ctx.fillText(label,left,y-24*dpr);
    }
  }

const VIZ = { IntroViz, WaveViz, SamplingViz, QuantizationViz, SpectrumViz, WindowViz, MelViz };


export function mountLegacyStep(vizName, stageEl, controlsEl){
  const factory = VIZ[vizName];
  if(!factory){ if(controlsEl) controlsEl.textContent = "Unknown visual: "+vizName; return ()=>{}; }
  stageEl.querySelectorAll("canvas,.hint,.axis-note,.legend").forEach(n=>n.remove());
  controlsEl.innerHTML="";
  const viz = factory();
  if(viz.note) stageEl.appendChild(el("div","axis-note",viz.note));
  if(viz.legend && viz.legend.length){
    const legend=el("div","legend");
    viz.legend.forEach(([color,label])=>legend.appendChild(el("span",null,`<i style="background:${color}"></i>${label}`)));
    stageEl.appendChild(legend);
  }
  viz.mount(stageEl);
  if(viz.hint){ const h=el("div","hint",viz.hint); h.id="stage-hint"; stageEl.appendChild(h); }
  (viz.controls || []).forEach(c=>{
    if(c.type==="range"){
      const w=el("div","ctl"), lab=el("label",null,c.label), inp=el("input");
      inp.type="range"; inp.min=c.min; inp.max=c.max; inp.step=c.step; inp.value=c.val();
      const v=el("span","val",c.fmt?c.fmt(+inp.value):inp.value);
      inp.addEventListener("input",()=>{ c.on(+inp.value); v.textContent=c.fmt?c.fmt(+inp.value):inp.value; });
      w.append(lab,inp,v); controlsEl.appendChild(w);
    }else if(c.type==="seg"){
      const w=el("div","ctl"); w.appendChild(el("label",null,c.label));
      const seg=el("div","seg");
      c.opts.forEach(([val,txt])=>{
        const b=el("button",null,txt); b.classList.toggle("active",c.val()===val);
        b.addEventListener("click",()=>{ [...seg.children].forEach(x=>x.classList.remove("active")); b.classList.add("active"); c.on(val); });
        seg.appendChild(b);
      });
      w.appendChild(seg); controlsEl.appendChild(w);
    }else if(c.type==="play"){
      const b=el("button","playbtn",`▶ ${typeof c.label==="function"?c.label():c.label}`);
      b.addEventListener("click",()=>c.on()); controlsEl.appendChild(b);
    }
  });
  const err=el("span","errmsg"); err.id="sg-err"; controlsEl.appendChild(err);
  return ()=>{ if(viz.unmount) viz.unmount(); };
}
