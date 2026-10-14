import { FilesetResolver, FaceDetector } from '@mediapipe/tasks-vision';
import { MicVAD } from '@ricky0123/vad-web';
import * as ort from 'onnxruntime-web';

export const PROCTORING_CONFIG = {
  FACE_DETECTION_INTERVAL_MS: 350,
  FACE_MISSING_WARNING_MS: 2000,
  FACE_MISSING_EVENT_MS: 5000,
  MULTIPLE_FACES_CONFIRM_MS: 1500,
  SPEECH_IGNORE_MS: 1000,
  SPEECH_WARNING_MS: 1500,
  SPEECH_EVENT_MS: 2000,
  SPEECH_COOLDOWN_MS: 3000,
  PERIODIC_SNAPSHOT_INTERVAL_MS: 40000,
};

export interface BrowserSupportResult {
  supported: boolean;
  reason?: string;
}

export const checkProctoringBrowserSupport = (): BrowserSupportResult => {
  if (typeof window === 'undefined') {
    return { supported: false, reason: 'Window context is unavailable.' };
  }
  if (!navigator?.mediaDevices?.getUserMedia) {
    return {
      supported: false,
      reason: 'Your browser does not support media capture devices. Please use a modern browser such as Chrome, Edge, or Firefox.',
    };
  }
  const hasAudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!hasAudioContext) {
    return {
      supported: false,
      reason: 'Your browser does not support Web Audio API required for speech monitoring.',
    };
  }
  if (typeof WebAssembly === 'undefined') {
    return {
      supported: false,
      reason: 'Your browser does not support WebAssembly required for local proctoring AI models.',
    };
  }
  return { supported: true };
};

let visionInstance: any = null;
let detectorInstance: FaceDetector | null = null;

export interface BoundingBox {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

export const calculateIoU = (boxA: BoundingBox, boxB: BoundingBox): number => {
  const x1 = Math.max(boxA.originX, boxB.originX);
  const y1 = Math.max(boxA.originY, boxB.originY);
  const x2 = Math.min(boxA.originX + boxA.width, boxB.originX + boxB.width);
  const y2 = Math.min(boxA.originY + boxA.height, boxB.originY + boxB.height);

  const intersectionW = Math.max(0, x2 - x1);
  const intersectionH = Math.max(0, y2 - y1);
  const intersectionArea = intersectionW * intersectionH;

  if (intersectionArea <= 0) return 0;

  const areaA = Math.max(1, boxA.width * boxA.height);
  const areaB = Math.max(1, boxB.width * boxB.height);
  const unionArea = areaA + areaB - intersectionArea;

  return unionArea > 0 ? intersectionArea / unionArea : 0;
};

export const calculateContainmentOverlap = (boxA: BoundingBox, boxB: BoundingBox): number => {
  const x1 = Math.max(boxA.originX, boxB.originX);
  const y1 = Math.max(boxA.originY, boxB.originY);
  const x2 = Math.min(boxA.originX + boxA.width, boxB.originX + boxB.width);
  const y2 = Math.min(boxA.originY + boxA.height, boxB.originY + boxB.height);

  const intersectionW = Math.max(0, x2 - x1);
  const intersectionH = Math.max(0, y2 - y1);
  const intersectionArea = intersectionW * intersectionH;

  if (intersectionArea <= 0) return 0;

  const areaA = Math.max(1, boxA.width * boxA.height);
  const areaB = Math.max(1, boxB.width * boxB.height);
  const minArea = Math.min(areaA, areaB);

  return minArea > 0 ? intersectionArea / minArea : 0;
};

export const initFaceDetector = async (): Promise<FaceDetector> => {
  if (detectorInstance) {
    return detectorInstance;
  }
  if (!visionInstance) {
    visionInstance = await FilesetResolver.forVisionTasks('/mediapipe/wasm');
  }
  try {
    detectorInstance = await FaceDetector.createFromOptions(visionInstance, {
      baseOptions: {
        modelAssetPath: '/mediapipe/blaze_face_short_range.tflite',
        delegate: 'GPU',
      },
      runningMode: 'IMAGE',
      minDetectionConfidence: 0.45,
    });
  } catch (gpuErr) {
    console.warn('FaceDetector GPU delegate initialization failed, falling back to CPU:', gpuErr);
    detectorInstance = await FaceDetector.createFromOptions(visionInstance, {
      baseOptions: {
        modelAssetPath: '/mediapipe/blaze_face_short_range.tflite',
        delegate: 'CPU',
      },
      runningMode: 'IMAGE',
      minDetectionConfidence: 0.45,
    });
  }
  return detectorInstance;
};

export const detectFacesInVideo = (
  detector: FaceDetector | null,
  video: HTMLVideoElement | null
): number => {
  if (!detector || !video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
    return 0;
  }
  try {
    const result = detector.detect(video);
    if (!result || !Array.isArray(result.detections) || result.detections.length === 0) {
      return 0;
    }

    // 1. Filter out low-confidence artifacts (< 0.40) and invalid boxes
    const validDetections = result.detections
      .filter((d: any) => {
        const score = d.categories?.[0]?.score ?? 0;
        const box = d.boundingBox;
        return score >= 0.40 && box && box.width > 0 && box.height > 0;
      })
      .sort((a: any, b: any) => (b.categories?.[0]?.score ?? 0) - (a.categories?.[0]?.score ?? 0));

    if (validDetections.length <= 1) {
      return validDetections.length;
    }

    // 2. Non-Maximum Suppression (NMS) duplicate suppression:
    // If two detections heavily overlap (IoU > 0.30 or containment > 0.55), they represent the same face.
    // Genuine second persons will have distinct, non-overlapping spatial positions.
    const distinctFaces: BoundingBox[] = [];

    for (const detection of validDetections) {
      const box = detection.boundingBox as BoundingBox;
      const isDuplicate = distinctFaces.some((acceptedBox) => {
        const iou = calculateIoU(acceptedBox, box);
        const containment = calculateContainmentOverlap(acceptedBox, box);
        return iou > 0.30 || containment > 0.55;
      });

      if (!isDuplicate) {
        distinctFaces.push(box);
      }
    }

    return distinctFaces.length;
  } catch (err) {
    console.warn('Face detection frame inference failed:', err);
    return 0;
  }
};

export interface VADCallbacks {
  onSpeechStart?: () => void;
  onSpeechRealStart?: () => void;
  onSpeechEnd?: (audio: Float32Array) => void;
  onVADMisfire?: () => void;
}

export const initSileroVAD = async (
  stream: MediaStream,
  callbacks: VADCallbacks
): Promise<MicVAD> => {
  const audioTracks = stream.getAudioTracks();
  if (!audioTracks || audioTracks.length === 0 || !audioTracks[0].enabled) {
    throw new Error('Microphone audio track is inactive or unavailable.');
  }

  // Pre-create and resume AudioContext if suspended to ensure clean worklet connection
  const AudioContextClass = typeof window !== 'undefined' ? (window.AudioContext || (window as any).webkitAudioContext) : null;
  let customAudioContext: AudioContext | null = null;
  if (AudioContextClass) {
    customAudioContext = new AudioContextClass();
    if (customAudioContext.state === 'suspended') {
      try {
        await customAudioContext.resume();
      } catch (resumeErr) {
        console.warn('AudioContext resume warning:', resumeErr);
      }
    }
  }

  // 1. Explicitly configure ONNX Runtime wasmPaths BEFORE MicVAD.new() is called
  if (ort?.env?.wasm) {
    ort.env.wasm.wasmPaths = {
      mjs: '/vad/onnx/ort-wasm-simd-threaded.mjs',
      wasm: '/vad/onnx/ort-wasm-simd-threaded.wasm',
    };
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.proxy = false;
  }

  const baseConfig: any = {
    model: 'v5',
    baseAssetPath: '/vad/',
    onnxWASMBasePath: '/vad/onnx/',
    ortConfig: (ortInstance: any) => {
      ortInstance.env.wasm.wasmPaths = {
        mjs: '/vad/onnx/ort-wasm-simd-threaded.mjs',
        wasm: '/vad/onnx/ort-wasm-simd-threaded.wasm',
      };
      ortInstance.env.wasm.numThreads = 1;
      ortInstance.env.wasm.proxy = false;
    },
    getStream: async () => stream,
    audioContext: customAudioContext || undefined,
    positiveSpeechThreshold: 0.75,
    negativeSpeechThreshold: 0.35,
    minSpeechMs: 400,
    preSpeechPadMs: 200,
    redemptionMs: 600,
    onSpeechStart: callbacks.onSpeechStart,
    onSpeechRealStart: callbacks.onSpeechRealStart,
    onSpeechEnd: callbacks.onSpeechEnd,
    onVADMisfire: callbacks.onVADMisfire,
  };

  const createMicVadWithTimeout = (config: any, timeoutMs: number = 7000): Promise<MicVAD> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`MicVAD initialization timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      MicVAD.new(config)
        .then((instance) => {
          clearTimeout(timer);
          resolve(instance);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  };

  try {
    return await createMicVadWithTimeout({
      ...baseConfig,
      processorType: 'auto',
    }, 7000);
  } catch (workletError) {
    console.warn('AudioWorklet VAD initialization failed, falling back to ScriptProcessor:', workletError);
    return await createMicVadWithTimeout({
      ...baseConfig,
      processorType: 'ScriptProcessor',
    }, 7000);
  }
};
