const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const { supabase } = require('../config/db');

const STORAGE_BUCKET_NAME = 'voice-recordings';
const scriptPath = path.join(__dirname, '..', '..', 'voice_engine.py');
const defaultVenvPython = path.join(
  __dirname,
  '..',
  '..',
  '.venv',
  process.platform === 'win32' ? 'Scripts' : 'bin',
  process.platform === 'win32' ? 'python.exe' : 'python'
);
const pythonExec = process.env.VOICE_PYTHON_PATH || defaultVenvPython;

async function ensureVoiceBucket() {
  try {
    const { data: buckets = [], error: listError } = await supabase.storage.listBuckets();
    if (listError) throw listError;

    const existingBucket = buckets.find(bucket => bucket.name === STORAGE_BUCKET_NAME);
    if (existingBucket) return { name: existingBucket.name, public: false };

    const { data, error } = await supabase.storage.createBucket(STORAGE_BUCKET_NAME, {
      public: false,
      allowedMimeTypes: ['audio/wav', 'audio/x-wav']
    });
    if (error && !String(error.message).toLowerCase().includes('already exists')) throw error;

    return { name: data?.name || STORAGE_BUCKET_NAME, public: false };
  } catch (err) {
    console.warn(`Supabase voice bucket setup warning: ${err.message || err}`);
    return { name: STORAGE_BUCKET_NAME, public: false };
  }
}

async function uploadVoiceSamples(samplePaths, metadata = {}) {
  const { studentId, facultyId, rollNumber } = metadata;
  const bucket = await ensureVoiceBucket();
  const uploaded = [];

  for (let index = 0; index < samplePaths.length; index += 1) {
    const samplePath = samplePaths[index];
    if (!samplePath || !fs.existsSync(samplePath)) continue;

    const extension = path.extname(samplePath) || '.wav';
    const baseName = path.basename(samplePath, extension).replace(/[^a-zA-Z0-9_.-]+/g, '_') || `sample-${index + 1}`;
    const objectPath = [
      facultyId || 'faculty',
      studentId || 'student',
      rollNumber || 'unknown',
      `${baseName}-${Date.now()}-${index}${extension}`
    ].join('/');
    const sampleBuffer = fs.readFileSync(samplePath);
    const { data, error } = await supabase.storage.from(bucket.name).upload(objectPath, sampleBuffer, {
      contentType: 'audio/wav',
      upsert: true
    });
    if (error) throw new Error(`Supabase voice upload failed for ${samplePath}: ${error.message}`);

    uploaded.push({
      path: data?.path || objectPath,
      bucket: bucket.name,
      file_name: path.basename(samplePath)
    });
  }

  return uploaded;
}

function createVoiceEngineError(message, cause) {
  const error = new Error(message);
  error.code = 'VOICE_ENGINE_UNAVAILABLE';
  error.status = 503;
  error.cause = cause;
  return error;
}

function runPythonVoiceEngine(args) {
  return new Promise((resolve, reject) => {
    execFile(
      pythonExec,
      [scriptPath, ...args],
      { maxBuffer: 10 * 1024 * 1024, timeout: 120000 },
      (error, stdout, stderr) => {
        const output = String(stdout || '').trim();
        let parsed;

        try {
          parsed = JSON.parse(output);
        } catch (parseError) {
          const detail = String(stderr || error?.message || output || parseError.message).trim();
          return reject(createVoiceEngineError(`Voice engine returned invalid output: ${detail}`, error || parseError));
        }

        if (error || parsed.error) {
          return reject(
            createVoiceEngineError(
              parsed.error || String(stderr || error.message || 'Voice engine failed').trim(),
              error
            )
          );
        }

        resolve(parsed);
      }
    );
  });
}

function validateAudioPaths(filepaths) {
  const paths = Array.isArray(filepaths) ? filepaths : [filepaths];
  if (!paths.length || paths.some(filePath => !filePath || !fs.existsSync(filePath))) {
    throw createVoiceEngineError('Voice audio file is missing or no longer available');
  }
  return paths;
}

async function extractEmbedding(filepaths) {
  const paths = validateAudioPaths(filepaths);
  try {
    const result = await runPythonVoiceEngine(['extract', ...paths]);
    if (!Array.isArray(result.embedding) || result.embedding.length === 0) {
      throw new Error('Voice engine returned an empty embedding');
    }
    return result.embedding;
  } catch (error) {
    if (error.code === 'VOICE_ENGINE_UNAVAILABLE') throw error;
    throw createVoiceEngineError('Voice embedding extraction failed', error);
  }
}

async function compareVoice(samplePath, enrolledEmbedding) {
  validateAudioPaths(samplePath);
  if (!Array.isArray(enrolledEmbedding) || enrolledEmbedding.length === 0) {
    throw new Error('Stored voice profile is invalid');
  }

  try {
    const result = await runPythonVoiceEngine([
      'compare',
      samplePath,
      JSON.stringify(enrolledEmbedding)
    ]);
    if (typeof result.similarity_score !== 'number' || typeof result.is_match !== 'boolean') {
      throw new Error('Voice engine returned an invalid comparison result');
    }
    return result;
  } catch (error) {
    if (error.code === 'VOICE_ENGINE_UNAVAILABLE') throw error;
    throw createVoiceEngineError('Voice comparison failed', error);
  }
}

module.exports = {
  ensureVoiceBucket,
  uploadVoiceSamples,
  extractEmbedding,
  compareVoice
};
