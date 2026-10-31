# InterviewPilot AI

Free, local-first Windows technical interview **practice** assistant. Initial MVP: Electron/React desktop interface and FastAPI/Ollama technical question answering.

## Requirements
- Windows 10/11, Node.js LTS, Python 3.12, Git
- Ollama installed and running, with `ollama pull qwen2.5-coder:3b`

## Backend
```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

## Desktop (in a second terminal)
```powershell
cd desktop
npm install
npm run dev
```

## Backend tests
```powershell
cd backend
.\.venv\Scripts\python.exe -m pip install pytest
.\.venv\Scripts\python.exe -m pytest tests -q
```

## Current scope
- [x] Desktop UI scaffold with technical Q&A input and output
- [x] Local FastAPI /health, /models, /ask endpoints
- [x] Ollama 3B integration and input validation
- [ ] Microphone streaming and faster-whisper integration
- [ ] Coding editor and practice history
- [ ] Hardware benchmark and Windows installer

This is an initial source-code MVP, not a finished Windows installer. Audio is not collected in this version. Local Ollama inference uses no paid cloud API. Only use AI assistance during interviews when permitted by the interviewer.
