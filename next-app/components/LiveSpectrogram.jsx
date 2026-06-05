"use client";
import { useEffect, useRef, useState } from "react";
import { LUT } from "./colormap";

/**
 * Live microphone spectrogram — WebGL, with a Flat (2D) / 3D toggle.
 *
 * Drop-in replacement: same props, same CSS classes, same audio pipeline.
 *   getUserMedia -> MediaStreamSource -> AnalyserNode -> getByteFrequencyData()
 *
 * Flat view:  ring texture rendered as two clamped sub-quads (seam-free scroll).
 * 3D view:    a GRID_W x GRID_D mesh whose vertices are displaced in Y by the
 *             frequency amplitude sampled from that same texture in the vertex
 *             shader (Chrome Music Lab's technique). Drag to orbit.
 *
 * Both views share one LUMINANCE ring texture; each frame we upload ONE
 * log-spaced column with texSubImage2D. Your magma LUT is a 256x1 texture.
 */

const FFT_SIZE = 2048;
const N_BINS = 256;          // log-spaced frequency rows
const FMIN = 30;             // matches spectro.py
const HISTORY = 1024;        // ring width (time columns)

// 3D mesh
const GRID_W = 200;          // vertices across frequency
const GRID_D = 200;          // vertices across time (depth)
const WINDOW = 256;          // recent columns mapped across the depth
const HALF_W = 4;            // mesh half-width in world units
const HALF_D = 4;            // mesh half-depth in world units

// ---- shaders ----
const VERT_2D = `
attribute vec2 aPos;
uniform vec2 uScreen, uTexX;
varying vec2 vUV;
void main(){
  float sx = mix(uScreen.x, uScreen.y, aPos.x);
  vUV = vec2(mix(uTexX.x, uTexX.y, aPos.x), aPos.y);
  gl_Position = vec4(sx*2.0-1.0, aPos.y*2.0-1.0, 0.0, 1.0);
}`;
const FRAG_2D = `
#ifdef GL_ES
precision mediump float;
#endif
varying vec2 vUV;
uniform sampler2D uData, uLut;
void main(){
  float a = texture2D(uData, vUV).r;
  float fade = pow(cos((1.0 - vUV.y) * 0.5 * 3.14159265), 0.4);
  gl_FragColor = vec4(texture2D(uLut, vec2(a, 0.5)).rgb * fade, 1.0);
}`;

const VERT_3D = `
attribute vec2 aGrid;                 // (freqFrac, timeFrac)
uniform sampler2D uData;
uniform float uHead, uWindow, uVScale;
uniform mat4 uMVP;
varying float vAmp;
void main(){
  float col = uHead - uWindow + aGrid.y * (uWindow - 1.0);
  float texX = fract((col + ${HISTORY}.0) / ${HISTORY}.0);
  float amp = texture2D(uData, vec2(texX, aGrid.x)).r;   // texX=time, aGrid.x=freq
  vAmp = amp;
  float x = (aGrid.x * 2.0 - 1.0) * ${HALF_W}.0;
  float z = (aGrid.y * 2.0 - 1.0) * ${HALF_D}.0;
  float y = amp * uVScale - uVScale * 0.5;
  gl_Position = uMVP * vec4(x, y, z, 1.0);
}`;
const FRAG_3D = `
#ifdef GL_ES
precision mediump float;
#endif
varying float vAmp;
uniform sampler2D uLut;
void main(){
  vec3 c = texture2D(uLut, vec2(vAmp, 0.5)).rgb;
  c *= 0.35 + 0.65 * vAmp;            // peaks pop, troughs recede
  gl_FragColor = vec4(c, 1.0);
}`;

// ---- gl + mat4 helpers ----
function compile(gl, t, src){
  const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s);
  if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}
function program(gl, vs, fs){
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if(!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}
function perspective(fovyDeg, aspect, near, far){
  const f = 1/Math.tan(fovyDeg*Math.PI/360), nf = 1/(near-far);
  return new Float32Array([f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)*nf,-1, 0,0,2*far*near*nf,0]);
}
function mul(a,b){
  const o=new Float32Array(16);
  for(let c=0;c<4;c++)for(let r=0;r<4;r++){
    let s=0; for(let k=0;k<4;k++) s+=a[k*4+r]*b[c*4+k];
    o[c*4+r]=s;
  }
  return o;
}
function translate(x,y,z){ return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1]); }
function rotX(a){ const c=Math.cos(a),s=Math.sin(a); return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]); }
function rotY(a){ const c=Math.cos(a),s=Math.sin(a); return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]); }

export default function LiveSpectrogram({ title = "Live microphone" }){
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const ctxRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);

  const glRef = useRef(null);
  const p2 = useRef(null), p3 = useRef(null);   // programs + locations
  const meshRef = useRef(null);                 // {vbo, ibo, count}
  const dataTexRef = useRef(null);
  const lutTexRef = useRef(null);
  const writeHeadRef = useRef(0);
  const binMapRef = useRef(null);
  const freqDataRef = useRef(null);
  const colRef = useRef(null);

  const camRef = useRef({ yaw: 0.0, pitch: 0.95, drag: false, px: 0, py: 0 });
  const modeRef = useRef("2d");

  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState("2d");
  const [has3D, setHas3D] = useState(true);
  const [err, setErr] = useState("");
  const [sr, setSr] = useState(0);

  useEffect(() => { modeRef.current = mode; }, [mode]);

  function buildBinMap(sampleRate){
    const fmax = sampleRate/2, nyq = FFT_SIZE/2;
    const map = new Float32Array(N_BINS);
    for(let row=0; row<N_BINS; row++){
      const freq = FMIN * Math.pow(fmax/FMIN, row/(N_BINS-1));
      map[row] = (freq/fmax) * nyq;
    }
    binMapRef.current = map;
  }

  function initGL(){
    const cv = canvasRef.current;
    const gl = cv.getContext("webgl") || cv.getContext("experimental-webgl");
    if(!gl) throw new Error("WebGL is not available in this browser.");
    glRef.current = gl;

    const supports3D = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) > 0;
    setHas3D(supports3D);
    if(!supports3D && modeRef.current === "3d"){ modeRef.current = "2d"; setMode("2d"); }

    // 2D program
    const prog2 = program(gl, VERT_2D, FRAG_2D);
    p2.current = {
      prog: prog2,
      aPos: gl.getAttribLocation(prog2, "aPos"),
      uScreen: gl.getUniformLocation(prog2, "uScreen"),
      uTexX: gl.getUniformLocation(prog2, "uTexX"),
      uData: gl.getUniformLocation(prog2, "uData"),
      uLut: gl.getUniformLocation(prog2, "uLut"),
    };
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0,1,0,0,1,0,1,1,0,1,1]), gl.STATIC_DRAW);
    p2.current.quad = quad;

    // 3D program + mesh
    if(supports3D){
      const prog3 = program(gl, VERT_3D, FRAG_3D);
      p3.current = {
        prog: prog3,
        aGrid: gl.getAttribLocation(prog3, "aGrid"),
        uHead: gl.getUniformLocation(prog3, "uHead"),
        uWindow: gl.getUniformLocation(prog3, "uWindow"),
        uVScale: gl.getUniformLocation(prog3, "uVScale"),
        uMVP: gl.getUniformLocation(prog3, "uMVP"),
        uData: gl.getUniformLocation(prog3, "uData"),
        uLut: gl.getUniformLocation(prog3, "uLut"),
      };
      const grid = new Float32Array(GRID_W*GRID_D*2);
      let gi=0;
      for(let j=0;j<GRID_D;j++) for(let i=0;i<GRID_W;i++){
        grid[gi++] = i/(GRID_W-1); grid[gi++] = j/(GRID_D-1);
      }
      const vbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, grid, gl.STATIC_DRAW);

      const idx = new Uint16Array((GRID_W-1)*(GRID_D-1)*6);
      let ii=0;
      for(let j=0;j<GRID_D-1;j++) for(let i=0;i<GRID_W-1;i++){
        const a=j*GRID_W+i, b=a+1, c=(j+1)*GRID_W+i+1, d=(j+1)*GRID_W+i;
        idx[ii++]=a; idx[ii++]=b; idx[ii++]=c; idx[ii++]=a; idx[ii++]=c; idx[ii++]=d;
      }
      const ibo = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
      meshRef.current = { vbo, ibo, count: idx.length };
    }

    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

    // ring data texture (LUMINANCE). REPEAT_S so the 3D vertex fetch wraps cleanly.
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, HISTORY, N_BINS, 0,
      gl.LUMINANCE, gl.UNSIGNED_BYTE, new Uint8Array(HISTORY*N_BINS));
    dataTexRef.current = tex;

    // magma LUT (256x1 RGB)
    const lut = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, lut);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 256, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array(LUT));
    lutTexRef.current = lut;

    writeHeadRef.current = 0;
    resizeGL();
  }

  function resizeGL(){
    const gl = glRef.current, cv = canvasRef.current;
    if(!gl || !cv) return;
    const rect = cv.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.max(1, Math.round(rect.width*dpr));
    cv.height = Math.max(1, Math.round(rect.height*dpr));
    gl.viewport(0, 0, cv.width, cv.height);
  }

  async function start(){
    setErr("");
    try{
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC();
      if(ctx.state === "suspended") await ctx.resume();
      ctxRef.current = ctx; setSr(ctx.sampleRate); buildBinMap(ctx.sampleRate);

      const analyser = ctx.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = 0;
      analyserRef.current = analyser;
      ctx.createMediaStreamSource(stream).connect(analyser);

      freqDataRef.current = new Uint8Array(analyser.frequencyBinCount);
      colRef.current = new Uint8Array(N_BINS);

      initGL();
      setRunning(true);
      rafRef.current = requestAnimationFrame(tick);
    }catch(e){ setErr(e?.message || "Microphone access was blocked."); }
  }

  function stop(){
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    ctxRef.current?.close().catch(()=>{});
    streamRef.current = null; ctxRef.current = null; analyserRef.current = null;
    setRunning(false);
  }

  function tick(){
    const gl = glRef.current, analyser = analyserRef.current;
    const map = binMapRef.current, data = freqDataRef.current, col = colRef.current;
    if(!gl || !analyser) return;

    analyser.getByteFrequencyData(data);
    for(let row=0; row<N_BINS; row++){
      const fb = map[row], i0 = fb|0, i1 = Math.min(i0+1, data.length-1), f = fb-i0;
      col[row] = data[i0]*(1-f) + data[i1]*f;
    }

    const head = writeHeadRef.current;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, dataTexRef.current);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, head, 0, 1, N_BINS, gl.LUMINANCE, gl.UNSIGNED_BYTE, col);
    writeHeadRef.current = (head + 1) % HISTORY;

    if(modeRef.current === "3d" && p3.current) render3D(); else render2D();
    rafRef.current = requestAnimationFrame(tick);
  }

  function bindTextures(){
    const gl = glRef.current;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, dataTexRef.current);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, lutTexRef.current);
  }

  function render2D(){
    const gl = glRef.current, L = p2.current;
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(L.prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, L.quad);
    gl.enableVertexAttribArray(L.aPos);
    gl.vertexAttribPointer(L.aPos, 2, gl.FLOAT, false, 0, 0);
    bindTextures();
    gl.uniform1i(L.uData, 0); gl.uniform1i(L.uLut, 1);

    const head = writeHeadRef.current, split = (HISTORY-head)/HISTORY;
    gl.clearColor(0.03,0.03,0.055,1); gl.clear(gl.COLOR_BUFFER_BIT);
    if(split > 0){ gl.uniform2f(L.uScreen,0,split); gl.uniform2f(L.uTexX,head/HISTORY,1.0); gl.drawArrays(gl.TRIANGLES,0,6); }
    if(split < 1){ gl.uniform2f(L.uScreen,split,1.0); gl.uniform2f(L.uTexX,0.0,head/HISTORY); gl.drawArrays(gl.TRIANGLES,0,6); }
  }

  function render3D(){
    const gl = glRef.current, L = p3.current, m = meshRef.current, cam = camRef.current, cv = canvasRef.current;
    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(L.prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, m.vbo);
    gl.enableVertexAttribArray(L.aGrid);
    gl.vertexAttribPointer(L.aGrid, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ibo);
    bindTextures();
    gl.uniform1i(L.uData, 0); gl.uniform1i(L.uLut, 1);
    gl.uniform1f(L.uHead, writeHeadRef.current);
    gl.uniform1f(L.uWindow, WINDOW);
    gl.uniform1f(L.uVScale, 2.4);

    const proj = perspective(45, cv.width/cv.height, 0.5, 100);
    const scene = mul(rotX(cam.pitch), rotY(cam.yaw));
    const mvp = mul(proj, mul(translate(0, -0.6, -12), scene));
    gl.uniformMatrix4fv(L.uMVP, false, mvp);

    gl.clearColor(0.03,0.03,0.055,1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, m.count, gl.UNSIGNED_SHORT, 0);
  }

  // orbit drag (3D only)
  function down(e){ const c=camRef.current; c.drag=true; c.px=e.clientX; c.py=e.clientY; }
  function moveE(e){
    const c=camRef.current; if(!c.drag || modeRef.current!=="3d") return;
    c.yaw += (e.clientX-c.px)*0.01; c.pitch += (e.clientY-c.py)*0.01;
    c.pitch = Math.max(0.2, Math.min(1.45, c.pitch));
    c.px=e.clientX; c.py=e.clientY;
  }
  function up(){ camRef.current.drag=false; }

  useEffect(() => {
    const onResize = () => resizeGL();
    window.addEventListener("resize", onResize);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mouseup", up);
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fmax = sr ? sr/2 : 22050;
  const labels = [10000,5000,1000,200,50].filter(f => f < fmax);

  return (
    <div className="specwrap">
      {mode === "2d" && (
        <div className="axis-y" aria-hidden>
          {labels.map(f => (
            <span key={f} style={{ top: `${freqTop(f, FMIN, fmax)*100}%` }}>
              {f >= 1000 ? f/1000 + "k" : f}
            </span>
          ))}
        </div>
      )}
      <div className="specstage">
        <canvas
          ref={canvasRef}
          className="spec"
          style={{ cursor: mode === "3d" ? "grab" : "crosshair" }}
          onMouseDown={down}
          onMouseMove={moveE}
        />
        <div className="specbar">
          <button className="play" onClick={running ? stop : start}>
            {running ? "■ Stop" : "● Record"}
          </button>
          {has3D && (
            <button className="play" style={{ background: "#2b2b38", color: "#d9d7d0" }}
              onClick={() => setMode(mode === "2d" ? "3d" : "2d")}>
              {mode === "2d" ? "◈ 3D" : "▦ Flat"}
            </button>
          )}
          <span className="time">{running ? (mode === "3d" ? "drag to orbit" : "listening…") : "mic off"}</span>
          <span className="spectitle">{title}</span>
        </div>
        {err ? <p className="err" style={{ padding: "8px 12px" }}>⚠ {err}</p> : null}
      </div>
    </div>
  );
}

function freqTop(f, fmin, fmax){
  return 1 - Math.log(f/fmin) / Math.log(fmax/fmin);
}
