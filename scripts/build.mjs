import {cp,mkdir,rm,writeFile} from 'node:fs/promises';
import {makeStandalone} from './standalone.mjs';
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
for(const file of ['index.html','style.css','src','favicon.svg']) await cp(file,`dist/${file}`,{recursive:true});
const standalone=await makeStandalone();
await writeFile('play.html',standalone);
await writeFile('dist/play.html',standalone);
console.log('Built Little Lantern → dist/ and standalone play.html');
