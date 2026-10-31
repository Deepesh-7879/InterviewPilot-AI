from fastapi.testclient import TestClient
from app.main import app

def test_health():
    response = TestClient(app).get('/health')
    assert response.status_code == 200
    assert response.json()['status'] == 'ok'

def test_empty_question_rejected():
    assert TestClient(app).post('/ask', json={'question':''}).status_code == 422

def test_transcription_not_falsely_enabled():
    assert TestClient(app).post('/transcribe-local-file', json={'audio_path':'x'}).status_code == 501
