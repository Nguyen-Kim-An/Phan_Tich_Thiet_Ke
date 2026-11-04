'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import type { Outfit, StylistSession, TryOnSession } from '@/domain/models';
import { products, money } from '@/lib/catalog';
import { cartActions } from '@/store/store';
import { stylistController } from '@/services/stylist-orchestrator';
import {
  startContinuousVoiceSession,
  type ContinuousSpeechController,
} from '@/services/interfaces';
import { Icon } from '@/components/icons';

const QUIZ_QUESTIONS = {
  occasions: [
    'Công sở & Gặp đối tác',
    'Tiệc tối & Sự kiện sang trọng',
    'Dạo phố & Cà phê cuối tuần',
    'Du lịch & Nghỉ dưỡng',
  ],
  vibes: [
    'Thanh lịch tối giản (Minimalist)',
    'Hiện đại & Sắc sảo (Modern Tailored)',
    'Nữ tính & Mềm mại (Romantic Silk)',
    'Phóng khoáng (Smart-Casual)',
  ],
  fitGoals: [
    'Tôn vòng eo & Kéo dài đôi chân',
    'Che khuyết điểm bắp tay & Cân đối bờ vai',
    'Phom suông che vòng 2 & Thoải mái di chuyển',
  ],
  budgets: [
    { label: 'Dưới 3.000.000₫ / bộ', value: 3000000 },
    { label: 'Dưới 4.500.000₫ / bộ', value: 4500000 },
    { label: 'Dưới 6.500.000₫ / bộ', value: 6500000 },
  ],
};

const SAMPLE_VOICE_INTENTS = [
  'Phối giúp tôi mấy bộ đồ đi làm lịch sự, hiện đại, tôn vòng eo và che bắp tay, ngân sách tầm 4.5 triệu',
  'Tôi chuẩn bị đi tiệc tối, thích phong cách nữ tính mềm mại bằng lụa, tôn dáng dưới 5 triệu',
  'Tìm cho tôi bộ đồ dạo phố cuối tuần thoải mái, che vòng 2, tông màu trung tính dưới 3 triệu',
];

export default function OutfitsPage() {
  const dispatch = useDispatch();

  const sampleModelPhotos = [
    {
      label: 'Mẫu dáng Đồng hồ cát (Studio 01)',
      url: products[0]?.image || '',
    },
    {
      label: 'Mẫu dáng Quả lê (Studio 02)',
      url: products[60]?.image || products[1]?.image || '',
    },
    {
      label: 'Mẫu dáng Chữ nhật (Studio 03)',
      url: products[120]?.image || products[2]?.image || '',
    },
  ];

  // Step 1: Body photo (Webcam capture or Upload or Sample Model)
  const [inBodyPhoto, setInBodyPhoto] = useState<string>(
    sampleModelPhotos[0]?.url || ''
  );
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Input Mode ('quiz' = 4 guided questions | 'voice' = Amical AI Voice / Continuous Mic)
  const [inputMode, setInputMode] = useState<'quiz' | 'voice'>('quiz');
  const [inQuizAnswers, setInQuizAnswers] = useState({
    occasion: QUIZ_QUESTIONS.occasions[0],
    styleVibe: QUIZ_QUESTIONS.vibes[0],
    fitGoal: QUIZ_QUESTIONS.fitGoals[0],
    budgetLimit: 4500000,
  });
  const [inVoicePrompt, setInVoicePrompt] = useState<string>(
    SAMPLE_VOICE_INTENTS[0]
  );
  const [isRecording, setIsRecording] = useState(false);
  const voiceTextareaRef = useRef<HTMLTextAreaElement>(null);
  const voiceSessionRef = useRef<ContinuousSpeechController | null>(null);

  // Step 3: StylistSession
  const [session, setSession] = useState<StylistSession>(() =>
    stylistController.recommend({
      photoUrl: sampleModelPhotos[0]?.url || '',
      inputMode: 'quiz',
      quizAnswers: {
        occasion: QUIZ_QUESTIONS.occasions[0],
        styleVibe: QUIZ_QUESTIONS.vibes[0],
        fitGoal: QUIZ_QUESTIONS.fitGoals[0],
        budgetLimit: 4500000,
      },
    })
  );
  const [activeOutfitIdx, setActiveOutfitIdx] = useState(0);

  // Step 4: Virtual Try-On Preview
  const [tryOnLoading, setTryOnLoading] = useState(false);
  const [tryOnSession, setTryOnSession] = useState<TryOnSession | null>(null);
  const [showOriginalCompare, setShowOriginalCompare] = useState(false);
  const previewSectionRef = useRef<HTMLDivElement>(null);

  // Cleanup webcam stream & voice session on unmount
  useEffect(() => {
    return () => {
      voiceSessionRef.current?.stop();
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startWebcam = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 720, height: 960 },
      });
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      setCameraError(
        'Trình duyệt không tìm thấy Webcam hoặc chưa cấp quyền Camera. Bạn có thể tải ảnh từ máy hoặc chọn ảnh mẫu bên dưới.'
      );
    }
  };

  const captureWebcamSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setInBodyPhoto(dataUrl);
    }
    if (video.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
    }
    setCameraActive(false);
  };

  const stopWebcam = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream)
        .getTracks()
        .forEach((t) => t.stop());
    }
    setCameraActive(false);
  };

  const handlePhotoUpload = (file?: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setInBodyPhoto(url);
    setTryOnSession(null);
  };

  const handleToggleVoiceMic = () => {
    setInputMode('voice');
    if (isRecording) {
      voiceSessionRef.current?.stop();
      voiceSessionRef.current = null;
      setIsRecording(false);
      return;
    }

    voiceTextareaRef.current?.focus();
    const sessionCtrl = startContinuousVoiceSession(
      inVoicePrompt,
      (liveText) => {
        setInVoicePrompt(liveText);
      },
      (listening) => {
        setIsRecording(listening);
      }
    );
    voiceSessionRef.current = sessionCtrl;
  };

  const handleGenerateCostumes = () => {
    if (isRecording) {
      voiceSessionRef.current?.stop();
      voiceSessionRef.current = null;
      setIsRecording(false);
    }
    const newSession = stylistController.recommend({
      photoUrl: inBodyPhoto,
      inputMode,
      quizAnswers: inQuizAnswers,
      voiceText: inVoicePrompt,
    });
    setSession(newSession);
    setActiveOutfitIdx(0);
    setTryOnSession(null);
  };

  const handleTryOnCostume = async (outfit: Outfit) => {
    setTryOnLoading(true);
    setShowOriginalCompare(false);
    const res = await stylistController.tryOn(inBodyPhoto, outfit);
    setTryOnSession(res);
    setTryOnLoading(false);
    setTimeout(() => {
      previewSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleAddFullCostume = (outfit: Outfit) => {
    outfit.items.forEach((item) => {
      if (item.variant.stock > 0) {
        dispatch(
          cartActions.add({ product: item.product, variant: item.variant })
        );
      }
    });
    dispatch(cartActions.toggle(true));
  };

  const activeOutfit =
    session.recommendedOutfits[activeOutfitIdx] ||
    session.recommendedOutfits[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-12">
      {/* Header */}
      <header className="text-center max-w-3xl mx-auto">
        <span className="text-xs uppercase tracking-widest text-primary font-semibold block mb-2">
          Phòng Tư Vấn Phong Cách & Phối Đồ Cá Nhân Hóa
        </span>
        <h1 className="font-serif text-4xl sm:text-6xl font-normal text-neutral mb-3">
          Stylist Cá Nhân & Phối Bộ Trang Phục
        </h1>
        <p className="text-sm sm:text-base text-base-content/70 leading-relaxed">
          Chụp ảnh trực tiếp qua Camera để phân tích vóc dáng, sau đó chọn{' '}
          <strong>Trả lời 4 câu hỏi định hướng</strong> hoặc{' '}
          <strong>Bật Mic nói trực tiếp / dùng Amical AI Voice (Ctrl + Space)</strong>{' '}
          để nhận 3 bộ trang phục phối sẵn từ kho 334 thiết kế và ướm thử trực tiếp với{' '}
          <strong>Wearson AI</strong>.
        </p>
      </header>

      {/* =================================================================== */}
      {/* STEP 1 & STEP 2: CAPTURE BODY PHOTO + SPECIFY STYLING INTENT        */}
      {/* =================================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (5 cols): Body Photo & Body Analysis */}
        <div className="lg:col-span-5 card bg-base-100 border border-base-300 shadow-md p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-primary font-semibold block">
                Bước 1 • Ảnh chân dung toàn thân
              </span>
              <h2 className="font-serif text-2xl text-neutral">
                Ảnh toàn thân & Phân tích vóc dáng
              </h2>
            </div>
          </div>

          {/* Camera / Photo Stage */}
          <div className="relative rounded-box overflow-hidden bg-base-200 border border-base-300 aspect-[3/4] flex items-center justify-center">
            {cameraActive ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-neutral">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Silhouette alignment frame */}
                <div className="absolute inset-6 border-2 border-dashed border-primary/70 rounded-box pointer-events-none flex items-end justify-center pb-4">
                  <span className="badge badge-neutral text-xs">
                    Căn chỉnh cơ thể vào khung để phân tích tỷ lệ vai – eo – hông
                  </span>
                </div>
                <div className="absolute bottom-4 inset-x-4 flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={captureWebcamSnapshot}
                    className="btn btn-primary btn-sm gap-1.5 shadow-lg"
                  >
                    <Icon name="camera" size={16} />
                    <span>Chụp ảnh ngay</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopWebcam}
                    className="btn btn-neutral btn-sm"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <>
                <img
                  src={inBodyPhoto}
                  alt="Ảnh toàn thân khách hàng"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <span className="badge badge-neutral badge-sm shadow-sm">
                    Đã nhận diện tỷ lệ cơ thể
                  </span>
                </div>
              </>
            )}
          </div>

          {cameraError && (
            <div className="alert alert-warning alert-soft text-xs p-3">
              {cameraError}
            </div>
          )}

          {/* Camera / File Upload / Sample Model Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={startWebcam}
              className="btn btn-outline btn-primary btn-sm gap-1.5"
            >
              <Icon name="camera" size={15} />
              <span>Chụp Webcam trực tiếp</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-outline btn-sm gap-1.5"
            >
              <Icon name="plus" size={15} />
              <span>Tải ảnh từ máy</span>
            </button>
            <input
              ref={fileInputRef}
              hidden
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs text-base-content/60 block">
              Hoặc chọn nhanh ảnh mẫu toàn thân để thử nghiệm:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {sampleModelPhotos.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => {
                    setInBodyPhoto(sample.url);
                    setTryOnSession(null);
                  }}
                  className={`badge cursor-pointer py-2.5 text-xs ${
                    inBodyPhoto === sample.url
                      ? 'badge-primary'
                      : 'badge-outline hover:badge-primary'
                  }`}
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          {/* Body Analysis Summary */}
          <div className="card bg-base-200/70 border border-base-300 p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <strong className="text-neutral uppercase tracking-wider">
                Chỉ số phân tích vóc dáng
              </strong>
              <span className="badge badge-primary badge-xs">Tự động nhận diện</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-base-100 p-2.5 rounded-field border border-base-300">
                <span className="text-base-content/60 block text-[11px]">
                  Dáng người
                </span>
                <strong className="text-neutral">
                  {session.bodyProfile.bodyShape}
                </strong>
              </div>
              <div className="bg-base-100 p-2.5 rounded-field border border-base-300">
                <span className="text-base-content/60 block text-[11px]">
                  Sắc độ da
                </span>
                <strong className="text-neutral">
                  {session.bodyProfile.undertone}
                </strong>
              </div>
            </div>
            <p className="text-base-content/80 leading-relaxed pt-1">
              <strong>Tỷ lệ vai–hông:</strong> {session.bodyProfile.shoulderHipRatio} •{' '}
              <strong>Gợi ý phom dáng:</strong> {session.bodyProfile.recommendedFit}
            </p>
          </div>
        </div>

        {/* Right Column (7 cols): Choose Path 1 (4 Guided Questions) OR Path 2 (Mumble Voice / Mic) */}
        <div className="lg:col-span-7 card bg-base-100 border border-base-300 shadow-md p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs uppercase tracking-wider text-primary font-semibold block">
                Bước 2 • Nhu cầu trang phục
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-neutral">
                Chia sẻ mong muốn phối đồ của bạn
              </h2>
            </div>

            {/* Mode Switcher Tabs: Hướng 1 vs Hướng 2 */}
            <div role="tablist" className="tabs tabs-box bg-base-200 p-1">
              <button
                role="tab"
                type="button"
                onClick={() => setInputMode('quiz')}
                className={`tab tab-sm font-medium ${
                  inputMode === 'quiz' ? 'tab-active' : ''
                }`}
              >
                Hướng 1: 4 Câu hỏi gợi ý
              </button>
              <button
                role="tab"
                type="button"
                onClick={() => {
                  setInputMode('voice');
                  setTimeout(() => voiceTextareaRef.current?.focus(), 50);
                }}
                className={`tab tab-sm font-medium gap-1.5 ${
                  inputMode === 'voice' ? 'tab-active' : ''
                }`}
              >
                <Icon name="mic" size={14} />
                <span>Hướng 2: Giọng nói / Amical AI</span>
              </button>
            </div>
          </div>

          {inputMode === 'quiz' ? (
            /* =============================================================== */
            /* HƯỚNG 1: TRẢ LỜI 4 CÂU HỎI CÓ PHƯƠNG ÁN MẪU                     */
            /* =============================================================== */
            <div className="space-y-5">
              {/* Question 1 */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-base-content/70 block">
                  Câu 1/4: Bạn cần trang phục cho dịp nào?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {QUIZ_QUESTIONS.occasions.map((occ) => (
                    <button
                      key={occ}
                      type="button"
                      onClick={() =>
                        setInQuizAnswers({ ...inQuizAnswers, occasion: occ })
                      }
                      className={`btn btn-sm justify-start text-left h-auto py-2.5 px-3 ${
                        inQuizAnswers.occasion === occ
                          ? 'btn-primary'
                          : 'btn-outline border-base-300'
                      }`}
                    >
                      <span>{occ}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 2 */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-base-content/70 block">
                  Câu 2/4: Phong cách chủ đạo bạn yêu thích?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {QUIZ_QUESTIONS.vibes.map((vibe) => (
                    <button
                      key={vibe}
                      type="button"
                      onClick={() =>
                        setInQuizAnswers({ ...inQuizAnswers, styleVibe: vibe })
                      }
                      className={`btn btn-sm justify-start text-left h-auto py-2.5 px-3 ${
                        inQuizAnswers.styleVibe === vibe
                          ? 'btn-primary'
                          : 'btn-outline border-base-300'
                      }`}
                    >
                      <span>{vibe}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 3 */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-base-content/70 block">
                  Câu 3/4: Ưu tiên tôn dáng hoặc che khuyết điểm nào?
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {QUIZ_QUESTIONS.fitGoals.map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() =>
                        setInQuizAnswers({ ...inQuizAnswers, fitGoal: goal })
                      }
                      className={`btn btn-sm justify-start text-left h-auto py-2.5 px-3 ${
                        inQuizAnswers.fitGoal === goal
                          ? 'btn-primary'
                          : 'btn-outline border-base-300'
                      }`}
                    >
                      <span>{goal}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 4 */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-base-content/70 block">
                  Câu 4/4: Ngân sách dự kiến cho cả bộ phối (3 món)?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {QUIZ_QUESTIONS.budgets.map((b) => (
                    <button
                      key={b.value}
                      type="button"
                      onClick={() =>
                        setInQuizAnswers({
                          ...inQuizAnswers,
                          budgetLimit: b.value,
                        })
                      }
                      className={`btn btn-sm h-auto py-2.5 ${
                        inQuizAnswers.budgetLimit === b.value
                          ? 'btn-primary'
                          : 'btn-outline border-base-300'
                      }`}
                    >
                      <span>{b.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* =============================================================== */
            /* HƯỚNG 2: BẬT MIC NÓI LIÊN TỤC HOẶC DÙNG AMICAL AI VOICE         */
            /* =============================================================== */
            <div className="space-y-4">
              <div className="alert alert-info alert-soft text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`status ${
                      isRecording ? 'status-error animate-ping' : 'status-info'
                    }`}
                  />
                  <span>
                    <strong>Hỗ trợ Amical AI Voice Desktop & Thu âm liên tục:</strong>{' '}
                    Đặt con trỏ vào ô văn bản rồi giữ phím{' '}
                    <kbd className="kbd kbd-xs">Ctrl</kbd>+
                    <kbd className="kbd kbd-xs">Space</kbd> để nói qua Amical (tốc độ cao, nhận diện Whisper tiếng Việt cực chuẩn), hoặc bấm nút{' '}
                    <strong>Bắt đầu thu âm Micro</strong> để nói nhiều câu liên tục (chỉ dừng khi bạn bấm Dừng thu âm).
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-base-content/70">
                    Mong muốn phối đồ của bạn
                  </label>
                  <div className="flex items-center gap-2">
                    {inVoicePrompt && (
                      <button
                        type="button"
                        onClick={() => setInVoicePrompt('')}
                        className="btn btn-ghost btn-xs"
                      >
                        Xóa nội dung
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleToggleVoiceMic}
                      className={`btn btn-xs gap-1.5 ${
                        isRecording
                          ? 'btn-error animate-pulse'
                          : 'btn-outline btn-primary'
                      }`}
                    >
                      <Icon name="mic" size={14} />
                      <span>
                        {isRecording
                          ? 'Đang nghe liên tục… Bấm để dừng'
                          : 'Bắt đầu thu âm Micro'}
                      </span>
                    </button>
                  </div>
                </div>

                <textarea
                  ref={voiceTextareaRef}
                  rows={4}
                  value={inVoicePrompt}
                  onChange={(e) => setInVoicePrompt(e.target.value)}
                  placeholder="Đặt con trỏ tại đây và giữ Ctrl+Space để nói qua Amical AI Voice, hoặc bấm nút Bắt đầu thu âm Micro để nói trực tiếp..."
                  className="textarea textarea-bordered w-full text-sm leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs text-base-content/60 block">
                  Hoặc chọn nhanh một câu mẫu:
                </span>
                <div className="flex flex-col gap-1.5">
                  {SAMPLE_VOICE_INTENTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setInVoicePrompt(prompt)}
                      className="btn btn-ghost btn-xs justify-start text-left h-auto py-2 px-3 border border-base-300 hover:border-primary text-xs font-normal"
                    >
                      “{prompt}”
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2 border-t border-base-300">
            <button
              type="button"
              onClick={handleGenerateCostumes}
              className="btn btn-primary btn-block btn-lg shadow-md gap-2"
            >
              <span>Phân tích Vóc dáng & Phối 3 Bộ Trang Phục Ngay</span>
              <Icon name="arrow" size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* STEP 3: RECOMMENDED COSTUMES (3 Complete Outfits)                   */}
      {/* =================================================================== */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-base-300 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-primary font-semibold block">
              Bước 3 • Gợi ý phối đồ hoàn chỉnh
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-neutral">
              3 Bộ Trang Phục Phối Sẵn Cho Bạn
            </h2>
            <p className="text-xs sm:text-sm text-base-content/70 mt-1">
              Dựa trên dáng <strong>{session.bodyProfile.bodyShape}</strong> • Dịp:{' '}
              <strong>{session.preferences.occasion}</strong> • Phong cách:{' '}
              <strong>{session.preferences.styleVibe}</strong>
            </p>
          </div>

          {/* Costume Selector Tabs */}
          <div role="tablist" className="tabs tabs-box bg-base-200 p-1">
            {session.recommendedOutfits.map((outfit, idx) => (
              <button
                key={outfit.outfitId}
                role="tab"
                type="button"
                onClick={() => setActiveOutfitIdx(idx)}
                className={`tab tab-sm font-semibold ${
                  activeOutfitIdx === idx ? 'tab-active' : ''
                }`}
              >
                Bộ 0{idx + 1} (Phù hợp {outfit.matchScore}%)
              </button>
            ))}
          </div>
        </div>

        {/* Active Costume Showcase Card */}
        {activeOutfit && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch bg-base-100 rounded-box border border-base-300 shadow-xl overflow-hidden p-6 sm:p-10">
            {/* Collage Column (3 Garments in the Costume) */}
            <div className="lg:col-span-7 grid grid-cols-2 gap-3 min-h-[440px]">
              {activeOutfit.items[0] && (
                <figure className="relative row-span-2 rounded-box overflow-hidden bg-base-200 border border-base-300 m-0">
                  <img
                    src={activeOutfit.items[0].product.image}
                    alt={activeOutfit.items[0].product.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="badge badge-neutral absolute top-3 left-3 text-xs">
                    {activeOutfit.items[0].slotRole} (Món chủ đạo)
                  </span>
                </figure>
              )}
              {activeOutfit.items[1] && (
                <figure className="relative rounded-box overflow-hidden bg-base-200 border border-base-300 m-0">
                  <img
                    src={activeOutfit.items[1].product.image}
                    alt={activeOutfit.items[1].product.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="badge badge-neutral badge-sm absolute top-3 left-3 text-xs">
                    {activeOutfit.items[1].slotRole}
                  </span>
                </figure>
              )}
              {activeOutfit.items[2] && (
                <figure className="relative rounded-box overflow-hidden bg-base-200 border border-base-300 m-0">
                  <img
                    src={activeOutfit.items[2].product.image}
                    alt={activeOutfit.items[2].product.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="badge badge-neutral badge-sm absolute top-3 left-3 text-xs">
                    {activeOutfit.items[2].slotRole}
                  </span>
                </figure>
              )}
            </div>

            {/* Copy, Stylist Explanation & Breakdown Column */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="badge badge-primary badge-sm font-semibold">
                    Độ hợp dáng: {activeOutfit.matchScore}%
                  </span>
                  {activeOutfit.matchBadges.map((b) => (
                    <span key={b} className="badge badge-ghost badge-sm text-xs">
                      {b}
                    </span>
                  ))}
                </div>

                <h3 className="font-serif text-3xl font-normal text-neutral mb-2">
                  {activeOutfit.title}
                </h3>
                <p className="text-sm text-base-content/80 leading-relaxed bg-base-200/60 p-3.5 rounded-field border border-base-300">
                  <strong>Nhận xét từ Stylist:</strong> {activeOutfit.stylistNote}
                </p>

                {/* Individual Item Breakdown */}
                <div className="divide-y divide-base-300 border-y border-base-300 mt-5">
                  {activeOutfit.items.map((item) => (
                    <div
                      key={item.outfitItemId}
                      className="py-3 flex items-center justify-between text-sm gap-2"
                    >
                      <div className="min-w-0">
                        <span className="badge badge-outline badge-xs mr-2">
                          {item.slotRole}
                        </span>
                        <Link
                          href={`/product/${item.product.productId}`}
                          className="font-medium text-base-content hover:text-primary transition-colors"
                        >
                          {item.product.name}
                        </Link>
                        <div className="text-xs text-base-content/60">
                          Màu: {item.variant.colorName} • Size khuyến nghị:{' '}
                          {item.variant.size}
                        </div>
                      </div>
                      <span className="font-semibold text-base-content whitespace-nowrap">
                        {money(item.variant.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing & Dual CTA: Wearson AI Try-On + Batch Add to Cart */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-base-content/70">
                    Tổng trọn bộ ({activeOutfit.items.length} món đồ)
                  </span>
                  <strong className="text-2xl font-bold text-primary">
                    {money(activeOutfit.totalPrice)}
                  </strong>
                </div>

                <button
                  type="button"
                  disabled={tryOnLoading}
                  onClick={() => handleTryOnCostume(activeOutfit)}
                  className="btn btn-neutral btn-block btn-lg shadow-md gap-2"
                >
                  {tryOnLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm" />
                      <span>Wearson AI đang ghép bộ trang phục lên ảnh của bạn…</span>
                    </>
                  ) : (
                    <>
                      <Icon name="camera" size={18} />
                      <span>Thử trực tiếp bộ này với Wearson AI</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleAddFullCostume(activeOutfit)}
                  className="btn btn-primary btn-block gap-2"
                >
                  <Icon name="bag" size={18} />
                  <span>Thêm trọn bộ vào túi mua sắm</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* =================================================================== */}
      {/* STEP 4: VIRTUAL TRY-ON PREVIEW                                      */}
      {/* =================================================================== */}
      <div ref={previewSectionRef}>
        {tryOnSession && (
          <section className="card bg-base-100 border-2 border-primary/40 shadow-2xl p-6 sm:p-10 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-base-300 pb-4">
              <div>
                <span className="badge badge-primary badge-sm mb-1">
                  Phòng Thử Đồ Ảo Wearson AI
                </span>
                <h2 className="font-serif text-3xl text-neutral">
                  Kết quả Mặc thử Trực tiếp với Wearson AI
                </h2>
                <p className="text-xs sm:text-sm text-base-content/70">
                  {tryOnSession.drapeNote}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowOriginalCompare(!showOriginalCompare)}
                  className="btn btn-outline btn-sm gap-1.5"
                >
                  <span>
                    {showOriginalCompare
                      ? 'Xem ảnh đã mặc thử (Wearson AI)'
                      : 'So sánh với ảnh gốc'}
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 flex justify-center bg-base-200 rounded-box p-4 border border-base-300">
                <img
                  src={
                    showOriginalCompare
                      ? tryOnSession.userImageUrl
                      : tryOnSession.resultImageUrl
                  }
                  alt="Kết quả thử đồ Wearson AI"
                  className="max-h-[580px] rounded-field shadow-lg object-contain"
                />
              </div>

              <div className="lg:col-span-5 space-y-5">
                <div className="stats stats-vertical shadow-xs border border-base-300 w-full bg-base-200/40">
                  <div className="stat py-3">
                    <div className="stat-title text-xs">
                      Độ tương thích phom dáng (Wearson AI Fit Score)
                    </div>
                    <div className="stat-value text-primary font-serif text-3xl">
                      {tryOnSession.fitConfidence}%
                    </div>
                    <div className="stat-desc text-success">
                      Cân đối chiều dài lưng, bờ vai và độ rủ vải
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-base-content/80">
                  <p>
                    <strong>Bộ trang phục đang ướm thử:</strong> {activeOutfit.title}
                  </p>
                  <p>
                    <strong>Trạng thái mô phỏng:</strong>{' '}
                    <span className="badge badge-success badge-xs">
                      Hoàn tất
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddFullCostume(activeOutfit)}
                  className="btn btn-primary btn-block btn-lg shadow-md gap-2"
                >
                  <Icon name="bag" size={18} />
                  <span>
                    Ưng ý bộ này • Thêm cả {activeOutfit.items.length} món vào túi (
                    {money(activeOutfit.totalPrice)})
                  </span>
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
