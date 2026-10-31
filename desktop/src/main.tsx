import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';

type Page = 'Practice Workspace'|'Coding Studio'|'Session History'|'Settings';
type Session = {id:number; question:string; answer:string; date:string; kind:string};
const API='http://127.0.0.1:8000';
function App(){
 const [page,setPage]=useState<Page>('Practice Workspace');
 const [question,setQuestion]=useState('Explain binary search and its time complexity.');
 const [answer,setAnswer]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [model,setModel]=useState(()=>localStorage.getItem('interviewpilot-model')||'qwen2.5-coder:3b');
 const [sessions,setSessions]=useState<Session[]>(()=>{
  try {return JSON.parse(localStorage.getItem('interviewpilot-sessions')||'[]') as Session[]} catch{return []}
 });
 const [language,setLanguage]=useState('Python');
 const [code,setCode]=useState('# Write your solution here\n');
 const [recording,setRecording]=useState(false);
 const recorder=useRef<MediaRecorder|null>(null);
 const chunks=useRef<Blob[]>([]);
 const stream=useRef<MediaStream|null>(null);
 useEffect(()=>{localStorage.setItem('interviewpilot-sessions',JSON.stringify(sessions))},[sessions]);
 useEffect(()=>{localStorage.setItem('interviewpilot-model',model)},[model]);
 useEffect(()=>()=>{stream.current?.getTracks().forEach(t=>t.stop())},[]);
 async function ask(prompt=question,kind='Interview'){
  if(!prompt.trim())return;
  setBusy(true);setError('');setAnswer('');
  try{
   const r=await fetch(API+'/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:prompt,model})});
   const data=await r.json();
   if(!r.ok)throw new Error(data.detail||'Request failed');
   const result=String(data.answer||'');
   setAnswer(result);
   setSessions(old=>[{id:Date.now(),question:prompt,answer:result,date:new Date().toLocaleString(),kind},...old].slice(0,100));
  }catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}
 }
 async function toggleRecording(){
  if(recording){recorder.current?.stop();setRecording(false);return}
  try{
   setError('');
   const media=await navigator.mediaDevices.getUserMedia({audio:true});
   stream.current=media;chunks.current=[];
   const mime=['audio/webm;codecs=opus','audio/webm','audio/ogg'].find(x=>MediaRecorder.isTypeSupported(x));
   if(!mime)throw new Error('Audio recording is unsupported in this environment.');
   const r=new MediaRecorder(media,{mimeType:mime});
   recorder.current=r;
   r.ondataavailable=e=>{if(e.data.size)chunks.current.push(e.data)};
   r.onstop=async()=>{
    media.getTracks().forEach(t=>t.stop());
    setBusy(true);
    try{
     const blob=new Blob(chunks.current,{type:mime});
     const form=new FormData();form.append('audio',blob,'recording.webm');
     const response=await fetch(API+'/transcribe',{method:'POST',body:form});
     const data=await response.json();
     if(!response.ok)throw new Error(data.detail||'Transcription failed');
     setQuestion(old=>[old,String(data.text||'')].filter(Boolean).join('\n'));
     setPage('Practice Workspace');
    }catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}
   };
   r.start();setRecording(true);
  }catch(e){stream.current?.getTracks().forEach(t=>t.stop());setError(e instanceof Error?e.message:String(e))}
 }
 function codeReview(){setPage('Practice Workspace');const prompt='Review this '+language+' interview solution. Explain correctness, time and space complexity, edge cases, and improvements. Do not execute it.\n\n'+code;setQuestion(prompt);void ask(prompt,'Code review')}
 return <div className="layout"><aside><div className="brand">✦ InterviewPilot <span>AI</span></div>
 {(['Practice Workspace','Coding Studio','Session History','Settings'] as Page[]).map(p=><button key={p} className={'nav '+(page===p?'selected':'')} onClick={()=>setPage(p)}>{p}</button>)}
 <div className="foot">LOCAL-FIRST • VERSION 0.2</div></aside><main>
 <header><div><div className="eyebrow">YOUR TECHNICAL INTERVIEW COMPANION</div><h1>{page==='Practice Workspace'?'Practice with confidence.':page}</h1><p>Free local interview preparation, powered by Ollama.</p></div><div className="pill">● Local practice mode</div></header>
 {error&&<div className="error panel" role="alert">{error}</div>}
 {page==='Practice Workspace'&&<div className="columns"><section><div className="sectiontitle">01 / Interview question</div><div className="panel"><label htmlFor="question">Question or prompt</label><textarea id="question" value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask a Python, Java, SQL or DSA question..."/><div className="actions"><button className="secondary" onClick={()=>void toggleRecording()} disabled={busy}>{recording?'■ Stop recording':'🎙 Record question'}</button><button onClick={()=>void ask()} disabled={busy||!question.trim()}>{busy?'Working…':'Generate explanation →'}</button></div></div></section><section><div className="sectiontitle">02 / AI explanation</div><div className="panel response">{answer?<div className="answer">{answer}</div>:<div className="empty"><div className="sparkle">✦</div><strong>Ready when you are</strong><p>Your locally generated explanation will appear here.</p></div>}</div></section></div>}
 {page==='Coding Studio'&&<div className="panel"><label htmlFor="language">Practice language</label><select id="language" value={language} onChange={e=>setLanguage(e.target.value)}>{['Python','Java','SQL'].map(x=><option key={x}>{x}</option>)}</select><label htmlFor="code">Your solution</label><textarea id="code" className="code" value={code} onChange={e=>setCode(e.target.value)} spellCheck={false}/><div className="actions"><span>Code is reviewed by local AI, not executed.</span><button disabled={!code.trim()||busy} onClick={codeReview}>Review solution →</button></div></div>}
 {page==='Session History'&&<div className="panel"><div className="actions"><strong>Saved locally on this computer ({sessions.length})</strong><button className="secondary" onClick={()=>{if(window.confirm('Delete all saved sessions?'))setSessions([])}}>Clear history</button></div>{sessions.length===0?<p>No practice sessions saved yet.</p>:sessions.map(s=><div className="history" key={s.id}><strong>{s.kind} · {s.date}</strong><p>{s.question.slice(0,220)}</p><button className="secondary" onClick={()=>{setQuestion(s.question);setAnswer(s.answer);setPage('Practice Workspace')}}>Open answer</button></div>)}</div>}
 {page==='Settings'&&<div className="panel"><label htmlFor="model">Installed Ollama model name</label><input id="model" value={model} onChange={e=>setModel(e.target.value)} placeholder="qwen2.5-coder:3b"/><p>Recommended for RTX 2050 4 GB: qwen2.5-coder:3b. Microphone transcription uses Whisper base.en on CPU.</p><p>All session history stays in local application storage. Model responses use your local Ollama server.</p></div>}
 <div className="note">🔒 Practice locally. Use only where AI assistance is permitted.</div></main></div>
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
