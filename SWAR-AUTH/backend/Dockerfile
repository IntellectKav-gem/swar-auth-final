# SWAR-AUTH Voice Attendance Container Image
# Combines Node.js API runtime with Python 3.10 PyTorch / SpeechBrain environment

FROM python:3.10-slim

# System dependencies for audio handling and node build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ffmpeg \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python ML dependencies
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Pre-download SpeechBrain ECAPA-VOXCELEB model weights into HuggingFace cache
RUN python3 -c "from speechbrain.pretrained import EncoderClassifier; EncoderClassifier.from_hparams(source='speechbrain/spkrec-ecapa-voxceleb', run_opts={'device': 'cpu'})"

# Install Node backend dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application source code
COPY . .

ENV PORT=5000
ENV NODE_ENV=production
ENV VOICE_PYTHON_PATH=python3

EXPOSE 5000

CMD ["node", "server.js"]
