import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('.'), port=Number(process.env.PORT)||3000;
http.createServer(async(req,res)=>{
  try {
    const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(path!==root&&!path.startsWith(root+sep)) {res.writeHead(403);return res.end();}
    const file=path.endsWith(sep)||path===root?resolve(path,'index.html'):path;
    const body=await readFile(file);
    res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml'})[extname(file)]||'application/octet-stream');res.end(body);
  } catch {res.writeHead(404);res.end('Not found');}
}).listen(port,'0.0.0.0',()=>console.log(`Little Lantern: http://localhost:${port}`));
