'use client';

import Link from 'next/link';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import type { Product, ProductVariant } from '@/domain/models';
import { products, money } from '@/lib/catalog';
import { cartActions } from '@/store/store';
import { Icon } from '@/components/icons';
import {
  getDecartStatus,
  executeDecartTryOn,
  DecartRealtimeController,
  type DecartStatus,
} from '@/services/decart-client';
import {
  startContinuousVoiceSession,
  type ContinuousSpeechController,
} from '@/services/interfaces';

// Guided styling criteria
const STYLING_CRITERIA = {
  occasions: [
    { id: 'cong-so', label: 'Công sở & Gặp đối tác', desc: 'Thanh lịch, chỉn chu, chuyên nghiệp' },
    { id: 'dao-pho', label: 'Dạo phố & Cà phê cuối tuần', desc: 'Thoải mái, phóng khoáng, tự tin' },
    { id: 'du-tiec', label: 'Tiệc tối & Sự kiện sang trọng', desc: 'Quyến rũ, tinh tế, nổi bật' },
    { id: 'du-lich', label: 'Du lịch & Nghỉ dưỡng', desc: 'Nhẹ nhàng, thoáng mát, năng động' },
  ],
  vibes: [
    { id: 'minimalist', label: 'Tối giản (Minimalist)', desc: 'Đường cắt dứt khoát, gam màu đơn sắc' },
    { id: 'smart-casual', label: 'Thanh lịch (Smart-Casual)', desc: 'Cân bằng giữa trang trọng và hiện đại' },
    { id: 'romantic', label: 'Nữ tính & Mềm mại (Silk & Flow)', desc: 'Chất vải rủ nhẹ, đường cong mềm' },
    { id: 'tailored', label: 'Sắc sảo (Modern Tailored)', desc: 'Phom dáng cấu trúc, blazer tôn dáng' },
  ],
  budgets: [
    { label: 'Dưới 3.000.000₫', value: 3000000 },
    { label: 'Dưới 4.500.000₫', value: 4500000 },
    { label: 'Dưới 6.500.000₫', value: 6500000 },
    { label: 'Không giới hạn', value: 12000000 },
  ],
  colors: [
    { id: 'trang', label: 'Trắng / kem', hex: '#f8f6f0' },
    { id: 'den', label: 'Đen', hex: '#1a1a1a' },
    { id: 'be', label: 'Be / Sand', hex: '#d9cdb8' },
    { id: 'xam', label: 'Xám ghi', hex: '#8c8c8c' },
    { id: 'xanh', label: 'Xanh Navy / Denim', hex: '#2b425b' },
    { id: 'nau', label: 'Nâu Caramel', hex: '#7a4e32' },
    { id: 'do', label: 'Đỏ rượu / Burgundy', hex: '#722f37' },
  ],
};

const SAMPLE_MODELS = [
  {
    id: 'hourglass',
    name: 'Mẫu 01 (Đồng hồ cát)',
    badge: 'Tôn vòng eo',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=720&q=80',
  },
  {
    id: 'pear',
    name: 'Mẫu 02 (Dáng Quả lê)',
    badge: 'Cân đối bờ vai',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=720&q=80',
  },
  {
    id: 'rect',
    name: 'Mẫu 03 (Thanh mảnh)',
    badge: 'Phom suông hiện đại',
    photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=720&q=80',
  },
  {
    id: 'smart',
    name: 'Mẫu 04 (Nam lịch lãm)',
    badge: 'Modern Tailored',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=720&q=80',
  },
];

type SlotKey = 'top' | 'bottom' | 'outer' | 'acc';

interface SlotDefinition {
  key: SlotKey;
  title: string;
  categorySlug: string;
  badge: string;
  iconName: 'spark' | 'filter' | 'heart' | 'arrow';
}

const SLOTS: SlotDefinition[] = [
  { key: 'top', title: 'Áo Chủ Đạo', categorySlug: 'ao', badge: 'Món trung tâm', iconName: 'spark' },
  { key: 'bottom', title: 'Quần / Chân Váy', categorySlug: 'quan', badge: 'Tôn phom dáng', iconName: 'filter' },
  { key: 'outer', title: 'Áo Khoác Ngoài', categorySlug: 'ao-khoac', badge: 'Điểm nhấn Layer', iconName: 'heart' },
  { key: 'acc', title: 'Giày & Phụ Kiện', categorySlug: 'giay', badge: 'Hoàn thiện set', iconName: 'arrow' },
];

export default function OutfitsPage() {
  const occasionInputName = useId();
  const vibeInputName = useId();
  const budgetInputName = useId();
  const colorInputName = useId();
  const dispatch = useDispatch();

  // 1. User Styling Criteria
  const [occasion, setOccasion] = useState(STYLING_CRITERIA.occasions[0].label);
  const [vibe, setVibe] = useState(STYLING_CRITERIA.vibes[0].label);
  const [budgetLimit, setBudgetLimit] = useState(STYLING_CRITERIA.budgets[1].value);
  const [preferredColors, setPreferredColors] = useState<string[]>(['trang', 'den', 'be']);
  const [activeSlotTab, setActiveSlotTab] = useState<SlotKey>('top');
  const [customVoicePrompt, setCustomVoicePrompt] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceStarting, setVoiceStarting] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const voiceSessionRef = useRef<ContinuousSpeechController | null>(null);

  // 2. Real product pools grouped by category
  const topsPool = useMemo(() => products.filter((p) => p.categorySlug === 'ao'), []);
  const bottomsPool = useMemo(
    () => products.filter((p) => p.categorySlug === 'quan' || p.categorySlug === 'vay'),
    []
  );
  const outersPool = useMemo(() => products.filter((p) => p.categorySlug === 'ao-khoac'), []);
  const accPool = useMemo(
    () => products.filter((p) => p.categorySlug === 'giay' || p.categorySlug === 'phu-kien'),
    []
  );

  // 3. User Selected Items in Outfit (defaults to matching first set)
  const [selectedTop, setSelectedTop] = useState<Product | null>(topsPool[0] || null);
  const [selectedBottom, setSelectedBottom] = useState<Product | null>(bottomsPool[0] || null);
  const [selectedOuter, setSelectedOuter] = useState<Product | null>(outersPool[0] || null);
  const [selectedAcc, setSelectedAcc] = useState<Product | null>(accPool[0] || null);

  // Search/filter within active slot
  const [slotSearch, setSlotSearch] = useState('');

  // 4. Decart Virtual Try-On States
  const [decartStatus, setDecartStatus] = useState<DecartStatus | null>(null);
  const [tryOnGarment, setTryOnGarment] = useState<Product | null>(selectedTop);
  const [userBodyPhoto, setUserBodyPhoto] = useState<string>(SAMPLE_MODELS[0].photo);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [realtimeMsg, setRealtimeMsg] = useState('Sẵn sàng kết nối tới Decart Lucy V-TON 3.5');
  const [liveLatency, setLiveLatency] = useState<number | null>(null);
  const [tryOnProcessing, setTryOnProcessing] = useState(false);
  const [tryOnResultImage, setTryOnResultImage] = useState<string | null>(null);
  const [showOriginalCompare, setShowOriginalCompare] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewStreamRef = useRef<MediaStream | null>(null);
  const [cameraConnecting, setCameraConnecting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const decartControllerRef = useRef<DecartRealtimeController | null>(null);
  const tryOnSectionRef = useRef<HTMLDivElement>(null);

  // Init Decart status
  useEffect(() => {
    getDecartStatus().then((st) => setDecartStatus(st)).catch(() => {});
  }, []);

  // Sync tryOnGarment when selectedTop changes if not set
  useEffect(() => {
    if (selectedTop && !tryOnGarment) {
      setTryOnGarment(selectedTop);
    }
  }, [selectedTop, tryOnGarment]);

  // Cleanups
  useEffect(() => {
    return () => {
      voiceSessionRef.current?.stop();
      decartControllerRef.current?.disconnect();
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Compute total price of current outfit
  const currentOutfitItems = useMemo(
    () => [selectedTop, selectedBottom, selectedOuter, selectedAcc].filter(Boolean) as Product[],
    [selectedTop, selectedBottom, selectedOuter, selectedAcc]
  );

  const totalOutfitPrice = useMemo(
    () => currentOutfitItems.reduce((sum, item) => sum + item.price, 0),
    [currentOutfitItems]
  );

  // Compute match score and dynamic stylist commentary
  const matchEvaluation = useMemo(() => {
    let score = 92;
    const badges: string[] = [];

    if (totalOutfitPrice <= budgetLimit) {
      score += 4;
      badges.push('Chuẩn ngân sách');
    } else {
      score -= 3;
      badges.push('Vượt ngân sách nhẹ');
    }

    if (selectedTop && selectedBottom) {
      score += 2;
      badges.push('Tương phản phom dáng');
    }
    if (selectedOuter) {
      badges.push('Layer cấu trúc');
    }

    const clampedScore = Math.min(99, Math.max(75, score));

    const note = `Set đồ được phối theo phong cách ${vibe} dành cho dịp ${occasion}. Áo ${
      selectedTop?.name?.split('—')?.[0] || 'chủ đạo'
    } kết hợp cùng ${selectedBottom?.name?.split('—')?.[0] || 'quần/váy'} tạo tỷ lệ thị giác thanh thoát, tôn dáng. ${
      selectedOuter ? `Lớp áo khoác ${selectedOuter.name.split('—')[0]} tạo điểm nhấn layer chuyên nghiệp.` : ''
    } Chất vải cao cấp, độ rủ tự nhiên phù hợp khí hậu và chuyển động suốt ngày dài.`;

    return { score: clampedScore, badges, note };
  }, [occasion, vibe, budgetLimit, totalOutfitPrice, selectedTop, selectedBottom, selectedOuter]);

  // Slot pools sorted/filtered by criteria
  const getSlotPool = (slot: SlotKey): Product[] => {
    let pool: Product[] = [];
    if (slot === 'top') pool = topsPool;
    else if (slot === 'bottom') pool = bottomsPool;
    else if (slot === 'outer') pool = outersPool;
    else if (slot === 'acc') pool = accPool;

    if (!slotSearch.trim()) return pool;
    const q = slotSearch.toLowerCase().trim();
    return pool.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  };

  // Smart Auto-Mix: 1-click intelligent outfit composition based on criteria
  const handleAutoMix = () => {
    // Pick optimal top
    const topCandidates = topsPool.filter((p) => p.price <= budgetLimit * 0.4);
    const chosenTop = topCandidates[Math.floor(Math.random() * Math.min(6, topCandidates.length))] || topsPool[0];

    // Pick optimal bottom
    const bottomCandidates = bottomsPool.filter((p) => p.price <= budgetLimit * 0.35);
    const chosenBottom = bottomCandidates[Math.floor(Math.random() * Math.min(6, bottomCandidates.length))] || bottomsPool[0];

    // Pick optimal outer
    const remainingBudget = budgetLimit - (chosenTop?.price || 0) - (chosenBottom?.price || 0);
    const outerCandidates = outersPool.filter((p) => p.price <= Math.max(remainingBudget, 2500000));
    const chosenOuter = outerCandidates[Math.floor(Math.random() * Math.min(4, outerCandidates.length))] || outersPool[0];

    // Pick optimal accessory
    const chosenAcc = accPool[Math.floor(Math.random() * Math.min(5, accPool.length))] || accPool[0];

    if (chosenTop) setSelectedTop(chosenTop);
    if (chosenBottom) setSelectedBottom(chosenBottom);
    if (chosenOuter) setSelectedOuter(chosenOuter);
    if (chosenAcc) setSelectedAcc(chosenAcc);
    if (chosenTop) setTryOnGarment(chosenTop);
  };

  // Select an item for active slot - Tự động mặc đồ mới ngay trên camera nếu đang mở
  const handleSelectItemForSlot = (slot: SlotKey, item: Product) => {
    if (slot === 'top') setSelectedTop(item);
    else if (slot === 'bottom') setSelectedBottom(item);
    else if (slot === 'outer') setSelectedOuter(item);
    else if (slot === 'acc') setSelectedAcc(item);

    // Cập nhật trang phục đang thử
    setTryOnGarment(item);

    // BƯỚC 4: Bắn lệnh setImage mới qua Data Channel mà KHÔNG cần kết nối lại camera
    if (decartControllerRef.current) {
      decartControllerRef.current.setImage(item.image, `Wearing ${item.name}`);
    }
  };

  // Add full coordinated outfit to bag
  const handleAddFullOutfitToCart = () => {
    currentOutfitItems.forEach((product) => {
      const activeVariant =
        product.variants.find((v) => v.stock > 0) || product.variants[0];
      if (activeVariant) {
        dispatch(cartActions.add({ product, variant: activeVariant }));
      }
    });
    dispatch(cartActions.toggle(true));
  };

  // Scroll to try on room with current outfit
  const handleGoToTryOn = (garmentToTry?: Product) => {
    if (garmentToTry) {
      setTryOnGarment(garmentToTry);
      if (decartControllerRef.current) {
        decartControllerRef.current.setImage(garmentToTry.image, `Wearing ${garmentToTry.name}`);
      }
    }
    setTimeout(() => {
      tryOnSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  // Webcam Controls for Realtime Try-On: BƯỚC 3 theo đúng chuẩn Decart Anywear
  const startRealtimeWebcam = async () => {
    if (cameraConnecting) return;
    setCameraConnecting(true);
    setLiveLatency(null);
    setCameraError(null);
    try {
      const status = await getDecartStatus();
      setDecartStatus(status);
      if (!status.configured) throw new Error(status.message || 'Chưa cấu hình Decart.');
      const isMobile = window.innerWidth <= 768;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: isMobile ? 624 : 1088 },
          height: { ideal: isMobile ? 1088 : 624 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
      });
      setCameraActive(true);
      previewStreamRef.current = stream;

      // Khởi tạo Decart Realtime Controller với remote stream và latency callback
      if (!decartControllerRef.current) {
        decartControllerRef.current = new DecartRealtimeController(
          (remoteStream) => {
            // Nhận luồng video AI đã khoác áo stream ngược về từ Decart
            previewStreamRef.current = remoteStream;
            if (videoRef.current) {
              videoRef.current.srcObject = remoteStream;
              videoRef.current.play().catch(() => {});
            }
          },
          (status, message) => {
            setRealtimeConnected(status === 'connected');
            if (status === 'error') setCameraError(message || 'Decart gặp lỗi.');
            if (message) setRealtimeMsg(message);
          },
          (latency) => {
            setLiveLatency(latency);
          }
        );
      }

      const garmentImg = tryOnGarment?.image || selectedTop?.image || '';
      const prompt = `Virtual try-on of ${tryOnGarment?.name || 'outfit'}, natural fabric drape and realistic fit`;
      const connected = await decartControllerRef.current.connect(stream, garmentImg, prompt);
      if (!connected) setCameraActive(false);
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : 'Không thể mở webcam hoặc kết nối Decart.');
      setCameraActive(false);
    } finally {
      setCameraConnecting(false);
    }
  };

  const stopRealtimeWebcam = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
    }
    decartControllerRef.current?.disconnect();
    setCameraActive(false);
    setRealtimeConnected(false);
    setRealtimeMsg('Đã dừng camera gương thử đồ.');
  };

  // Capture snapshot from webcam
  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setUserBodyPhoto(dataUrl);
      stopRealtimeWebcam();
      // Run Decart try-on job with snapshot

    }
  };

  // Run Decart Photo Try-On Job
  const runDecartPhotoTryOn = async (overridePhoto?: string) => {
    const photo = overridePhoto || userBodyPhoto;
    const garment = tryOnGarment || selectedTop;
    if (!photo || !garment) return;

    setCameraError(null);
    setTryOnProcessing(true);
    setShowOriginalCompare(false);
    try {
      const res = await executeDecartTryOn({
        userImageUrl: photo,
        garmentImageUrl: garment.image,
        prompt: `Photorealistic virtual try-on of ${garment.name}, perfect drape and lighting`,
        category: garment.categorySlug,
        resolution: '720p',
      });
      setTryOnResultImage(res.resultImageUrl);
    } catch (err: any) {
      console.warn('Decart Try-On note:', err);
      setTryOnResultImage(null);
      setCameraError(err instanceof Error ? err.message : 'Không xử lý được ảnh thử đồ.');
    } finally {
      setTryOnProcessing(false);
    }
  };

  // Toggle Voice Mic for criteria
  const handleToggleVoice = () => {
    if (voiceSessionRef.current) {
      voiceSessionRef.current.stop();
      voiceSessionRef.current = null;
      setIsRecording(false);
      setVoiceStarting(false);
      return;
    }
    setVoiceError(null);
    setVoiceStarting(true);
    let ended = false;
    const controller = startContinuousVoiceSession(
      customVoicePrompt,
      setCustomVoicePrompt,
      (listening) => {
        setIsRecording(listening);
        setVoiceStarting(false);
        if (!listening) { ended = true; voiceSessionRef.current = null; }
      },
      setVoiceError,
    );
    voiceSessionRef.current = controller.isSupported && !ended ? controller : null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
      {/* Page Title & Mission */}
      <header className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
          <Icon name="spark" size={14} />
          <span>Stylist Cá Nhân Hóa & Đề Xuất Phối Đồ Thông Minh</span>
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-neutral font-normal tracking-tight">
          Chọn Gợi Ý • Đề Xuất Trọn Bộ Hoàn Hảo
        </h1>
        <p className="text-sm sm:text-base text-base-content/75 leading-relaxed">
          Xác định tiêu chí của bạn, chọn các món đồ gợi ý cho từng vị trí trang phục. AI Stylist sẽ tự động phân tích và đề xuất bộ trang phục chuẩn phom dáng, phối màu và ngân sách. Sau đó thử đồ trực tiếp qua <strong>Decart AI Lucy VTON</strong>.
        </p>
      </header>

      {/* ===================================================================== */}
      {/* SECTION 1: TIÊU CHÍ PHỐI ĐỒ (STYLING CRITERIA)                        */}
      {/* ===================================================================== */}
      <section className="card bg-base-100 border border-base-300 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-primary font-bold block mb-1">
              Bước 1 • Tiêu chí phối đồ của bạn
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-neutral">
              Bạn muốn diện trang phục cho hoàn cảnh nào?
            </h2>
          </div>
          <button
            type="button"
            onClick={handleAutoMix}
            className="btn btn-primary btn-sm sm:btn-md gap-2 shadow-xs"
          >
            <Icon name="spark" size={16} />
            <span>AI Tự Động Phối Trọn Bộ Ngay</span>
          </button>
        </div>

        {/* Criteria Selectors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Occasion */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-base-content/70 block">
              Dịp diện đồ
            </label>
            <div className="space-y-1.5">
              {STYLING_CRITERIA.occasions.map((occ) => {
                const isSelected = occasion === occ.label;
                return (
                  <button
                    key={occ.id}
                    type="button"
                    onClick={() => setOccasion(occ.label)}
                    className={`w-full text-left p-2.5 rounded-box border transition-all text-xs flex flex-col gap-0.5 ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-base-300 hover:border-base-content/40 bg-base-200/40 text-base-content'
                    }`}
                  >
                    <span className="font-medium text-[13px]">{occ.label}</span>
                    <span className="text-[11px] opacity-70 line-clamp-1">{occ.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Style / Vibe */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-base-content/70 block">
              Phong cách & Vibe
            </label>
            <div className="space-y-1.5">
              {STYLING_CRITERIA.vibes.map((v) => {
                const isSelected = vibe === v.label;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVibe(v.label)}
                    className={`w-full text-left p-2.5 rounded-box border transition-all text-xs flex flex-col gap-0.5 ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-base-300 hover:border-base-content/40 bg-base-200/40 text-base-content'
                    }`}
                  >
                    <span className="font-medium text-[13px]">{v.label}</span>
                    <span className="text-[11px] opacity-70 line-clamp-1">{v.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Budget */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-base-content/70 block">
              Ngân sách trọn bộ
            </label>
            <div className="space-y-1.5">
              {STYLING_CRITERIA.budgets.map((b) => {
                const isSelected = budgetLimit === b.value;
                return (
                  <button
                    key={b.value}
                    type="button"
                    onClick={() => setBudgetLimit(b.value)}
                    className={`w-full text-left p-2.5 rounded-box border transition-all text-xs flex items-center justify-between ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-base-300 hover:border-base-content/40 bg-base-200/40 text-base-content'
                    }`}
                  >
                    <span>{b.label}</span>
                    {isSelected && <span className="badge badge-primary badge-xs">Đang chọn</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Preferred Colors & Voice */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-base-content/70 block">
              Tone màu chủ đạo
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {STYLING_CRITERIA.colors.map((c) => {
                const isSelected = preferredColors.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setPreferredColors(
                        isSelected ? preferredColors.filter((id) => id !== c.id) : [...preferredColors, c.id]
                      );
                    }}
                    className={`text-left p-2 rounded-box border transition-all text-xs flex items-center gap-2 ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-base-300 hover:border-base-content/40 bg-base-200/40 text-base-content'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-base-content/20 shadow-xs shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="truncate text-[11px]">{c.label}</span>
                  </button>
                );
              })}
            </div>

            {voiceError && (
              <div role="alert" className="alert alert-warning alert-soft text-sm">{voiceError}</div>
            )}

            {/* Voice input prompt */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleToggleVoice}
                aria-pressed={isRecording || voiceStarting}
                className={`btn btn-xs w-full gap-1.5 ${
                  isRecording ? 'btn-error animate-pulse' : 'btn-outline border-base-300'
                }`}
              >
                <Icon name="mic" size={13} />
                <span>{voiceStarting ? 'Đang mở mic… Bấm để hủy' : isRecording ? 'Đang nghe… Bấm để dừng' : 'Thêm ghi chú bằng giọng nói'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SECTION 2: BỘ TRANG PHỤC ĐỀ XUẤT HOÀN CHỈNH (PROPOSED OUTFIT CARD)   */}
      {/* ===================================================================== */}
      <section className="card bg-base-100 border-2 border-primary/30 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-base-300 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-primary font-semibold">
                Điểm phù hợp: {matchEvaluation.score}/100
              </span>
              {matchEvaluation.badges.map((b) => (
                <span key={b} className="badge badge-outline badge-sm">
                  {b}
                </span>
              ))}
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-neutral font-normal">
              Bộ Trang Phục Đề Xuất Theo Tiêu Chí Của Bạn
            </h2>
          </div>

          {/* Pricing & Quick Try-On CTA */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right pr-2">
              <span className="text-xs text-base-content/60 block">Tổng chi phí ({currentOutfitItems.length} món)</span>
              <span className="font-serif text-2xl sm:text-3xl font-bold text-primary">
                {money(totalOutfitPrice)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleGoToTryOn(selectedTop || undefined)}
              className="btn btn-neutral btn-sm sm:btn-md gap-2 shadow-md"
            >
              <Icon name="camera" size={17} />
              <span>Thử Đồ Realtime Với Decart AI</span>
            </button>

            <button
              type="button"
              onClick={handleAddFullOutfitToCart}
              className="btn btn-primary btn-sm sm:btn-md gap-2 shadow-md"
            >
              <Icon name="bag" size={17} />
              <span>Thêm Cả Bộ Vào Giỏ</span>
            </button>
          </div>
        </div>

        {/* Composite Outfit Layout (Collage of the Selected Slot Items) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Collage Display (7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-base-200/50 p-4 rounded-box border border-base-300">
            {SLOTS.map((slot) => {
              const item =
                slot.key === 'top'
                  ? selectedTop
                  : slot.key === 'bottom'
                  ? selectedBottom
                  : slot.key === 'outer'
                  ? selectedOuter
                  : selectedAcc;

              return (
                <div
                  key={slot.key}
                  onClick={() => setActiveSlotTab(slot.key)}
                  className={`relative rounded-box overflow-hidden border bg-base-100 flex flex-col cursor-pointer transition-all ${
                    activeSlotTab === slot.key
                      ? 'border-primary ring-2 ring-primary/30 shadow-md'
                      : 'border-base-300 hover:border-base-content/40'
                  }`}
                >
                  <figure className="relative aspect-[3/4] bg-base-200 m-0 overflow-hidden">
                    {item ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-base-content/50 p-2 text-center">
                        Chưa chọn món
                      </div>
                    )}
                    <span className="badge badge-neutral badge-xs absolute top-2 left-2 shadow-xs">
                      {slot.title}
                    </span>
                  </figure>
                  <div className="p-2 space-y-1">
                    <p className="text-xs font-semibold text-base-content line-clamp-1">
                      {item ? item.name : `Chọn ${slot.title}`}
                    </p>
                    <span className="text-xs text-primary font-bold block">
                      {item ? money(item.price) : '0₫'}
                    </span>
                    <span className="text-[10px] text-base-content/60 block underline">
                      Bấm để đổi gợi ý khác
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stylist Commentary & Detailed Breakdown (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-box p-4 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Icon name="spark" size={14} />
                <span>Nhận Xét Từ AI Stylist:</span>
              </span>
              <p className="text-xs sm:text-sm text-base-content/85 leading-relaxed">
                {matchEvaluation.note}
              </p>
            </div>

            {/* Itemized List with Direct Try-On triggers */}
            <div className="divide-y divide-base-300 border-y border-base-300">
              {currentOutfitItems.map((prod) => (
                <div key={prod.productId} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-10 h-10 object-cover rounded-field border border-base-300 shrink-0"
                    />
                    <div className="min-w-0">
                      <Link
                        href={`/product/${prod.productId}`}
                        className="font-semibold text-base-content hover:text-primary transition-colors line-clamp-1"
                      >
                        {prod.name}
                      </Link>
                      <span className="text-base-content/60 block">{prod.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-base-content">{money(prod.price)}</span>
                    <button
                      type="button"
                      onClick={() => handleGoToTryOn(prod)}
                      title="Thử riêng món này với Decart AI"
                      className="btn btn-ghost btn-xs text-primary gap-1"
                    >
                      <Icon name="camera" size={13} />
                      <span>Thử món này</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Budget Progress Bar */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-xs text-base-content/70">
                <span>Ngân sách sử dụng</span>
                <span>
                  <strong>{money(totalOutfitPrice)}</strong> / {money(budgetLimit)}
                </span>
              </div>
              <progress
                className={`progress w-full ${
                  totalOutfitPrice <= budgetLimit ? 'progress-primary' : 'progress-warning'
                }`}
                value={totalOutfitPrice}
                max={budgetLimit}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SECTION 3: KHUNG CHỌN GỢI Ý MÓN ĐỒ THEO TỪNG VỊ TRÍ (SLOT PICKERS)    */}
      {/* ===================================================================== */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 pb-3">
          <div>
            <span className="text-xs uppercase tracking-wider text-primary font-bold block mb-1">
              Bước 2 • Danh mục gợi ý từng món
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-neutral">
              Chọn món đồ bạn ưng ý vào từng vị trí
            </h2>
            <p className="text-xs text-base-content/70">
              Nhấp vào sản phẩm bất kỳ để đưa vào bộ trang phục đề xuất bên trên.
            </p>
          </div>

          {/* Slot Tabs */}
          <div role="tablist" className="tabs tabs-box bg-base-200 p-1">
            {SLOTS.map((slot) => {
              const isActive = activeSlotTab === slot.key;
              return (
                <button
                  key={slot.key}
                  role="tab"
                  type="button"
                  onClick={() => {
                    setActiveSlotTab(slot.key);
                    setSlotSearch('');
                  }}
                  className={`tab tab-sm font-semibold gap-1.5 ${isActive ? 'tab-active' : ''}`}
                >
                  <Icon name={slot.iconName} size={14} />
                  <span>{slot.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Slot Info */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-base-content/70">
            <span className="badge badge-neutral badge-sm">
              Đang xem gợi ý: {SLOTS.find((s) => s.key === activeSlotTab)?.title}
            </span>
            <span>({getSlotPool(activeSlotTab).length} sản phẩm thật có sẵn)</span>
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={slotSearch}
              onChange={(e) => setSlotSearch(e.target.value)}
              placeholder="Tìm kiếm trong danh mục này..."
              className="input input-bordered input-sm w-full pr-8 text-xs"
            />
            {slotSearch && (
              <button
                type="button"
                onClick={() => setSlotSearch('')}
                className="absolute right-2 top-2 text-base-content/50 hover:text-base-content"
              >
                <Icon name="close" size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Suggestion Products Grid for Active Slot */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {getSlotPool(activeSlotTab).slice(0, 24).map((product) => {
            const isCurrentlySelected =
              activeSlotTab === 'top'
                ? selectedTop?.productId === product.productId
                : activeSlotTab === 'bottom'
                ? selectedBottom?.productId === product.productId
                : activeSlotTab === 'outer'
                ? selectedOuter?.productId === product.productId
                : selectedAcc?.productId === product.productId;

            return (
              <div
                key={product.productId}
                onClick={() => handleSelectItemForSlot(activeSlotTab, product)}
                className={`card card-compact border transition-all duration-200 cursor-pointer overflow-hidden group ${
                  isCurrentlySelected
                    ? 'border-primary ring-2 ring-primary/40 bg-primary/5 shadow-md'
                    : 'border-base-300 hover:border-base-content/40 bg-base-100 hover:shadow-xs'
                }`}
              >
                <figure className="relative aspect-[3/4] bg-base-200 m-0 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {isCurrentlySelected ? (
                    <span className="badge badge-primary badge-xs absolute top-2 right-2 font-bold shadow-xs">
                      Đang chọn
                    </span>
                  ) : (
                    <span className="badge badge-neutral/80 badge-xs absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      Bấm để chọn
                    </span>
                  )}
                  {product.colors?.[1] && (
                    <span className="badge badge-ghost badge-xs absolute bottom-2 left-2 text-[10px] bg-base-100/80 backdrop-blur-xs">
                      {product.colors[1]}
                    </span>
                  )}
                </figure>
                <div className="p-2.5 space-y-1">
                  <p className="text-xs font-semibold text-base-content line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {product.name}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-neutral">{money(product.price)}</span>
                    <span className="text-[10px] text-base-content/60">{product.category}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SECTION 4: PHÒNG THỬ ĐỒ REALTIME VỚI DECART AI (LUCY VTON 3.6)         */}
      {/* ===================================================================== */}
      <div ref={tryOnSectionRef}>
        <section className="card bg-base-100 border-2 border-primary/40 shadow-2xl overflow-hidden p-6 sm:p-10 space-y-8">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-base-300 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="badge badge-primary text-xs font-bold">
                  Decart AI • Lucy VTON 3.5
                </span>
                <span
                  className={`badge badge-sm ${
                    decartStatus?.configured ? 'badge-success' : 'badge-neutral'
                  }`}
                >
                  {decartStatus?.configured ? 'Đã lưu khóa • Chưa xác minh' : 'Chưa cấu hình / API lỗi'}
                </span>
                <span className="badge badge-outline badge-sm">Realtime Neural Stream</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl text-neutral">
                Phòng Thử Đồ Realtime Với Decart AI
              </h2>
              <p className="text-xs sm:text-sm text-base-content/75">
                Mô phỏng trực tiếp phom dáng trang phục khách hàng vừa phối lên cơ thể theo thời gian thực.
              </p>
            </div>

            {/* Active Garment Under Try-On */}
            {tryOnGarment && (
              <div className="flex items-center gap-3 bg-base-200/70 p-2.5 rounded-box border border-base-300">
                <img
                  src={tryOnGarment.image}
                  alt={tryOnGarment.name}
                  className="w-12 h-14 object-cover rounded-field border border-base-300"
                />
                <div className="text-xs max-w-[200px]">
                  <span className="text-[10px] text-primary font-bold uppercase block">Món đang thử:</span>
                  <p className="font-semibold text-base-content truncate">{tryOnGarment.name}</p>
                  <span className="text-base-content/60">{money(tryOnGarment.price)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Garment Switcher: Switch between pieces of the current outfit */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-base-content/80 block">
              Chọn món trong bộ phối để ướm thử ngay trên gương:
            </span>
            <div className="flex flex-wrap gap-2">
              {currentOutfitItems.map((item) => {
                const isSelected = tryOnGarment?.productId === item.productId;
                return (
                  <button
                    key={item.productId}
                    type="button"
                    onClick={() => {
                      setTryOnGarment(item);
                      if (decartControllerRef.current) {
                        decartControllerRef.current.setImage(
                          item.image,
                          `Virtual try-on of ${item.name}`
                        );
                      }
                    }}
                    className={`btn btn-sm gap-2 h-auto py-1.5 px-3 ${
                      isSelected
                        ? 'btn-primary shadow-xs'
                        : 'btn-outline border-base-300 bg-base-100'
                    }`}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-5 h-6 object-cover rounded-xs"
                    />
                    <span className="truncate max-w-[140px] text-xs">{item.name}</span>
                    <span className="text-[11px] opacity-80">{money(item.price)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Try-On Workspace: Live Mirror (Webcam) or High-Res Studio Photo */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Stage (7 cols): Camera Video or Photo Preview */}
            <div className="lg:col-span-7 bg-base-200/60 rounded-box border border-base-300 min-h-[460px] sm:min-h-[540px] relative overflow-hidden flex flex-col items-center justify-center p-4">
              {cameraActive ? (
                /* LIVE WEBCAM MIRROR */
                <div className="relative w-full h-full min-h-[460px] sm:min-h-[520px] flex items-center justify-center bg-black rounded-field overflow-hidden">
                  <video
                    ref={(node) => {
                  videoRef.current = node;
                  if (node && previewStreamRef.current) {
                    node.srcObject = previewStreamRef.current;
                    void node.play().catch(() => {});
                  }
                }}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Pose Guidance Silhouette */}
                  <div className="absolute inset-8 border-2 border-dashed border-primary/60 rounded-box pointer-events-none flex flex-col justify-between items-center p-4">
                    <span className="badge badge-neutral/90 text-[11px] backdrop-blur-xs">
                      Căn chỉnh cơ thể vào khung hình để Decart AI nhận diện tỷ lệ vai & eo
                    </span>
                    <span className="badge badge-primary badge-xs">
                      {tryOnGarment?.name}
                    </span>
                  </div>

                  {/* Realtime Telemetry HUD */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1 text-[11px] bg-black/70 backdrop-blur-md text-white p-2.5 rounded-field border border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="font-bold">Decart Lucy V-TON 3.5 • WebRTC Stream</span>
                    </div>
                    <span className="text-white/80">
                      Độ trễ AI: <strong>{liveLatency == null ? 'Chưa đo' : `${liveLatency} ms`}</strong>
                    </span>
                    <span className="text-emerald-300 text-[10px]">{realtimeMsg}</span>
                  </div>

                  {/* Camera Controls Bar */}
                  <div className="absolute bottom-4 inset-x-4 flex flex-wrap justify-center gap-2 bg-black/60 backdrop-blur-md p-2 rounded-box border border-white/10">
                    <button
                      type="button"
                      onClick={captureSnapshot}
                      className="btn btn-primary btn-sm gap-1.5 shadow-lg"
                    >
                      <Icon name="camera" size={15} />
                      <span>Chụp & Lưu Khoảnh Khắc</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopRealtimeWebcam}
                      className="btn btn-neutral btn-sm"
                    >
                      Dừng Camera
                    </button>
                  </div>
                </div>
              ) : tryOnResultImage && !showOriginalCompare ? (
                /* COMPLETED TRY-ON RESULT VIEW */
                <div className="relative w-full h-full min-h-[460px] flex items-center justify-center">
                  <img
                    src={tryOnResultImage}
                    alt="Kết quả thử đồ Decart AI"
                    className="max-h-[520px] max-w-full object-contain rounded-field shadow-lg"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="badge badge-success badge-sm shadow-sm">
                      Kết quả thử đồ
                    </span>
                  </div>
                </div>
              ) : userBodyPhoto ? (
                /* STATIC PHOTO / MANNEQUIN VIEW */
                <div className="relative w-full h-full min-h-[460px] flex items-center justify-center">
                  <img
                    src={userBodyPhoto}
                    alt="Ảnh người mẫu thử đồ"
                    className="max-h-[520px] max-w-full object-contain rounded-field shadow-md"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="badge badge-neutral badge-sm shadow-sm">
                      {showOriginalCompare ? 'Ảnh Gốc Đối Chiếu' : 'Ảnh Sẵn Sàng Thử Đồ'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 space-y-3">
                  <Icon name="camera" size={40} className="mx-auto text-base-content/40" />
                  <p className="text-xs text-base-content/60">
                    Bật webcam hoặc chọn người mẫu để bắt đầu thử đồ.
                  </p>
                </div>
              )}

              {/* Loading Overlay */}
              {tryOnProcessing && (
                <div className="absolute inset-0 bg-neutral/70 backdrop-blur-xs flex flex-col items-center justify-center text-neutral-content p-6 z-20">
                  <span className="loading loading-spinner loading-lg text-primary mb-3" />
                  <h3 className="font-serif text-xl mb-1 text-white">
                    Decart Lucy VTON đang tính toán nếp rủ vải...
                  </h3>
                  <p className="text-xs text-neutral-content/70">
                    Khớp tỷ lệ bờ vai, nếp gấp chất liệu và ánh sáng tự nhiên.
                  </p>
                </div>
              )}

              {cameraError && (
                <div className="alert alert-warning alert-soft text-xs mt-3 w-full">
                  {cameraError}
                </div>
              )}
            </div>

            {/* Right Controls & Model Picker (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Camera Activation Buttons */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-base-content/70 block">
                  Phương thức thử đồ
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={startRealtimeWebcam}
                  disabled={cameraConnecting}
                    className="btn btn-primary btn-sm gap-2"
                  >
                    <Icon name="camera" size={16} />
                    <span>Bật Gương Webcam</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-outline btn-sm gap-1.5"
                  >
                    <Icon name="plus" size={15} />
                    <span>Tải Ảnh Từ Máy</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    hidden
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUserBodyPhoto(URL.createObjectURL(file));
                        setTryOnResultImage(null);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Mannequin / Fashion Model Selection */}
              <div className="space-y-2 pt-2 border-t border-base-300">
                <span className="text-xs font-bold text-base-content/80 block">
                  Hoặc chọn nhanh người mẫu chuẩn để thử trang phục:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SAMPLE_MODELS.map((m) => {
                    const isSelected = userBodyPhoto === m.photo;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setUserBodyPhoto(m.photo);
                          setTryOnResultImage(null);
                          setCameraError(null);
                          if (cameraActive) stopRealtimeWebcam();
                        }}
                        className={`text-left rounded-box p-1.5 border transition-all text-xs flex flex-col items-center gap-1 ${
                          isSelected
                            ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
                            : 'border-base-300 hover:border-base-content/40 bg-base-200/40'
                        }`}
                      >
                        <img
                          src={m.photo}
                          alt={m.name}
                          className="w-12 h-16 object-cover rounded-field shadow-xs"
                        />
                        <span className="font-semibold text-[11px] truncate w-full text-center">
                          {m.name}
                        </span>
                        <span className="badge badge-ghost badge-xs text-[9px]">
                          {m.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Decart Action Button */}
              <div className="space-y-3 pt-2 border-t border-base-300">
                <button
                  type="button"
                  disabled={true}
                  onClick={() => runDecartPhotoTryOn()}
                  className="btn btn-neutral btn-block btn-lg shadow-md gap-2"
                >
                  {tryOnProcessing ? (
                    <>
                      <span className="loading loading-spinner loading-sm" />
                      <span>Decart AI đang ghép trang phục…</span>
                    </>
                  ) : (
                    <>
                      <Icon name="spark" size={18} />
                      <span>Thử đồ ảnh tĩnh — Chưa hỗ trợ</span>
                    </>
                  )}
                </button>

                {tryOnResultImage && (
                  <button
                    type="button"
                    onClick={() => setShowOriginalCompare(!showOriginalCompare)}
                    className="btn btn-outline btn-sm btn-block"
                  >
                    {showOriginalCompare ? 'Xem Kết Quả Đã Mặc Thử' : 'So Sánh Với Ảnh Gốc'}
                  </button>
                )}

                {/* Add to Cart Quick Action */}
                {tryOnGarment && (
                  <button
                    type="button"
                    onClick={() => {
                      const v =
                        tryOnGarment.variants.find((item) => item.stock > 0) ||
                        tryOnGarment.variants[0];
                      if (v) {
                        dispatch(cartActions.add({ product: tryOnGarment, variant: v }));
                        dispatch(cartActions.toggle(true));
                      }
                    }}
                    className="btn btn-primary btn-block gap-2"
                  >
                    <Icon name="bag" size={17} />
                    <span>
                      Thêm {tryOnGarment.name} Vào Giỏ ({money(tryOnGarment.price)})
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
