FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download Vosk model (small model - only 40MB)
# RUN mkdir -p /app/models && \
#     cd /app/models && \
#     wget https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip && \
#     unzip vosk-model-small-en-us-0.15.zip && \
#     rm vosk-model-small-en-us-0.15.zip

RUN mkdir -p /app/models && \
    cd /app/models && \
    wget https://alphacephei.com/vosk/models/vosk-model-en-us-0.22.zip && \
    unzip vosk-model-en-us-0.22.zip && \
    rm vosk-model-en-us-0.22.zip

# Copy application files
COPY . .

# Expose WebSocket port
EXPOSE 8765

# Run the WebSocket server
CMD ["python", "vosk_server.py"]