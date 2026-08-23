import json
import math
import os
import sys
import warnings

warnings.filterwarnings('ignore')

if os.name == 'nt':
    os.environ['HF_HUB_DISABLE_SYMLINKS'] = '1'
    os.environ['HF_HUB_DISABLE_SYMLINK_WARNING'] = '1'

EncoderClassifier = None
torch = None
torchaudio = None
soundfile = None
_IMPORT_ERROR = None

try:
    import torch
    import torchaudio
    import soundfile
    try:
        from speechbrain.inference.speaker import EncoderClassifier
    except ImportError:
        from speechbrain.pretrained import EncoderClassifier
except Exception as error:
    _IMPORT_ERROR = str(error)

_MODEL = None


def load_model():
    global _MODEL
    if _IMPORT_ERROR:
        raise RuntimeError(f'Speaker model imports failed: {_IMPORT_ERROR}')

    if _MODEL is None:
        try:
            _MODEL = EncoderClassifier.from_hparams(
                source='speechbrain/spkrec-ecapa-voxceleb',
                run_opts={'device': 'cpu'}
            )
        except Exception as error:
            raise RuntimeError(f'Failed to load speaker encoder model: {error}') from error
    return _MODEL


def load_audio(filepath):
    samples, sample_rate = soundfile.read(filepath, dtype='float32', always_2d=True)
    if samples.size == 0:
        raise ValueError('Audio file is empty')
    waveform = torch.from_numpy(samples.T.copy())
    if waveform.shape[0] > 1:
        waveform = waveform.mean(dim=0, keepdim=True)
    if sample_rate != 16000:
        waveform = torchaudio.functional.resample(waveform, sample_rate, 16000)
    return waveform


def compute_embedding(filepath):
    if not os.path.exists(filepath):
        raise FileNotFoundError(f'Audio file not found: {filepath}')

    model = load_model()
    try:
        waveform = load_audio(filepath)
        with torch.no_grad():
            embeddings = model.encode_batch(waveform)
        vec = embeddings.squeeze().detach().cpu().numpy().tolist()
        vec = [float(value) for value in vec]
        norm = math.sqrt(sum(value * value for value in vec))
        if norm == 0:
            raise ValueError('Voice embedding has zero magnitude')
        return [value / norm for value in vec]
    except Exception as error:
        raise RuntimeError(f'Failed to compute embedding: {error}') from error


def cosine_similarity(a, b):
    if len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No command provided'}))
        sys.exit(1)

    command = sys.argv[1]
    if command == 'extract':
        if len(sys.argv) < 3:
            print(json.dumps({'error': 'Missing audio file path(s)'}))
            sys.exit(1)
        try:
            embeddings = [compute_embedding(filepath) for filepath in sys.argv[2:]]
            dimension = len(embeddings[0])
            average = [0.0] * dimension
            for embedding in embeddings:
                if len(embedding) != dimension:
                    raise ValueError('Embedding dimension mismatch')
                for index, value in enumerate(embedding):
                    average[index] += value / len(embeddings)
            norm = math.sqrt(sum(value * value for value in average))
            average = [value / norm for value in average]
            print(json.dumps({'status': 'success', 'embedding': average}))
        except Exception as error:
            print(json.dumps({'error': str(error)}))
            sys.exit(1)

    elif command == 'compare':
        if len(sys.argv) < 4:
            print(json.dumps({'error': 'Usage: compare <audio_filepath> <json_enrolled_embedding>'}))
            sys.exit(1)
        try:
            enrolled = json.loads(sys.argv[3])
            sample_embedding = compute_embedding(sys.argv[2])
            score = cosine_similarity(sample_embedding, enrolled)
            threshold = 0.70
            print(json.dumps({
                'status': 'success',
                'similarity_score': round(score, 4),
                'is_match': score >= threshold,
                'threshold': threshold
            }))
        except Exception as error:
            print(json.dumps({'error': str(error)}))
            sys.exit(1)
    else:
        print(json.dumps({'error': f'Unknown command {command}'}))
        sys.exit(1)


if __name__ == '__main__':
    main()
