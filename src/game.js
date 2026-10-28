import {LEVELS,createGame,move,dropPebble,isVisible,keyOf,loadProgress,saveProgress} from './engine.js';

const paths={
  lantern:'<path d="M9 6V4a3 3 0 0 1 6 0v2M7 8h10l2 12H5zM7 6h10M5 21h14M12 11c-1 3-3 4-2 6 1 2 4 1 4-1 0-2-1-3-2-5Z"/>',
  sword:'<path d="m15 3 5-1-1 5L8 18l-3-3ZM4 12l8 8M2 22l5-5M2 18l4 4"/>',
  key:'<circle cx="8" cy="8" r="5"/><path d="m12 12 9 9m-3-3 3-3m-6 0 3-3"/>',
  home:'<path d="m2 10 10-8 10 8M5 9v12h14V9M10 21v-7h4v7M15 10h1"/>',
  pause:'<path d="M8 5v14M16 5v14"/>',
  restart:'<path d="M3 10a9 9 0 1 1 0 5M3 4v6h6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  steps:'<path d="M8 3C4 2 1 8 4 12c2 2 5 1 6-2s1-6-2-7ZM5 16l4-1 1 5-4 1ZM17 8c4-1 6 5 3 9-2 2-5 0-5-3s0-5 2-6ZM15 21l4 1"/>',
  firefly:'<path d="M12 11c-7-11-13 1-2 2M14 11c7-11 13 1 2 2M12 12v9M9 17h6M10 3l2 3 2-3"/><circle cx="12" cy="14" r="3"/>',
  pebble:'<path d="M3 15c-2-4 1-6 5-9s7-1 11 4 3 8-4 9S5 19 3 15ZM6 13l5-4 5 3"/>',
  backpack:'<path d="M8 6V4a4 4 0 0 1 8 0v2M7 6h10a3 3 0 0 1 3 3v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a3 3 0 0 1 3-3ZM8 13h8v5H8zM2 12v7M22 12v7"/>',
  sound:'<path d="M3 9h4l5-5v16l-5-5H3ZM16 8a6 6 0 0 1 0 8M19 4a11 11 0 0 1 0 16"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9 8a3 3 0 0 1 6 0c0 3-3 3-3 6M12 17v1"/>',
  github:'<path d="M9 21c-5 1-5-2-7-2m14 3v-4c0-1-.3-2-1-2 4-.5 7-2 7-6a5 5 0 0 0-1-3 5 5 0 0 0-.1-4s-1 0-4 2a14 14 0 0 0-8 0C6 3 5 3 5 3a5 5 0 0 0-.1 4 5 5 0 0 0-1 3c0 4 3 5.5 7 6-1 1-1 2-1 3v3"/>'
};
document.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[el.dataset.icon]||''}</svg>`;});
const $=id=>document.getElementById(id),canvas=$('board'),ctx=canvas.getContext('2d');
let storage;try{storage=window.localStorage;}catch{storage={getItem:()=>null,setItem:()=>{}};}
let progress=loadProgress(storage)||{level:0,unlocked:0,seed:Math.floor(Math.random()*4294967295)};
let game=createGame(progress.level,progress.seed),started=false,paused=false,overlayMode='welcome',elapsed=0,lastTime=0,lastPaint=0;
let visual={x:0,y:0},sound=false,audio=null,wasPaused=false;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const words=['ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT'];
const notes=[['The dark is part<br>of the adventure.','Only nearby tiles are visible. Look closely, remember your turns, and trust your little light.'],['A little sword.<br>A little courage.','Snakes are dangerous without a sword. Find it first, then step onto a snake to clear the way.'],['Some turns are<br>worth remembering.','A pebble at a junction can help you find your bearings. Press B to leave one or pick it up.'],['Home needs<br>its little key.','Look for the golden house key. You’ll need it to open the door at the end of the maze.'],['There’s no need<br>to hurry home.','The lantern never runs out. Explore at your own pace; the fireflies are a lovely bonus.'],['A way through<br>the wild things.','Brambles stop you, but don’t hurt you. Find your sword to clear them from the path.'],['Keep a turn<br>in your pocket.','Retrace a familiar route when you feel lost. Your pebbles are waiting where you left them.'],['You’ve carried<br>your light so far.','The forest is at its biggest. Remember one junction at a time. Home is always in the far corner.']];

function persist(){progress.level=game.index;saveProgress(storage,progress);}
function chime(kind){
  if(!sound)return;
  try{audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume();const t=audio.currentTime;const frequencies=kind==='won'?[392,494,587,784]:kind==='lost'?[220,165]:kind==='step'?[150]:kind==='wall'?[90]:[440,660];frequencies.forEach((hz,i)=>{const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.type='sine';oscillator.frequency.value=hz;gain.gain.setValueAtTime(0,t+i*.1);gain.gain.linearRampToValueAtTime(kind==='step'?.015:.055,t+i*.1+.01);gain.gain.exponentialRampToValueAtTime(.001,t+i*.1+.22);oscillator.connect(gain);gain.connect(audio.destination);oscillator.start(t+i*.1);oscillator.stop(t+i*.1+.25);});}catch{sound=false;updateSound();}
}
function updateSound(){$('sound').setAttribute('aria-pressed',String(sound));$('sound-label').textContent=`Sound ${sound?'on':'off'}`;}
function updateUI(){
  const config=LEVELS[game.index];
  $('chapter-badge').textContent=String(game.index+1).padStart(2,'0');$('chapter-kicker').textContent=`CHAPTER ${words[game.index]}`;$('chapter-title').textContent=config.name;$('map-size').textContent=`${game.size} × ${game.size}`;
  $('steps').textContent=game.steps;$('fireflies').textContent=`${game.fireflies} / ${Math.min(3+game.index,8)}`;$('message').textContent=game.message;
  $('sword-item').classList.toggle('equipped',game.sword);$('sword-state').textContent=game.sword?'Ready for little battles':game.index?'Find it in the woods':'Appears in chapter 2';$('sword-badge').textContent=game.sword?'READY':'—';
  $('key-item').classList.toggle('equipped',game.hasKey);$('key-state').textContent=game.hasKey?'Home is ready for you':config.key?'Somewhere in the woods':'Not needed yet';$('key-badge').textContent=game.hasKey?'FOUND':'—';
  $('pebble-count').textContent=`${game.pebbles} pebble${game.pebbles===1?'':'s'}`;$('note-number').textContent=`FIELD NOTE / ${String(game.index+1).padStart(2,'0')}`;
  $('note-title').innerHTML=notes[game.index][0];$('chapter-hint').textContent=notes[game.index][1];$('progress-label').textContent=`${game.index+1} / 8`;
  $('chapters').replaceChildren(...LEVELS.map((level,i)=>{const b=document.createElement('button');b.className=`chapter-button${i===game.index?' current':''}`;b.textContent=String(i+1).padStart(2,'0');b.disabled=i>progress.unlocked;b.title=i>progress.unlocked?'Complete the previous chapter to unlock':level.name;b.setAttribute('aria-label',`Chapter ${i+1}: ${level.name}${i>progress.unlocked?' (locked)':''}`);if(i===game.index)b.setAttribute('aria-current','step');b.onclick=()=>startChapter(i);return b;}));
  $('pause').disabled=!started||game.status!=='playing';
}
function showOverlay(mode){
  overlayMode=mode;$('overlay').hidden=false;$('secondary').hidden=true;$('result-stats').hidden=true;$('overlay-note').textContent='ARROW KEYS / WASD TO MOVE';
  const content={welcome:['YOUR ADVENTURE AWAITS','Let’s get you home.','A lantern, a little courage, and a path only you can remember.','Begin adventure'],paused:['TAKE A LITTLE BREATHER','The woods can wait.','Your lantern is still glowing. Pick up right where you left off.','Keep exploring'],lost:['A LITTLE SETBACK','Even brave kids stumble.','A snake caught you without a sword. The same path is waiting — remember what you learned.','Try again'],won:['A WARM WINDOW. A FAMILIAR DOOR.',game.index===7?'You brought your light home.':'Home, sweet home.',game.index===7?'Eight chapters. So many brave little steps. Every small light can find a way.':LEVELS[Math.min(game.index+1,7)].intro,game.index===7?'Play this chapter again':'On to the next chapter'],new:['A FRESH START','Another path awaits.','This resets your unlocked chapters and creates a whole new set of mazes.','Start a new journey']}[mode];
  $('overlay-eyebrow').textContent=content[0];$('overlay-title').textContent=content[1];$('overlay-copy').textContent=content[2];$('primary').innerHTML=`${content[3]} <span>↗</span>`;
  if(mode==='won'){$('result-stats').hidden=false;$('result-stats').textContent=`${game.steps} steps · ${game.fireflies} fireflies · ${formatTime(elapsed)}`;$('secondary').hidden=false;$('overlay-note').textContent=game.index===7?'YOUR ADVENTURE IS COMPLETE':`NEXT: ${LEVELS[game.index+1].size} × ${LEVELS[game.index+1].size} WOODLAND`;}
  if(mode==='new'){$('secondary').hidden=false;$('secondary').textContent='Keep my current journey';}else{$('secondary').textContent='Try this chapter again';}
}
function hideOverlay(){overlayMode=null;$('overlay').hidden=true;canvas.focus({preventScroll:true});}
function startChapter(index){game=createGame(index,progress.seed);visual={...game.player};elapsed=0;started=true;paused=false;hideOverlay();persist();updateUI();}
function setPaused(value){if(!started||game.status!=='playing')return;paused=value;if(value)showOverlay('paused');else hideOverlay();}
function step(dx,dy){if(!started||paused||overlayMode||$('help-dialog').open)return;const event=move(game,dx,dy);if(event==='ignored')return;chime(event);if(['wall','bramble-block','locked'].includes(event)&&!reducedMotion){$('board-wrap').classList.remove('bump');void $('board-wrap').offsetWidth;$('board-wrap').classList.add('bump');}
  if(game.status==='won'){progress.unlocked=Math.max(progress.unlocked,Math.min(game.index+1,7));persist();showOverlay('won');}else if(game.status==='lost')showOverlay('lost');updateUI();}
function pebble(){if(started&&!paused&&!overlayMode&&!$('help-dialog').open){dropPebble(game);updateUI();}}
$('primary').onclick=()=>{if(overlayMode==='welcome'){started=true;hideOverlay();persist();updateUI();chime('start');}else if(overlayMode==='paused'){setPaused(false);}else if(overlayMode==='lost'){startChapter(game.index);}else if(overlayMode==='won'){startChapter(Math.min(game.index+1,7));}else if(overlayMode==='new'){progress={level:0,unlocked:0,seed:Math.floor(Math.random()*4294967295)};startChapter(0);}};
$('secondary').onclick=()=>{if(overlayMode==='new'){paused=wasPaused;if(!started)showOverlay('welcome');else if(game.status==='won')showOverlay('won');else if(game.status==='lost')showOverlay('lost');else if(paused)showOverlay('paused');else hideOverlay();}else startChapter(game.index);};
$('pause').onclick=()=>{if(overlayMode&&overlayMode!=='paused')return;setPaused(!paused);};
$('restart').onclick=()=>startChapter(game.index);
$('new-journey').onclick=()=>{wasPaused=paused;paused=true;showOverlay('new');};
$('pebble').onclick=pebble;
$('sound').onclick=()=>{sound=!sound;updateSound();if(sound)chime('start');};
function openHelp(){wasPaused=paused;paused=true;$('help-dialog').showModal();}
function closeHelp(){$('help-dialog').close();}
$('help').onclick=openHelp;$('close-help').onclick=closeHelp;$('help-done').onclick=closeHelp;
$('help-dialog').addEventListener('close',()=>{paused=wasPaused;});
document.querySelectorAll('[data-move]').forEach(button=>button.addEventListener('click',()=>step(...button.dataset.move.split(',').map(Number))));
const keyMoves={ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]};
document.addEventListener('keydown',event=>{if($('help-dialog').open||event.altKey||event.ctrlKey||event.metaKey)return;const key=event.key.length===1?event.key.toLowerCase():event.key;if(keyMoves[key]){if(['BUTTON','A'].includes(document.activeElement.tagName)&&['Enter',' '].includes(key))return;event.preventDefault();step(...keyMoves[key]);}else if(key==='b'){event.preventDefault();pebble();}else if(key==='p'||key==='Escape'){if(overlayMode&&overlayMode!=='paused')return;event.preventDefault();setPaused(!paused);}});
let swipe=null;canvas.addEventListener('pointerdown',e=>{swipe={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointerup',e=>{if(!swipe)return;const dx=e.clientX-swipe.x,dy=e.clientY-swipe.y;swipe=null;if(Math.max(Math.abs(dx),Math.abs(dy))<16)return;step(...(Math.abs(dx)>Math.abs(dy)?[Math.sign(dx),0]:[0,Math.sign(dy)]));});canvas.addEventListener('pointercancel',()=>{swipe=null;});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!$('help-dialog').open&&started&&!overlayMode)setPaused(true);});
window.addEventListener('blur',()=>{if(started&&!overlayMode&&!$('help-dialog').open)setPaused(true);});

// All artwork is drawn here; no image downloads or sprite dependencies.
function rr(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}}
function ellipse(x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
function line(points,color,width=2){ctx.beginPath();ctx.moveTo(...points[0]);points.slice(1).forEach(p=>ctx.lineTo(...p));ctx.lineWidth=width;ctx.strokeStyle=color;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();}
function drawLantern(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);const glow=ctx.createRadialGradient(0,1,1,0,1,19);glow.addColorStop(0,'#ffcf7b99');glow.addColorStop(1,'#ffca6c00');ctx.fillStyle=glow;ctx.fillRect(-20,-20,40,40);line([[-4,-5],[-4,-9],[4,-9],[4,-5]],'#685036',2);rr(-6,-5,12,15,2,'#e7a74e','#735131');rr(-3,-3,6,10,1,'#ffe59b');line([[-7,-5],[7,-5]],'#805637',2);line([[-7,10],[7,10]],'#805637',2);ctx.restore();}
function kid(x,y,s,t){ctx.save();ctx.translate(x,y);ctx.scale(s,s);const bob=reducedMotion?0:Math.sin(t*.002)*.7;ctx.translate(0,bob);ellipse(0,18,15,5,'#08100d66');rr(-11,9,9,10,4,'#604935');rr(2,9,9,10,4,'#604935');rr(-11,2,22,14,5,'#6d8b69');line([[-8,5],[-14,10]],'#78936c',6);line([[9,5],[16,8]],'#78936c',6);ellipse(-1,-7,13,14,'#edbf94');ellipse(-11,-5,3,4,'#edbf94');ellipse(11,-5,3,4,'#edbf94');ctx.fillStyle='#644a36';ctx.beginPath();ctx.moveTo(-13,-6);ctx.bezierCurveTo(-20,-28,17,-31,13,-8);ctx.lineTo(8,-15);ctx.lineTo(3,-12);ctx.lineTo(-2,-17);ctx.lineTo(-9,-13);ctx.closePath();ctx.fill();ellipse(-5,-5,1.2,1.7,'#3d3b2a');ellipse(5,-5,1.2,1.7,'#3d3b2a');ellipse(-8,-1,2.7,1.5,'#dd9874aa');ellipse(8,-1,2.7,1.5,'#dd9874aa');line([[-2,0],[0,1],[2,0]],'#8c654b',1);rr(-11,3,21,5,2,'#c87a59');line([[5,6],[9,14]],'#c87a59',4);drawLantern(20,14,.75);ctx.restore();}
function home(x,y,s,t){ctx.save();ctx.translate(x,y);ctx.scale(s,s);const glow=ctx.createRadialGradient(0,1,3,0,1,31);glow.addColorStop(0,'#e9b65833');glow.addColorStop(1,'#e9b65800');ctx.fillStyle=glow;ctx.fillRect(-33,-33,66,66);ellipse(0,19,23,5,'#091b1566');rr(-17,-1,34,24,2,'#b8bd8b');rr(7,-23,6,16,1,'#8c7451');ctx.beginPath();ctx.moveTo(-24,1);ctx.lineTo(0,-24);ctx.lineTo(24,1);ctx.closePath();ctx.fillStyle='#ba7755';ctx.fill();line([[-24,1],[0,-24],[24,1]],'#d18d61',2);rr(-4,8,10,15,3,'#5a6043');ellipse(3,16,1,1,'#e6c275');rr(-12,7,7,8,1,'#ffe4a0');rr(9,7,6,8,1,'#ffe4a0');line([[-9,7],[-9,15]],'#9c8558',1);ctx.restore();}
function item(type,x,y,s,t){ctx.save();ctx.translate(x,y);ctx.scale(s,s);if(type==='sword'){ctx.rotate(.6);rr(-3,-18,6,29,1,'#d4e4d2','#82948a');line([[-10,8],[10,8]],'#d3ad64',4);rr(-3,10,6,10,1,'#8d6042');ellipse(0,22,4,3,'#d3ad64');}else if(type==='snake'){ellipse(0,15,19,5,'#0e1e1466');ctx.beginPath();ctx.moveTo(-13,12);ctx.bezierCurveTo(22,22,15,-1,0,4);ctx.bezierCurveTo(-12,8,-10,-7,5,-7);ctx.strokeStyle='#91ad68';ctx.lineWidth=8;ctx.lineCap='round';ctx.stroke();ellipse(9,-8,9,6,'#abc97c');ellipse(12,-10,1.3,1.5,'#263d27');line([[17,-7],[23,-7],[25,-9]],'#ce8d78',1.5);line([[23,-7],[25,-5]],'#ce8d78',1.5);}else if(type==='key'){ctx.rotate(-.5);ctx.beginPath();ctx.arc(0,-9,7,0,Math.PI*2);ctx.lineWidth=4;ctx.strokeStyle='#ebc46d';ctx.stroke();line([[0,-2],[0,18],[6,18],[6,14]],'#ebc46d',4);line([[0,9],[5,9]],'#ebc46d',3);}else if(type==='firefly'){const pulse=reducedMotion?.8:.6+Math.sin(t*.004+x)*.3;const g=ctx.createRadialGradient(0,0,1,0,0,20);g.addColorStop(0,`rgba(241,222,130,${pulse})`);g.addColorStop(1,'#efdf8800');ctx.fillStyle=g;ctx.fillRect(-20,-20,40,40);ellipse(-5,-3,5,3,'#d8d9ae88');ellipse(5,-3,5,3,'#d8d9ae88');ellipse(0,2,3,5,'#f3de8d');}else if(type==='bramble'){for(let i=-1;i<=1;i++){line([[-19,i*9-4],[0,i*5+7],[19,i*9-6]],'#77814d',4);line([[i*13,-15],[i*7,15]],'#8d9458',3);}line([[-10,-2],[-13,-10],[0,8],[5,16],[10,-5],[17,-13]],'#b0ab70',2);}ctx.restore();}
function draw(t,dt){
  const n=game.size,c=900/n;ctx.clearRect(0,0,900,900);ctx.fillStyle='#152b22';ctx.fillRect(0,0,900,900);
  const smoothing=reducedMotion?1:1-Math.exp(-dt/47);visual.x+=(game.player.x-visual.x)*smoothing;visual.y+=(game.player.y-visual.y)*smoothing;
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const px=x*c,py=y*c,h=((x*193+y*173+game.seed)%97)/97,lit=isVisible(game,x,y);
    if(!lit){rr(px+1,py+1,c-2,c-2,3,h>.5?'#182e24':'#172c23');ctx.fillStyle='#6b85580d';ctx.beginPath();ctx.arc(px+c*.5,py+c*.5,c*.025,0,Math.PI*2);ctx.fill();continue;}
    const distance=Math.hypot(x-game.player.x,y-game.player.y);
    if(game.grid[y][x]){rr(px+2,py+4,c-4,c-6,Math.min(8,c*.09),'#526049','#758164');rr(px+4,py+4,c-8,c*.17,3,'#75805b');line([[px+c*.05,py+c*.52],[px+c*.95,py+c*.52]],'#43513d',c*.025);line([[px+c*.43,py+c*.23],[px+c*.43,py+c*.52]],'#43513d',c*.025);line([[px+c*.7,py+c*.52],[px+c*.7,py+c*.91]],'#43513d',c*.025);ellipse(px+c*.2,py+c*.16,c*.1,c*.035,'#93a16b');}else{rr(px+1,py+1,c-2,c-2,3,h>.55?'#65704a':'#5e6946');ctx.fillStyle='#d2bd762f';ctx.fillRect(px+c*(.2+h*.4),py+c*.74,c*.07,c*.025);ctx.fillRect(px+c*.3,py+c*.28,c*.04,c*.03);}
    if(game.markers.includes(keyOf(x,y))){ellipse(px+c*.65,py+c*.7,c*.08,c*.055,'#d0d1b5');ellipse(px+c*.65,py+c*.68,c*.055,c*.03,'#e4e1c2');}
    const it=game.items[keyOf(x,y)];if(it)item(it,px+c*.5,py+c*.53,c/65,t);
    if(distance>1.3){ctx.fillStyle=`rgba(14,31,23,${Math.min(.68,(distance-1.3)*.31)})`;ctx.fillRect(px+1,py+1,c-2,c-2);}
  }
  const glow=ctx.createRadialGradient((visual.x+.5)*c,(visual.y+.5)*c,0,(visual.x+.5)*c,(visual.y+.5)*c,c*2.2);glow.addColorStop(0,'#f4cf7022');glow.addColorStop(1,'#f4cf7000');ctx.fillStyle=glow;ctx.fillRect(0,0,900,900);
  home((n-.5)*c,(n-.5)*c,c/66,t);
  kid((visual.x+.5)*c,(visual.y+.5)*c,c/64,t);
  if(game.status==='lost'){ctx.fillStyle='#a64a3325';ctx.fillRect(0,0,900,900);}
}
function formatTime(ms){const seconds=Math.floor(ms/1000);return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;}
function frame(time){const dt=lastTime?Math.min(time-lastTime,100):0;lastTime=time;if(started&&!paused&&!overlayMode&&game.status==='playing')elapsed+=dt;if(time-lastPaint>30){draw(time,Math.min(time-lastPaint,100));lastPaint=time;$('timer').textContent=formatTime(elapsed);}requestAnimationFrame(frame);}
updateUI();if(progress.unlocked>0){$('primary').innerHTML='Continue adventure <span>↗</span>';$('overlay-copy').textContent=`Your light is waiting in chapter ${game.index+1}. Let’s find the way home.`;}requestAnimationFrame(frame);
