FROM fedirz/faster-whisper-server:0.6.0-rc.3-cpu

# Image runs as 'ubuntu' user; project is at /home/ubuntu/faster-whisper-server
WORKDIR /home/ubuntu/faster-whisper-server

# Pre-bake the tiny model at build time so the server starts instantly at runtime
# (avoids HuggingFace download on every cold start which exceeds the healthcheck window)
RUN .venv/bin/python3 -c "from faster_whisper import WhisperModel; WhisperModel('tiny', device='cpu', compute_type='int8')"

CMD [".venv/bin/python3", "-m", "faster_whisper_server.main"]
