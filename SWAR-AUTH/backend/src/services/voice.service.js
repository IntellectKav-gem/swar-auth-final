const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

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
  extractEmbedding,
  compareVoice
};
