'use strict';
// Static UI-only fixture: no database module or production write endpoint is loaded.
const express=require('express'),path=require('node:path');
const {STORY}=require('../app/chapter-ending'),app=express(),root=path.resolve(__dirname,'..');
app.use((req,res,next)=>{if(req.method!=='GET'&&req.method!=='HEAD')return res.status(405).json({error:'Visual fixture is read only'});next();});
app.get('/api/adventure/ending',(req,res)=>res.json({ending:{...STORY,completedAt:'2026-10-15 12:34:56',summary:{answered:24,correct:20,revived:true,mistakes:4}}}));
app.use('/shared',express.static(path.join(root,'shared')));app.use(express.static(path.join(root,'static')));
const server=app.listen(0,'127.0.0.1',()=>console.log('ENDING_VISUAL_QA http://127.0.0.1:'+server.address().port));
process.on('SIGTERM',()=>server.close());process.on('SIGINT',()=>server.close());
