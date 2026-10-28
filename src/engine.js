// Pure game rules. No browser APIs, so procedural maps can be tested in Node.
export const LEVELS = [
  { name: 'A light in the woods', size: 7, subtitle: 'Every journey begins with one small step.', intro: 'Find your way home. The lantern reveals nearby tiles, but the forest disappears behind you.', snakes: 0 },
  { name: 'Something in the grass', size: 9, subtitle: 'A little courage goes a long way.', intro: 'Find the sword before crossing a snake. Once found, your sword lasts for the whole chapter.', snakes: 2 },
  { name: 'The winding woodland', size: 11, subtitle: 'Trust the paths you remember.', intro: 'The woods are getting wider. Remember the turns, and leave a pebble at a tricky junction.', snakes: 3 },
  { name: 'The missing house key', size: 13, subtitle: 'Home is close. The key is somewhere out there.', intro: 'Your door is locked tonight. Find the golden key before you head home.', snakes: 4, key: true },
  { name: 'Beneath the old pines', size: 15, subtitle: 'Even the tallest trees have a way through.', intro: 'Take your time. Collect fireflies, keep your bearings, and find the key.', snakes: 5, key: true },
  { name: 'A tangle of thorns', size: 17, subtitle: 'Some paths need a little clearing.', intro: 'Thorny brambles block some paths. Your sword clears them, too. Without it, they stop you safely.', snakes: 6, key: true, brambles: 3 },
  { name: 'The very quiet forest', size: 19, subtitle: 'A small light. A very big adventure.', intro: 'A longer walk, a few more snakes, and one warm window waiting at the end.', snakes: 8, key: true, brambles: 4 },
  { name: 'The long way home', size: 21, subtitle: 'You know the way. One step at a time.', intro: 'Your final chapter. Remember your turns, find your sword and key, and bring your little light home.', snakes: 10, key: true, brambles: 5 }
];
export const DIRS = [[0,-1],[1,0],[0,1],[-1,0]];
export const keyOf = (x,y) => `${x},${y}`;
export function random(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function shuffle(items, rng) {
  const a = [...items];
  for (let i=a.length-1;i>0;i--) { const j=Math.floor(rng()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
export function shortestPath(map, start={x:0,y:0}, end={x:map.size-1,y:map.size-1}) {
  const queue=[start], prev=new Map([[keyOf(start.x,start.y),null]]);
  for(let i=0;i<queue.length;i++) {
    const p=queue[i]; if(p.x===end.x && p.y===end.y) break;
    for(const [dx,dy] of DIRS) { const x=p.x+dx,y=p.y+dy,k=keyOf(x,y);
      if(x<0||y<0||x>=map.size||y>=map.size||map.grid[y][x]||prev.has(k)) continue;
      prev.set(k,p); queue.push({x,y});
    }
  }
  if(!prev.has(keyOf(end.x,end.y))) return [];
  const path=[]; let p=end;
  while(p) { path.push(p); p=prev.get(keyOf(p.x,p.y)); }
  return path.reverse();
}
export function generateLevel(index, seed) {
  const config=LEVELS[index]; if(!config) throw new RangeError('Unknown chapter');
  const rng=random(seed+index*7919), size=config.size;
  const grid=Array.from({length:size},()=>Array(size).fill(1)), stack=[{x:0,y:0}];
  grid[0][0]=0;
  while(stack.length) {
    const p=stack.at(-1);
    const choices=shuffle(DIRS,rng).map(([dx,dy])=>({x:p.x+dx*2,y:p.y+dy*2,dx,dy})).filter(q=>q.x>=0&&q.y>=0&&q.x<size&&q.y<size&&grid[q.y][q.x]);
    if(!choices.length) { stack.pop(); continue; }
    const q=choices[0]; grid[p.y+q.dy][p.x+q.dx]=0; grid[q.y][q.x]=0; stack.push(q);
  }
  // A few loops give the player choices without removing the maze's shape.
  for(let y=1;y<size-1;y++) for(let x=1;x<size-1;x++) {
    if(grid[y][x] && x%2!==y%2 && rng()<0.055) grid[y][x]=0;
  }
  const map={size,grid,items:{},index,seed};
  const path=shortestPath(map), occupied=new Set(['0,0',keyOf(size-1,size-1)]);
  const put=(p,type)=>{const k=keyOf(p.x,p.y); map.items[k]=type;occupied.add(k);};
  if(config.snakes) {
    // The first sword is on the safe starting stretch, before any danger.
    const swordIndex=Math.max(2,Math.floor(path.length*0.17));
    put(path[swordIndex],'sword');
    const danger=shuffle(path.slice(swordIndex+2,-1),rng);
    danger.slice(0,config.snakes).forEach(p=>put(p,'snake'));
    const extras=[];
    for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
      if(!grid[y][x]&&!occupied.has(keyOf(x,y))&&shortestPath(map,{x:0,y:0},{x,y}).length>swordIndex+2) extras.push({x,y});
    }
    const extra=shuffle(extras,rng);
    while(Object.values(map.items).filter(i=>i==='snake').length<config.snakes && extra.length) put(extra.pop(),'snake');
  }
  let free=[];
  for(let y=0;y<size;y++) for(let x=0;x<size;x++) if(!grid[y][x]&&!occupied.has(keyOf(x,y))) free.push({x,y});
  free=shuffle(free,rng);
  if(config.key) {
    // The key must be reachable without passing through the locked home tile.
    const beforeHome={size,grid:grid.map(row=>[...row])};beforeHome.grid[size-1][size-1]=1;
    const keyIndex=free.findIndex(p=>shortestPath(beforeHome,{x:0,y:0},p).length>0);
    put(free.splice(keyIndex,1)[0],'key');
  }
  if(config.brambles) {
    const sword=Object.entries(map.items).find(([,type])=>type==='sword')[0].split(',').map(Number);
    const safeDistance=shortestPath(map,{x:0,y:0},{x:sword[0],y:sword[1]}).length;
    const eligible=free.filter(p=>shortestPath(map,{x:0,y:0},p).length>safeDistance+1);
    for(const p of eligible.slice(0,config.brambles)) put(p,'bramble');
    free=free.filter(p=>!occupied.has(keyOf(p.x,p.y)));
  }
  for(let i=0;i<Math.min(3+index,8)&&free.length;i++) put(free.pop(),'firefly');
  return map;
}
export function createGame(index=0,seed=Date.now()>>>0) {
  const map=generateLevel(index,seed);
  return {...map,player:{x:0,y:0},status:'playing',sword:false,hasKey:false,steps:0,fireflies:0,defeated:0,pebbles:5,markers:[],visited:new Set(['0,0']),message:LEVELS[index].intro,event:'start'};
}
export function move(game,dx,dy) {
  if(game.status!=='playing'||Math.abs(dx)+Math.abs(dy)!==1) return 'ignored';
  const x=game.player.x+dx,y=game.player.y+dy;
  if(x<0||y<0||x>=game.size||y>=game.size||game.grid[y][x]) {game.message='An old stone wall. Try another way.';return game.event='wall';}
  const k=keyOf(x,y),item=game.items[k];
  if(item==='bramble'&&!game.sword) {game.message='Thorny brambles. Find a sword to clear this path.';return game.event='bramble-block';}
  if(x===game.size-1&&y===game.size-1&&LEVELS[game.index].key&&!game.hasKey) {game.message='Home! But the door is locked. Find the golden key.';return game.event='locked';}
  game.player={x,y};game.steps++;game.visited.add(k);game.event='step';
  game.message='Keep your light close. Remember your turns.';
  if(item==='snake') {
    if(!game.sword) {game.status='lost';game.message='A snake caught you without a sword. Take a breath and try again.';return game.event='lost';}
    delete game.items[k];game.defeated++;game.message='A brave little swing! The path is safe now.';game.event='fight';
  } else if(item==='sword') {game.sword=true;delete game.items[k];game.message='Sword found! You can now defeat snakes and clear brambles.';game.event='sword';}
  else if(item==='key') {game.hasKey=true;delete game.items[k];game.message='The house key! A warm bed is waiting for you.';game.event='key';}
  else if(item==='firefly') {game.fireflies++;delete game.items[k];game.message='A firefly joins your journey. A little company in the dark.';game.event='firefly';}
  else if(item==='bramble') {delete game.items[k];game.message='You cleared the brambles. Onward, little explorer.';game.event='clear';}
  if(x===game.size-1&&y===game.size-1) {game.status='won';game.message='You made it home. The forest can wait until tomorrow.';game.event='won';}
  return game.event;
}
export function dropPebble(game) {
  if(game.status!=='playing') return false;
  const k=keyOf(game.player.x,game.player.y),i=game.markers.indexOf(k);
  if(i>=0) {game.markers.splice(i,1);game.pebbles++;game.message='Pebble picked up.';return true;}
  if(!game.pebbles) {game.message='All five pebbles are placed. Pick one up to use it again.';return false;}
  game.markers.push(k);game.pebbles--;game.message='A pebble to remember this place. It is visible only nearby.';return true;
}
export function isVisible(game,x,y) {
  const {x:px,y:py}=game.player;
  if(Math.hypot(x-px,y-py)>2.65) return false;
  // Bresenham line of sight: walls are lit, but conceal what lies behind them.
  let cx=px,cy=py,dx=Math.abs(x-px),dy=-Math.abs(y-py),sx=px<x?1:-1,sy=py<y?1:-1,err=dx+dy;
  while(cx!==x||cy!==y) {
    const e=2*err;if(e>=dy){err+=dy;cx+=sx;}if(e<=dx){err+=dx;cy+=sy;}
    if(cx===x&&cy===y) return true;
    if(game.grid[cy][cx]) return false;
  }
  return true;
}
export function saveProgress(storage,value) {try{storage.setItem('little-lantern-v1',JSON.stringify(value));}catch{/* Playable when storage is blocked. */}}
export function loadProgress(storage) {
  try {const p=JSON.parse(storage.getItem('little-lantern-v1'));if(p&&Number.isInteger(p.seed)&&Number.isInteger(p.unlocked)&&p.unlocked>=0&&p.unlocked<LEVELS.length&&Number.isInteger(p.level)&&p.level>=0&&p.level<=p.unlocked) return p;}catch{}
  return null;
}
