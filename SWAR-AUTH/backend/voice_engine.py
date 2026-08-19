import sys
import json
import os
import math
import warnings

# Suppress all warnings
warnings.filterwarnings('ignore')

# Disable symlinks on Windows to avoid privilege issues
if os.name == 'nt':  # Windows
    os.environ['HF_HUB_DISABLE_SYMLINKS'] = '1'
    os.environ['HF_HUB_DISABLE_SYMLINK_WARNING'] = '1'

EncoderClassifier = None
torch = None
_IMPORT_ERROR = None

try:
    import torch
    from speechbrain.pretrained import EncoderClassifier
except Exception as e:
    _IMPORT_ERROR = str(e)
    EncoderClassifier = None
    torch = None


_MODEL = None

def load_model():
    global _MODEL, _IMPORT_ERROR
    if _IMPORT_ERROR:
        raise RuntimeError(f"Speaker model imports failed: {_IMPORT_ERROR}")
    
    if _MODEL is None:
        try:
            _MODEL = EncoderClassifier.from_hparams(
                source="speechbrain/spkrec-ecapa-voxceleb",
                run_opts={"device": "cpu"}
            )
        except Exception as e:
            raise RuntimeError(f"Failed to load speaker encoder model: {e}")
    return _MODEL


def compute_embedding(filepath):
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Audio file not found: {filepath}")

    model = load_model()
    try:
        embeddings = model.encode_file(filepath)
        if hasattr(embeddings, 'squeeze'):
            vec = embeddings.squeeze().cpu().numpy()
        else:
            vec = embeddings.cpu().numpy()
        vec = [float(x) for x in vec]
        # normalize
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [x / norm for x in vec]
        return vec
    except Exception as e:
        raise RuntimeError(f"Failed to compute embedding: {e}")


def cosine_similarity(a, b):
    if len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command provided"}))
        sys.exit(1)

    cmd = sys.argv[1]

    if cmd == 'extract':
        if len(sys.argv) < 3:
            print(json.dumps({"error": "Missing audio file path(s)"}))
            sys.exit(1)
        filepaths = sys.argv[2:]
        try:
            embeddings = [compute_embedding(fp) for fp in filepaths]
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            sys.exit(1)

        # average and normalize
        dim = len(embeddings[0])
        avg = [0.0] * dim
        for emb in embeddings:
            if len(emb) != dim:
                print(json.dumps({"error": "Embedding dimension mismatch"}))
                sys.exit(1)
            for i in range(dim):
                avg[i] += emb[i] / len(embeddings)
        norm = math.sqrt(sum(x * x for x in avg))
        if norm > 0:
            avg = [x / norm for x in avg]

        print(json.dumps({"status": "success", "embedding": avg}))

    elif cmd == 'compare':
        if len(sys.argv) < 4:
            print(json.dumps({"error": "Usage: compare <audio_filepath> <json_enrolled_embedding>"}))
            sys.exit(1)
        sample_path = sys.argv[2]
        try:
            enrolled = json.loads(sys.argv[3])
        except Exception as e:
            print(json.dumps({"error": f"Failed to parse enrolled embedding: {e}"}))
            sys.exit(1)

        try:
            sample_emb = compute_embedding(sample_path)
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            sys.exit(1)

        try:
            score = cosine_similarity(sample_emb, enrolled)
            threshold = 0.70
            is_match = score >= threshold
            print(json.dumps({"status": "success", "similarity_score": round(score, 4), "is_match": is_match, "threshold": threshold}))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            sys.exit(1)

    else:
        print(json.dumps({"error": f"Unknown command {cmd}"}))
        sys.exit(1)


if __name__ == '__main__':
    main()
