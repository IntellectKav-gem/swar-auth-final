const test = require('node:test');
const assert = require('node:assert/strict');
const { uploadVoiceSamples, ensureVoiceBucket } = require('../src/services/voice.service');

test('voice storage helpers should exist and initialize a private storage bucket', async () => {
  assert.equal(typeof ensureVoiceBucket, 'function');
  assert.equal(typeof uploadVoiceSamples, 'function');

  const bucket = await ensureVoiceBucket();
  assert.equal(bucket.name, 'voice-recordings');
  assert.equal(bucket.public, false);
});
