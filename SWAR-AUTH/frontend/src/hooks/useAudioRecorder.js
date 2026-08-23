import { useState, useRef, useEffect, useCallback } from 'react';

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioLevels, setAudioLevels] = useState([10, 10, 10, 10, 10, 10, 10, 10]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingError, setRecordingError] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const timerRef = useRef(null);

  const cleanupRecordingResources = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => undefined);
    }
    timerRef.current = null;
    animFrameRef.current = null;
    streamRef.current = null;
    audioContextRef.current = null;
    analyserRef.current = null;
    mediaRecorderRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setRecordingError('This browser does not support secure microphone recording.');
      return;
    }

    setAudioBlob(null);
    setRecordingError('');
    setRecordingTime(0);
    audioChunksRef.current = [];
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextConstructor) throw new Error('Audio analysis is not supported by this browser.');

      audioContextRef.current = new AudioContextConstructor();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 32;
      source.connect(analyserRef.current);

      const updateLevels = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        setAudioLevels(Array.from(dataArray.slice(0, 8)).map(value => Math.max(8, Math.min(50, (value / 255) * 50))));
        animFrameRef.current = requestAnimationFrame(updateLevels);
      };
      updateLevels();

      const supportedTypes = ['audio/wav', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
      const mimeType = supportedTypes.find(type => MediaRecorder.isTypeSupported(type));
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        if (!blob.size) {
          setRecordingError('No audio was captured. Please try again.');
        } else {
          setAudioBlob(blob);
          setAudioUrl(URL.createObjectURL(blob));
        }
        cleanupRecordingResources();
      };

      mediaRecorder.onerror = () => {
        setRecordingError('The browser could not capture audio. Please try again.');
        cleanupRecordingResources();
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
      timerRef.current = setInterval(() => setRecordingTime(previous => previous + 1), 1000);
    } catch (error) {
      cleanupRecordingResources();
      setIsRecording(false);
      setRecordingError(error.name === 'NotAllowedError'
        ? 'Microphone permission is required for voice authentication.'
        : 'Microphone recording could not be started.');
    }
  }, [audioUrl, cleanupRecordingResources]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, []);

  useEffect(() => () => {
    cleanupRecordingResources();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl, cleanupRecordingResources]);

  return {
    isRecording,
    audioBlob,
    audioUrl,
    audioLevels,
    recordingTime,
    recordingError,
    startRecording,
    stopRecording
  };
};
