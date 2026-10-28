import test from 'node:test';
import assert from 'node:assert/strict';
import {LEVELS,DIRS,createGame,move,isVisible,dropPebble,keyOf,loadProgress,saveProgress} from '../src/engine.js';

function solve(game){
  const queue=[{x:0,y:0,sword:false,key:false,prev:-1,dir:null}],seen=new Set(['0,0,false,false']);
  for(let i=0;i<queue.length;i++){
    const p=queue[i];
    if(p.x===game.size-1&&p.y===game.size-1&&(!LEVELS[game.index].key||p.key)){
      const path=[];let j=i;while(queue[j].prev!==-1){path.push(queue[j].dir);j=queue[j].prev;}return path.reverse();
    }
    for(const [dx,dy] of DIRS){
      const x=p.x+dx,y=p.y+dy;
      if(x<0||y<0||x>=game.size||y>=game.size||game.grid[y][x])continue;
      const item=game.items[keyOf(x,y)];if((item==='snake'||item==='bramble')&&!p.sword)continue;
      if(x===game.size-1&&y===game.size-1&&LEVELS[game.index].key&&!p.key)continue;
      const next={x,y,sword:p.sword||item==='sword',key:p.key||item==='key',prev:i,dir:[dx,dy]},k=`${x},${y},${next.sword},${next.key}`;
      if(!seen.has(k)){seen.add(k);queue.push(next);}
    }
  }
  return null;
}
test('every chapter can be won, with correct inventory order, across 200 generated maps',()=>{
  for(let level=0;level<LEVELS.length;level++)for(let seed=1;seed<=25;seed++){
    const g=createGame(level,seed*27319),path=solve(g);
    assert.ok(path,`Unsolvable chapter ${level+1}, seed ${seed}`);
    for(const direction of path){move(g,...direction);assert.notEqual(g.status,'lost');}
    assert.equal(g.status,'won');assert.equal(g.player.x,g.size-1);assert.equal(g.player.y,g.size-1);
  }
});
function fixture(item){return {...createGame(1,1),size:3,grid:[[0,0,0],[0,1,0],[0,0,0]],items:item?{'1,0':item}:{},player:{x:0,y:0}};}
test('snake is fatal without sword and is removed with a reusable sword',()=>{
  const bare=fixture('snake');assert.equal(move(bare,1,0),'lost');assert.equal(bare.status,'lost');assert.equal(move(bare,1,0),'ignored');
  const armed=fixture('sword');move(armed,1,0);assert.equal(armed.sword,true);armed.items['2,0']='snake';assert.equal(move(armed,1,0),'fight');assert.equal(armed.items['2,0'],undefined);assert.equal(armed.sword,true);
});
test('walls, invalid moves and brambles cannot move the player; sword clears brambles',()=>{
  const g=fixture('bramble');assert.equal(move(g,1,0),'bramble-block');assert.deepEqual(g.player,{x:0,y:0});assert.equal(g.steps,0);assert.equal(move(g,-1,0),'wall');assert.equal(move(g,1,1),'ignored');
  g.sword=true;assert.equal(move(g,1,0),'clear');assert.equal(move(g,0,1),'wall');assert.equal(g.steps,1);
});
test('the home door requires a key from chapter four',()=>{
  const g=fixture();g.index=3;g.player={x:2,y:1};assert.equal(move(g,0,1),'locked');assert.equal(g.steps,0);g.hasKey=true;assert.equal(move(g,0,1),'won');
});
test('lantern hides distant and visited cells, and walls block line of sight',()=>{
  const g=fixture();assert.equal(isVisible(g,0,0),true);assert.equal(isVisible(g,1,1),true);assert.equal(isVisible(g,2,2),false);
  g.grid[0][1]=1;assert.equal(isVisible(g,1,0),true);assert.equal(isVisible(g,2,0),false);
  g.size=7;g.grid=Array.from({length:7},()=>Array(7).fill(0));g.player={x:6,y:6};g.visited.add('0,0');assert.equal(isVisible(g,0,0),false);
});
test('pebbles are limited, retrievable, and do not survive a retry',()=>{
  const g=createGame(0,7);for(let i=0;i<5;i++){g.player={x:i,y:0};assert.equal(dropPebble(g),true);}g.player={x:6,y:0};assert.equal(dropPebble(g),false);g.player={x:0,y:0};assert.equal(dropPebble(g),true);assert.equal(g.pebbles,1);assert.equal(createGame(0,7).markers.length,0);
});
test('retries reproduce the same maze and a new seed changes it',()=>{
  assert.deepEqual(createGame(6,725).grid,createGame(6,725).grid);assert.deepEqual(createGame(6,725).items,createGame(6,725).items);assert.notDeepEqual(createGame(6,725).grid,createGame(6,726).grid);
});
test('saved progress tolerates corrupt, missing or blocked storage',()=>{
  let value=null;const storage={getItem:()=>value,setItem:(_,v)=>{value=v;}};assert.equal(loadProgress(storage),null);saveProgress(storage,{seed:2,level:2,unlocked:3});assert.equal(loadProgress(storage).level,2);value='broken';assert.equal(loadProgress(storage),null);value='{"seed":1,"level":7,"unlocked":0}';assert.equal(loadProgress(storage),null);const blocked={getItem(){throw Error();},setItem(){throw Error();}};assert.equal(loadProgress(blocked),null);assert.doesNotThrow(()=>saveProgress(blocked,{}));
});
