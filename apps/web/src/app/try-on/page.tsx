'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { products, money } from '@/lib/catalog';
import { cartActions } from '@/store/store';
import { Icon } from '@/components/icons';
import {
  getDecartStatus,
  executeDecartTryOn,
  DecartRealtimeController,
  type DecartStatus,
} from '@/services/decart-client';

function TryOnStudio() {
  const dispatch = useDispatch();

  // All tryable products from Everlane catalog
  const tryable = useMemo(
    () =>
      products.filter((p) =>
        ['ao', 'vay', 'ao-khoac', 'quan'].includes(p.categorySlug)
      ),
    []
  );

  const searchParams = useSearchParams();
  const variantParam = searchParams.get('variant');
  const productParam = searchParams.get('product');

  // Find target product from query params or fallback to tryable[0]
  const initialProduct = useMemo(() => {
    if (variantParam) {
      const found = products.find((p) =>
        p.variants.some((v) => v.variantId === variantParam)
      );
      if (found) return found;
    }
    if (productParam) {
      const found = products.find((p) => p.productId === productParam);
      if (found) return found;
    }
    return tryable[0];
  }, [variantParam, productParam, tryable]);

  const [product, setProduct] = useState(initialProduct);
  const [activeCategory, setActiveCategory] = useState<string>(() => {
    if (
      initialProduct &&
      ['ao', 'vay', 'ao-khoac', 'quan'].includes(initialProduct.categorySlug)
    ) {
      return initialProduct.categorySlug;
    }
    return 'all';
  });
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Sync state if query params change
  useEffect(() => {
    if (initialProduct) {
      setProduct(initialProduct);
      if (
        ['ao', 'vay', 'ao-khoac', 'quan'].includes(initialProduct.categorySlug)
      ) {
        setActiveCategory(initialProduct.categorySlug);
      }
      setTryOnResult(null);
      if (decartControllerRef.current) {
        decartControllerRef.current.setImage(
          initialProduct.image,
          `Virtual try-on of ${initialProduct.name}`
        );
      }
    }
  }, [initialProduct]);

  // Decart AI status & Realtime states
  const [decartStatus, setDecartStatus] = useState<DecartStatus | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [realtimeMsg, setRealtimeMsg] = useState('Đang sẵn sàng kết nối tới Gương Thử Đồ Maison AI');
  const [liveLatency, setLiveLatency] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewStreamRef = useRef<MediaStream | null>(null);
  const [cameraConnecting, setCameraConnecting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const decartControllerRef = useRef<DecartRealtimeController | null>(null);

  useEffect(() => {
    getDecartStatus().then((st) => setDecartStatus(st)).catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      decartControllerRef.current?.disconnect();
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Filtered products list
  const filteredProducts = tryable.filter((p) => {
    const matchCat = activeCategory === 'all' || p.categorySlug === activeCategory;
    const matchQuery =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  // BƯỚC 3: Mở luồng WebRTC thời gian thực (@decartai/sdk / LiveKit)
  const startRealtimeCamera = async () => {
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
          (status, msg) => {
            if (status === 'error') setCameraError(msg || 'Maison AI gặp lỗi.');
            if (msg) setRealtimeMsg(msg);
          },
          (latency) => {
            setLiveLatency(latency);
          }
        );
      }

      const connected = await decartControllerRef.current.connect(
        stream,
        product.image,
        `Realtime virtual try-on of ${product.name}`
      );
      if (!connected) setCameraActive(false);
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : 'Không thể mở webcam hoặc kết nối Maison AI.');
      setCameraActive(false);
    } finally {
      setCameraConnecting(false);
    }
  };

  const stopRealtimeCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
    }
    decartControllerRef.current?.disconnect();
    setCameraActive(false);
  };

  // Run Decart Virtual Try-On API Job
  const runDecartTryOnJob = async () => {
    if (!userPhoto || !product) return;
    setCameraError(null);
    setIsProcessing(true);
    setShowOriginal(false);
    try {
      const res = await executeDecartTryOn({
        userImageUrl: userPhoto,
        garmentImageUrl: product.image,
        prompt: `Photorealistic try-on of ${product.name}, perfect cloth drape and lighting`,
        category: product.categorySlug,
        resolution: '720p',
      });
      setTryOnResult(res.resultImageUrl);
    } catch (err: any) {
      console.warn('Decart Try-On note:', err);
      setTryOnResult(null);
      setCameraError(err instanceof Error ? err.message : 'Không xử lý được ảnh thử đồ.');
    } finally {
      setIsProcessing(false);
    }
  };

  const activeVariant =
    product.variants.find((v) => v.stock > 0) || product.variants[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-14 space-y-10">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
          <Icon name="camera" size={14} />
          <span>Maison AI Virtual Try-On Studio</span>
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-neutral font-normal">
          Phòng Thử Đồ Trực Tiếp Realtime
        </h1>
        <p className="text-sm sm:text-base text-base-content/75">
          Bật webcam để thử quần áo thời gian thực qua Maison AI. Bạn cũng có thể mở{' '}
          <Link href="/outfits" className="text-primary font-semibold underline">
            Phòng Tư Vấn Phối Đồ
          </Link>{' '}
          để được AI gợi ý nguyên set hoàn chỉnh.
        </p>
      </div>

      {/* Main Studio Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start bg-base-100 rounded-box border border-base-300 shadow-xl overflow-hidden p-6 sm:p-8">
        {/* Left Column (7 cols): Camera Mirror / Photo Preview */}
        <div className="lg:col-span-7 bg-base-200/50 rounded-box border border-base-300 min-h-[500px] sm:min-h-[600px] relative overflow-hidden flex flex-col items-center justify-center p-4">
          {cameraActive ? (
            /* LIVE WEBCAM FEED */
            <div className="relative w-full h-full min-h-[480px] sm:min-h-[560px] flex items-center justify-center bg-black rounded-field overflow-hidden">
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

              {/* Pose Guidance */}
              <div className="absolute inset-8 border-2 border-dashed border-primary/60 rounded-box pointer-events-none flex flex-col justify-between items-center p-4">
                <span className="badge badge-neutral/90 text-[11px] backdrop-blur-xs">
                  Đứng cách camera 1.5 - 2 mét để Maison AI bắt trọn dáng người
                </span>
                <span className="badge badge-primary badge-xs">
                  Đang thử: {product.name}
                </span>
              </div>

              {/* Telemetry HUD */}
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white p-2.5 rounded-field border border-white/10 text-[11px] flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-bold">Maison AI • Realtime WebRTC</span>
                </div>
                <span className="text-white/80">
                  Độ trễ AI: <strong>{liveLatency == null ? 'Chưa đo' : `${liveLatency} ms`}</strong>
                </span>
                <span className="text-emerald-300 text-[10px]">{realtimeMsg}</span>
              </div>

              {/* Stop camera */}
              <div className="absolute bottom-4 inset-x-4 flex justify-center gap-2 bg-black/60 backdrop-blur-md p-2 rounded-box border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    if (videoRef.current) {
                      const canvas = document.createElement('canvas');
                      canvas.width = videoRef.current.videoWidth || 720;
                      canvas.height = videoRef.current.videoHeight || 960;
                      const ctx = canvas.getContext('2d');
                      if (ctx) {
                        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                        setUserPhoto(canvas.toDataURL('image/jpeg', 0.92));
                        stopRealtimeCamera();

                      }
                    }
                  }}
                  className="btn btn-primary btn-sm gap-1.5 shadow-md"
                >
                  <Icon name="camera" size={15} />
                  <span>Chụp Ảnh Webcam</span>
                </button>
                <button
                  type="button"
                  onClick={stopRealtimeCamera}
                  className="btn btn-neutral btn-sm"
                >
                  Tắt Camera
                </button>
              </div>
            </div>
          ) : tryOnResult && !showOriginal ? (
            /* COMPLETED RESULT */
            <div className="relative w-full h-full min-h-[480px] flex items-center justify-center">
              <img
                src={tryOnResult}
                alt="Kết quả thử đồ Maison AI"
                className="max-h-[560px] max-w-full object-contain rounded-field shadow-lg"
              />
              <div className="absolute top-3 left-3">
                <span className="badge badge-success badge-sm shadow-sm">
                  Maison AI Hoàn Tất
                </span>
              </div>
            </div>
          ) : userPhoto ? (
            /* CURRENT PHOTO */
            <div className="relative w-full h-full min-h-[480px] flex items-center justify-center">
              <img
                src={userPhoto}
                alt="Ảnh thử đồ"
                className="max-h-[560px] max-w-full object-contain rounded-field shadow-md"
              />
              <div className="absolute top-3 left-3">
                <span className="badge badge-neutral badge-sm shadow-sm">
                  {showOriginal ? 'Ảnh Gốc' : 'Ảnh Sẵn Sàng Ướm Thử'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 space-y-3">
              <Icon name="camera" size={48} className="mx-auto text-base-content/40" />
              <p className="text-xs text-base-content/60">
                Bật webcam hoặc tải ảnh của bạn lên để bắt đầu thử đồ với Maison AI.
              </p>
            </div>
          )}

          {/* Loading */}
          {isProcessing && (
            <div className="absolute inset-0 bg-neutral/70 backdrop-blur-xs flex flex-col items-center justify-center text-neutral-content p-6 z-20">
              <span className="loading loading-spinner loading-lg text-primary mb-3" />
              <h3 className="font-serif text-xl mb-1 text-white">
                Maison AI đang mô phỏng nếp rủ vải...
              </h3>
              <p className="text-xs text-neutral-content/70">
                Tính toán trọng lực, góc ánh sáng và độ co giãn chất liệu thật.
              </p>
            </div>
          )}

          {cameraError && (
            <div className="alert alert-warning alert-soft text-xs mt-3 w-full">
              {cameraError}
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Garment Selector & Try-On Actions */}
        <div className="lg:col-span-5 space-y-5">
          {/* Status Header */}
          <div className="bg-primary/5 border border-primary/20 rounded-box p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="badge badge-primary badge-xs">Maison AI</span>
              <span className="text-xs font-semibold text-primary">Realtime Studio</span>
            </div>
            <span
              className={`badge badge-xs ${
                decartStatus?.configured ? 'badge-success' : 'badge-neutral'
              }`}
            >
              {decartStatus?.configured ? 'Đã kích hoạt • Sẵn sàng' : 'Chưa cấu hình / API lỗi'}
            </span>
          </div>

          {/* Selected Product Card */}
          <div className="card card-side bg-base-200/60 border border-base-300 p-3 gap-3 items-center">
            <img
              src={product.image}
              alt={product.name}
              className="w-16 h-20 object-cover rounded-field border border-base-300 shrink-0"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <span className="badge badge-outline badge-xs">{product.category}</span>
              <h3 className="font-semibold text-xs sm:text-sm text-base-content truncate">
                {product.name}
              </h3>
              <span className="text-xs font-bold text-primary block">{money(product.price)}</span>
            </div>
          </div>

          {/* Camera Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={startRealtimeCamera}
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
                  setUserPhoto(URL.createObjectURL(file));
                  setTryOnResult(null);
                }
              }}
            />
          </div>

          {/* Filter Categories for Products */}
          <div className="space-y-2 pt-2 border-t border-base-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-base-content/70">
                Chọn món quần áo khác
              </span>
              <div className="flex gap-1">
                {['all', 'ao', 'quan', 'ao-khoac', 'vay'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`btn btn-xs ${
                      activeCategory === cat ? 'btn-neutral' : 'btn-ghost'
                    }`}
                  >
                    {cat === 'all'
                      ? 'Tất cả'
                      : cat === 'ao'
                      ? 'Áo'
                      : cat === 'quan'
                      ? 'Quần'
                      : cat === 'ao-khoac'
                      ? 'Khoác'
                      : 'Váy'}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Thumbnails Scroll */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[220px] overflow-y-auto pr-1">
              {filteredProducts.slice(0, 24).map((p) => {
                const isSelected = p.productId === product.productId;
                return (
                  <button
                    key={p.productId}
                    type="button"
                    onClick={() => {
                      setProduct(p);
                      setTryOnResult(null);
                      // BƯỚC 4: Bắn lệnh setImage mới qua Data Channel mà KHÔNG cần ngắt camera
                      if (decartControllerRef.current) {
                        decartControllerRef.current.setImage(
                          p.image,
                          `Virtual try-on of ${p.name}`
                        );
                      }
                    }}
                    className={`relative rounded-box overflow-hidden border p-1 text-left transition-all ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/40 bg-primary/5'
                        : 'border-base-300 hover:border-base-content/30 bg-base-100'
                    }`}
                  >
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full aspect-[3/4] object-cover rounded-xs"
                    />
                    <p className="text-[10px] font-semibold text-base-content truncate mt-1">
                      {p.name}
                    </p>
                    <span className="text-[10px] text-primary font-bold block">
                      {money(p.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2 border-t border-base-300">
            {userPhoto && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={runDecartTryOnJob}
                className="btn btn-primary btn-block btn-lg shadow-md gap-2"
              >
                {isProcessing ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    <span>Maison AI đang xử lý…</span>
                  </>
                ) : (
                  <>
                    <Icon name="spark" size={18} />
                    <span>Mặc Thử "{product.name}" Lên Ảnh</span>
                  </>
                )}
              </button>
            )}

            {tryOnResult && (
              <button
                type="button"
                onClick={() => setShowOriginal(!showOriginal)}
                className="btn btn-outline btn-sm btn-block"
              >
                {showOriginal ? 'Xem Ảnh Đã Thử Đồ' : 'So Sánh Với Ảnh Gốc'}
              </button>
            )}

            {activeVariant && (
              <button
                type="button"
                onClick={() => {
                  dispatch(cartActions.add({ product, variant: activeVariant }));
                  dispatch(cartActions.toggle(true));
                }}
                className="btn btn-primary btn-block gap-2"
              >
                <Icon name="bag" size={17} />
                <span>
                  Thêm Vào Giỏ ({money(product.price)})
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


export default function TryOnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
          <span className="loading loading-spinner loading-lg text-primary" />
          <span className="text-xs text-base-content/60">
            Đang tải Phòng Thử Đồ Maison AI…
          </span>
        </div>
      }
    >
      <TryOnStudio />
    </Suspense>
  );
}
