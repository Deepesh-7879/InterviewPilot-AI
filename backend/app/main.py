import os
import json
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx

app = FastAPI(title='InterviewPilot AI', version='0.1.0')
app.add_middleware(CORSMiddleware, allow_origins=['http://localhost:5173','http://127.0.0.1:5173'], allow_methods=['GET','POST'], allow_headers=['Content-Type'])
OLLAMA = os.getenv('OLLAMA_URL', 'http://127.0.0.1:11434')
MODEL = os.getenv('OLLAMA_MODEL', 'qwen2.5-coder:3b')

class AskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)
    model: Optional[str] = None

@app.get('/health')
def health():
    return {'status':'ok','version':'0.1.0'}

@app.get('/models')
async def models():
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f'{OLLAMA}/api/tags')
            r.raise_for_status()
            return {'models':[m['name'] for m in r.json().get('models',[])]}
    except (httpx.HTTPError, KeyError, ValueError) as e:
        raise HTTPException(status_code=503, detail='Ollama is unavailable. Start Ollama and download a model.') from e

@app.post('/ask')
async def ask(body: AskRequest):
    prompt = ('You are a technical interview practice tutor. Provide a concise, accurate explanation, '
              'then an example when useful. If a coding task is asked, explain complexity. '
              'Do not invent facts.\nQuestion: ' + body.question)
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            r = await client.post(f'{OLLAMA}/api/generate', json={
                'model': body.model or MODEL, 'prompt': prompt, 'stream':False,
                'options':{'num_ctx':2048,'num_predict':160,'temperature':0.2},
                'keep_alive':'10m'})
            r.raise_for_status()
            return {'answer':r.json().get('response',''), 'model':body.model or MODEL}
    except (httpx.HTTPError, ValueError) as e:
        raise HTTPException(status_code=503, detail='Local model unavailable. Check Ollama and model installation.') from e

class TranscribeRequest(BaseModel):
    audio_path: str

@app.post('/transcribe-local-file')
def transcribe(body: TranscribeRequest):
    # Developer-only endpoint: intentionally disabled to avoid arbitrary filesystem reads.
    raise HTTPException(status_code=501, detail='Microphone transcription is planned for the next milestone.')
