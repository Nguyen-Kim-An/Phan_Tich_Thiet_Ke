export interface ContinuousSpeechController {
  stop: () => void;
  isSupported: boolean;
}

interface SpeechResult {
  isFinal: boolean;
  [index: number]: { transcript: string };
}

interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: { results: ArrayLike<SpeechResult> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
}

const errors: Record<string, string> = {
  'not-allowed': 'Micro đang bị chặn. Hãy cho phép micro trong cài đặt quyền của website rồi bấm Thu âm lại.',
  'service-not-allowed': 'Trình duyệt không cho phép dịch vụ nhận diện giọng nói. Hãy mở website trong trình duyệt có hỗ trợ SpeechRecognition.',
  'audio-capture': 'Không truy cập được micro. Kiểm tra micro đã kết nối và quyền micro của hệ điều hành.',
  network: 'Không kết nối được dịch vụ nhận diện giọng nói. Kiểm tra Internet rồi thử lại.',
  'no-speech': 'Chưa nghe được giọng nói. Bấm Thu âm và nói gần micro hơn.',
  'language-not-supported': 'Dịch vụ nhận diện của trình duyệt chưa hỗ trợ tiếng Việt.',
  aborted: 'Phiên nhận diện đã bị trình duyệt dừng. Bấm Thu âm để thử lại.',
};

/** Browser recognition only; no extension or keyboard shortcut is required. */
export function startContinuousVoiceSession(
  initialText: string,
  onTranscriptUpdate: (fullText: string) => void,
  onListeningChange: (listening: boolean) => void,
  onError: (message: string) => void = () => {},
): ContinuousSpeechController {
  const unsupported = (message: string): ContinuousSpeechController => {
    onListeningChange(false);
    onError(message);
    return { stop: () => {}, isSupported: false };
  };
  if (typeof window === 'undefined') return unsupported('Hãy mở chức năng giọng nói trong trình duyệt.');
  if (!window.isSecureContext) return unsupported('Micro cần HTTPS hoặc localhost. Hãy mở website bằng địa chỉ bảo mật.');
  const browser = window as Window & {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
  };
  const Constructor = browser.SpeechRecognition || browser.webkitSpeechRecognition;
  if (!Constructor) {
    return unsupported('Trình duyệt này không hỗ trợ nhận diện giọng nói. Hãy mở cùng địa chỉ website trong Chrome có hỗ trợ SpeechRecognition, hoặc nhập nội dung bằng bàn phím.');
  }

  let active = true;
  let baseText = initialText.trim();
  let latestText = baseText;
  let recognition: Recognition | null = null;
  let restartTimer: ReturnType<typeof setTimeout> | undefined;
  let startTimer: ReturnType<typeof setTimeout> | undefined;
  let emptyRestarts = 0;

  const stop = () => {
    active = false;
    clearTimeout(restartTimer);
    clearTimeout(startTimer);
    if (recognition) {
      recognition.onstart = recognition.onresult = recognition.onerror = recognition.onend = null;
      try { recognition.abort(); } catch { /* Already stopped. */ }
      recognition = null;
    }
    onListeningChange(false);
  };
  const fail = (message: string) => { stop(); onError(message); };
  const start = () => {
    if (!active) return;
    try {
      const current = new Constructor();
      recognition = current;
      current.lang = 'vi-VN';
      current.continuous = true;
      current.interimResults = true;
      current.maxAlternatives = 1;
      let receivedText = false;
      startTimer = setTimeout(() => fail('Micro chưa khởi động được. Kiểm tra hộp thoại cấp quyền hoặc thử mở website trong Chrome.'), 10000);
      current.onstart = () => {
        if (!active) return;
        clearTimeout(startTimer);
        onListeningChange(true);
      };
      current.onresult = (event) => {
        if (!active) return;
        const chunks: string[] = [];
        for (let i = 0; i < event.results.length; i++) {
          const text = event.results[i][0]?.transcript?.trim();
          if (text) chunks.push(text);
        }
        receivedText = chunks.length > 0;
        latestText = [baseText, ...chunks].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
        onTranscriptUpdate(latestText);
      };
      current.onerror = (event) => {
        if (active) fail(errors[event.error] || 'Không khởi động được nhận diện giọng nói. Hãy thử lại.');
      };
      current.onend = () => {
        clearTimeout(startTimer);
        if (!active) return;
        baseText = latestText;
        emptyRestarts = receivedText ? 0 : emptyRestarts + 1;
        if (emptyRestarts > 2) { fail(errors['no-speech']); return; }
        restartTimer = setTimeout(start, 250);
      };
      current.start();
    } catch {
      fail('Không mở được micro. Kiểm tra quyền truy cập hoặc thử lại trong trình duyệt có hỗ trợ nhận diện giọng nói.');
    }
  };
  start();
  return { stop, isSupported: true };
}
