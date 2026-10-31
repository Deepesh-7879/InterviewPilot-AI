from functools import lru_cache
from pathlib import Path
import tempfile
from fastapi import APIRouter, File, HTTPException, UploadFile
from starlette.concurrency import run_in_threadpool

router = APIRouter()

@lru_cache(maxsize=1)
def whisper_model():
    from faster_whisper import WhisperModel
    return WhisperModel("base.en", device="cpu", compute_type="int8")

def decode_audio(path: str):
    segments, info = whisper_model().transcribe(path, beam_size=1, vad_filter=True, language="en")
    return {"text": " ".join(s.text.strip() for s in segments).strip(), "language": info.language}

@router.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    if (audio.content_type or "").split(";")[0] not in ("audio/webm", "audio/wav", "audio/x-wav", "audio/ogg", "audio/mp4"):
        raise HTTPException(415, "Unsupported audio format")
    data = await audio.read(10 * 1024 * 1024 + 1)
    if not data or len(data) > 10 * 1024 * 1024:
        raise HTTPException(413, "Audio must be between 1 byte and 10 MB")
    suffix = ".webm" if "webm" in audio.content_type else ".wav" if "wav" in audio.content_type else ".ogg" if "ogg" in audio.content_type else ".mp4"
    with tempfile.TemporaryDirectory(prefix="interviewpilot-") as tmp:
        path = Path(tmp) / ("recording" + suffix)
        path.write_bytes(data)
        try:
            return await run_in_threadpool(decode_audio, str(path))
        except Exception as exc:
            raise HTTPException(503, "Transcription failed; verify the local Whisper model download and audio format") from exc
