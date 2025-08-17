import React, { useEffect, useMemo, useRef, useState } from "react";

// ==========================
//  TETRIS MODERNO — MÓVIL
//  - Responsive al viewport
//  - Gestos táctiles (swipe/tap)
//  - Controles en pantalla grandess
// ==========================

const COLS = 10;
const ROWS = 20;

const TETROMINOES = {
  I: {
    color: "#2dd4bf",
    shapes: [
      [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
      [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
    ],
  },
  J: {
    color: "#60a5fa",
    shapes: [
      [[1,0,0],[1,1,1],[0,0,0]],
      [[0,1,1],[0,1,0],[0,1,0]],
      [[0,0,0],[1,1,1],[0,0,1]],
      [[0,1,0],[0,1,0],[1,1,0]],
    ],
  },
  L: {
    color: "#f59e0b",
    shapes: [
      [[0,0,1],[1,1,1],[0,0,0]],
      [[0,1,0],[0,1,0],[0,1,1]],
      [[0,0,0],[1,1,1],[1,0,0]],
      [[1,1,0],[0,1,0],[0,1,0]],
    ],
  },
  O: {
    color: "#f472b6",
    shapes: [
      [[1,1],[1,1]],
    ],
  },
  S: {
    color: "#34d399",
    shapes: [
      [[0,1,1],[1,1,0],[0,0,0]],
      [[0,1,0],[0,1,1],[0,0,1]],
    ],
  },
  T: {
    color: "#a78bfa",
    shapes: [
      [[0,1,0],[1,1,1],[0,0,0]],
      [[0,1,0],[0,1,1],[0,1,0]],
      [[0,0,0],[1,1,1],[0,1,0]],
      [[0,1,0],[1,1,0],[0,1,0]],
    ],
  },
  Z: {
    color: "#ef4444",
    shapes: [
      [[1,1,0],[0,1,1],[0,0,0]],
      [[0,0,1],[0,1,1],[0,1,0]],
    ],
  },
};
const TYPES = Object.keys(TETROMINOES);

const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));
const cloneBoard = (b) => b.map((r) => r.slice());

function randomBag(){
  const bag = [...TYPES];
  for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [bag[i],bag[j]]=[bag[j],bag[i]]; }
  return bag;
}
const speedMs = (level) => Math.max(1000 - (level-1)*75, 100);

const getShape = (type, rot) => {
  const s = TETROMINOES[type].shapes; return s[rot % s.length];
};

function collides(board, piece){
  const shape = getShape(piece.type, piece.rot);
  for(let r=0;r<shape.length;r++){
    for(let c=0;c<shape[0].length;c++){
      if(!shape[r][c]) continue;
      const br = piece.y + r, bc = piece.x + c;
      if (bc < 0 || bc >= COLS || br >= ROWS) return true;
      if (br >= 0 && board[br][bc]) return true;
    }
  }
  return false;
}

function merge(board, piece){
  const shape = getShape(piece.type, piece.rot);
  const nb = cloneBoard(board);
  for(let r=0;r<shape.length;r++){
    for(let c=0;c<shape[0].length;c++){
      if(shape[r][c]){
        const br = piece.y + r, bc = piece.x + c;
        if (br >= 0) nb[br][bc] = piece.type;
      }
    }
  }
  return nb;
}

function clearLines(board){
  const left = board.filter(row => row.some(cell => !cell));
  const cleared = ROWS - left.length;
  const nb = Array.from({length: cleared}, () => Array(COLS).fill(null)).concat(left);
  return { nb, cleared };
}

function ghostOf(board, piece){
  const g = { ...piece };
  while(!collides(board, { ...g, y: g.y + 1 })) g.y++;
  return g;
}

function spawnFrom(queue){
  let q = [...queue];
  if(q.length===0) q = randomBag();
  const type = q.shift();
  const piece = { type, x: Math.floor(COLS/2)-2, y: -1, rot: 0 };
  if(q.length < 7) q = q.concat(randomBag());
  return { piece, queue: q };
}

const scoreFor = (n, level) => ([0,100,300,500,800][n]||0)*level;

export default function TetrisMovil(){
  const [board, setBoard] = useState(()=>emptyBoard());
  const [queue, setQueue] = useState(()=>randomBag());
  const [{type,x,y,rot}, setCurrent] = useState(()=>spawnFrom(randomBag()).piece);
  const [hold, setHold] = useState(null);
  const [canHold, setCanHold] = useState(true);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);

  const [boardSize, setBoardSize] = useState({ w: 360, h: 720 });
  useEffect(()=>{
    function resize(){
      const vw = Math.min(window.innerWidth, 800);
      const vh = window.innerHeight;
      const h = Math.min(vh*0.8, 720);
      const w = Math.min(vw*0.9, h*(COLS/ROWS));
      setBoardSize({ w: Math.round(w), h: Math.round(w*(ROWS/COLS)) });
    }
    resize();
    window.addEventListener('resize', resize);
    return ()=>window.removeEventListener('resize', resize);
  },[]);

  useEffect(()=>{ if(collides(board, {type,x,y,rot})) setOver(true); },[]);

  function start(){
    const b = emptyBoard();
    const q = randomBag();
    const { piece, queue: nq } = spawnFrom(q);
    setBoard(b); setQueue(nq); setCurrent(piece); setHold(null); setCanHold(true);
    setScore(0); setLevel(1); setLines(0); setPaused(false); setOver(false);
  }

  function setPiece(p){ setCurrent(p); }
  function move(dx){ if(over||paused) return; const n={type,x:x+dx,y,rot}; if(!collides(board,n)) setPiece(n); }
  function rotate(dir=1){
    if(over||paused) return;
    const n = { type, x, y, rot: rot+dir };
    if(!collides(board,n)) return setPiece(n);
    const kicks=[{x:1,y:0},{x:-1,y:0},{x:2,y:0},{x:-2,y:0}];
    for(const k of kicks){ const alt={...n,x:n.x+k.x,y:n.y+k.y}; if(!collides(board,alt)) return setPiece(alt); }
  }

  function lockAndNext(place){
    const merged = merge(board, place);
    const { nb, cleared } = clearLines(merged);
    if(cleared>0){
      setLines(l=>{ const t=l+cleared; setLevel(1+Math.floor(t/10)); return t; });
      setScore(s=>s+scoreFor(cleared, level));
    }
    const { piece, queue: nq } = spawnFrom(queue);
    setBoard(nb); setCurrent(piece); setQueue(nq); setCanHold(true);
    if(collides(nb, piece)) setOver(true);
  }

  function softDrop(){ if(over||paused) return; const n={type,x,y:y+1,rot}; if(!collides(board,n)){ setPiece(n); setScore(s=>s+1); } else { lockAndNext({type,x,y,rot}); } }
  function hardDrop(){ if(over||paused) return; const g=ghostOf(board,{type,x,y,rot}); setScore(s=>s+(g.y-y)*2); lockAndNext(g); }
  function holdPiece(){ if(over||paused||!canHold) return; if(!hold){ setHold(type); const { piece, queue: nq } = spawnFrom(queue); setCurrent(piece); setQueue(nq); } else { const swapped=hold; setHold(type); const sh=getShape(swapped,0); const np={ type:swapped, x: Math.floor(COLS/2)-Math.ceil(sh[0].length/2), y:-1, rot:0 }; setCurrent(np); } setCanHold(false); }

  useEffect(()=>{ if(over||paused) return; const id = setInterval(()=>softDrop(), speedMs(level)); return ()=>clearInterval(id); },[level,paused,over,board,type,x,y,rot,queue]);

  useEffect(()=>{
    const onKey=(e)=>{
      if(e.repeat) return; const k=e.key;
      if(["ArrowLeft","ArrowRight","ArrowDown","ArrowUp"," ","z","Z","x","X","c","C","p","P","r","R"].includes(k)) e.preventDefault();
      if(k==="ArrowLeft") move(-1);
      else if(k==="ArrowRight") move(1);
      else if(k==="ArrowDown") softDrop();
      else if(k==="ArrowUp"||k==="x"||k==="X") rotate(1);
      else if(k==="z"||k==="Z") rotate(-1);
      else if(k===" ") hardDrop();
      else if(k==="c"||k==="C") holdPiece();
      else if(k==="p"||k==="P") setPaused(p=>!p);
      else if(k==="r"||k==="R") start();
    };
    window.addEventListener('keydown', onKey);
    return ()=>window.removeEventListener('keydown', onKey);
  },[board,type,x,y,rot,paused,over,level,queue,hold,canHold]);

  const touch = useRef({x:0,y:0,t:0});
  function onTouchStart(e){ const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY, t: Date.now() }; }
  function onTouchMove(e){ const t = e.touches[0]; const dx=t.clientX-touch.current.x; const ax=Math.abs(dx); const STEP=24; if(ax>STEP){ const steps=Math.trunc(dx/STEP); for(let i=0;i<Math.abs(steps);i++) move(Math.sign(steps)); touch.current.x=t.clientX; } }
  function onTouchEnd(e){ const dt=Date.now()-touch.current.t; const end=e.changedTouches[0]; const dx=end.clientX-touch.current.x; const dy=end.clientY-touch.current.y; const ax=Math.abs(dx), ay=Math.abs(dy); const SWIPE=40; if(ax<SWIPE && ay<SWIPE && dt<250){ rotate(1); return;} if(ay>ax && dy>SWIPE){ if(dy>120) hardDrop(); else softDrop(); return;} if(ax>ay && ax>SWIPE) move(dx>0?1:-1); }

  const ghost = useMemo(()=>ghostOf(board,{type,x,y,rot}),[board,type,x,y,rot]);

  function cellStyle(t, ghost=false){ if(!t) return { background: "transparent" }; const base = TETROMINOES[t].color; const gradient = `linear-gradient(135deg, ${base} 0%, rgba(255,255,255,0.85) 100%)`; return ghost ? { background: base+"22", border: `1px dashed ${base}55` } : { background: gradient, boxShadow: `inset 0 0 6px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.25)`, border: `1px solid ${base}aa` }; }

  function renderBoard(){
    const temp = cloneBoard(board);
    const shape = getShape(type, rot);
    for(let r=0;r<shape.length;r++) for(let c=0;c<shape[0].length;c++) if(shape[r][c]){ const br = y+r, bc = x+c; if(br>=0&&br<ROWS&&bc>=0&&bc<COLS) temp[br][bc]=type; }
    const ghostMap = new Set();
    const g = getShape(ghost.type, ghost.rot);
    for(let r=0;r<g.length;r++) for(let c=0;c<g[0].length;c++) if(g[r][c]){ const br = ghost.y+r, bc = ghost.x+c; if(br>=0&&br<ROWS&&bc>=0&&bc<COLS) ghostMap.add(`${br}:${bc}`); }
    const cells=[];
    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){ const t = temp[r][c]; const gh = ghostMap.has(`${r}:${c}`) && (!t || (t && r<ghost.y)); cells.push(<div key={`${r}-${c}`} className="cell" style={gh ? cellStyle(type, true) : cellStyle(t)} />); }
    return cells;
  }

  function MiniBox({ t }){
    if(!t) return <div className="mini"/>;
    const s = TETROMINOES[t].shapes[0];
    const N = 4;
    const grid = Array.from({length:N*N}).map((_,i)=>{ const r=Math.floor(i/N), c=i%N; const inside = r<s.length && c<s[0].length ? s[r][c] : 0; return <div key={i} className="cell mini-cell" style={inside?cellStyle(t):{}}/>; });
    return <div className="mini">{grid}</div>;
  }

  const next = queue.slice(0,5);

  return (
    <div className="app">
      <div className="shell">
        <section className="panel">
          <div className="card"><h2>Puntaje</h2><div className="big">{score.toLocaleString()}</div></div>
          <div className="card two-cols">
            <div><div className="label">Nivel</div><div className="mid">{level}</div></div>
            <div><div className="label">Líneas</div><div className="mid">{lines}</div></div>
          </div>
          <div className="card"><h3>Hold</h3><MiniBox t={hold}/></div>
          <div className="card"><h3>Controles</h3><ul className="help"><li>←/→ mover · ↑/Z/X rotar</li><li>↓ caer · Espacio hard drop</li><li>C hold · P pausa · R reiniciar</li><li><strong>Móvil:</strong> swipe ←/→ mover, swipe ↓ caer, tap rotar</li></ul></div>
        </section>
        <section className="board-wrap">
          <div className="board-frame" style={{ width: boardSize.w, height: boardSize.h }}>
            <div className="board" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
              <div className="bg-fx" />
              <div className="grid" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>{renderBoard()}</div>
            </div>
          </div>
          {paused && !over && <Overlay title="Pausado" subtitle="Pulsa P o Reanudar"/>}
          {over && <Overlay title="Game Over" subtitle="Pulsa R para reiniciar"/>}
        </section>
        <section className="panel">
          <div className="card"><h3>Siguientes</h3><div className="next">{next.map((t,i)=>(<div key={i} className="next-box"><MiniBox t={t}/></div>))}</div></div>
          <div className="card touch">
            <div className="row"><button className="btn lg" onClick={()=>move(-1)}>←</button><button className="btn lg" onClick={()=>rotate(1)}>⟳</button><button className="btn lg" onClick={()=>move(1)}>→</button></div>
            <div className="row"><button className="btn xl" onClick={()=>softDrop()}>↓ Caer</button></div>
            <div className="row"><button className="btn md" onClick={()=>holdPiece()}>Hold</button><button className="btn md" onClick={()=>hardDrop()}>Hard</button><button className="btn md" onClick={()=>setPaused(p=>!p)}>{paused?"Reanudar":"Pausar"}</button><button className="btn md" onClick={start}>Reiniciar</button></div>
          </div>
        </section>
      </div>
      <style>{`
        *{box-sizing:border-box}
        .app{min-height:100vh;width:100%;display:flex;align-items:center;justify-content:center;padding:16px;background:linear-gradient(135deg,#0b1220,#0e1628 40%,#0b1220);color:#fff;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif}
        .shell{max-width:1100px;width:100%;display:grid;grid-template-columns:1fr auto 1fr;gap:16px}
        @media (max-width:920px){.shell{grid-template-columns:1fr}}
        .panel{display:flex;flex-direction:column;gap:12px}
        .card{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:14px;box-shadow:0 10px 30px rgba(0,0,0,.25);backdrop-filter:blur(6px)}
        h2{margin:0 0 6px;font-size:18px;font-weight:700}
        h3{margin:0 0 10px;font-size:16px;font-weight:700}
        .big{font-size:34px;font-weight:800;letter-spacing:-.02em}
        .mid{font-size:24px;font-weight:700}
        .label{opacity:.85;font-size:13px}
        .two-cols{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .help{margin:0;padding-left:18px;opacity:.9;font-size:13px}
        .board-wrap{position:relative;display:flex;align-items:center;justify-content:center}
        .board-frame{border-radius:20px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.12);padding:10px;box-shadow:0 20px 40px rgba(0,0,0,.35)}
        .board{position:relative;width:100%;height:100%;border-radius:16px;overflow:hidden;background:rgba(0,0,0,.35)}
        .bg-fx{position:absolute;inset:0;background:radial-gradient(circle at 20% 10%, rgba(255,255,255,.08), transparent 45%), radial-gradient(circle at 80% 90%, rgba(255,255,255,.06), transparent 45%)}
        .grid{position:relative;display:grid;gap:4px;width:100%;height:100%;padding:8px}
        .cell{border-radius:6px;border:1px solid rgba(255,255,255,.08);background:#0b0f17}
        .next{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
        .next-box{aspect-ratio:1/1}
        .mini{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:8px;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.1);border-radius:12px;width:100%;height:100%}
        .mini-cell{border-radius:5px}
        .touch .row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:8px}
        .touch .row:last-child{grid-template-columns:repeat(4,1fr);margin-bottom:0}
        .btn{appearance:none;border:none;cursor:pointer;color:#fff;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.16);border-radius:14px;padding:10px 12px;font-weight:700;box-shadow:0 8px 20px rgba(0,0,0,.25);transition:transform .06s ease,background .2s ease}
        .btn:active{transform:scale(.98)}
        .btn.lg{font-size:22px;padding:12px 0}
        .btn.xl{font-size:20px;padding:14px 0}
        .btn.md{font-size:14px;padding:10px 0}
        @media (max-width:920px){.card.touch{position:sticky;bottom:10px;z-index:3}}
      `}</style>
    </div>
  );
}

function Overlay({ title, subtitle }){
  return (
    <div className="overlay">
      <div className="overlay-box">
        <div className="overlay-title">{title}</div>
        <div className="overlay-sub">{subtitle}</div>
      </div>
      <style>{`
        .overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none}
        .overlay-box{pointer-events:auto;padding:20px 26px;border-radius:16px;background:rgba(0,0,0,.7);border:1px solid rgba(255,255,255,.12);box-shadow:0 20px 40px rgba(0,0,0,.5);text-align:center}
        .overlay-title{font-size:28px;font-weight:900;margin-bottom:6px}
        .overlay-sub{opacity:.9}
      `}</style>
    </div>
  );
}
