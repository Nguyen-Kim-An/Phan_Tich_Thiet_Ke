'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { products, money } from '@/lib/catalog';
import { cartActions } from '@/store/store';
import { stylistController } from '@/services/stylist-orchestrator';
import { Icon } from '@/components/icons';

export default function TryOn() {
  const dispatch = useDispatch();
  const tryable = products.filter((p) =>
    ['ao', 'vay', 'ao-khoac', 'quan'].includes(p.categorySlug)
  );
  const [image, setImage] = useState<string>(tryable[0]?.image || '');
  const [outPreviewImage, setOutPreviewImage] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [product, setProduct] = useState(tryable[0]);
  const [status, setStatus] = useState<'idle' | 'working' | 'done'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChoose = (file?: File) => {
    if (file) {
      setImage(URL.createObjectURL(file));
      setOutPreviewImage(null);
      setStatus('idle');
    }
  };

  const runTryOn = async () => {
    if (!image) {
      fileInputRef.current?.click();
      return;
    }
    setStatus('working');
    setShowOriginal(false);
    const session = await stylistController.tryOnProduct(image, product);
    setOutPreviewImage(session.resultImageUrl);
    setStatus('done');
  };

  const activeVariant =
    product.variants.find((v) => v.stock > 0) || product.variants[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
        <span className="text-xs uppercase tracking-widest text-primary font-semibold block mb-2">
          Phòng Thử Đồ Trực Tuyến • Wearson AI Studio
        </span>
        <h1 className="font-serif text-4xl sm:text-6xl font-normal text-neutral mb-3">
          Thấy mình trong lựa chọn mới.
        </h1>
        <p className="text-sm sm:text-base text-base-content/70">
          Ướm thử từng thiết kế lẻ hoặc chuyển sang{' '}
          <Link href="/outfits" className="text-primary underline font-medium">
            Stylist Cá Nhân Phối Trọn Bộ Trang Phục
          </Link>{' '}
          để Wearson AI tái tạo tỷ lệ cơ thể và độ rủ trang phục chuẩn xác nhất.
        </p>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start bg-base-100 rounded-box border border-base-300 shadow-xl overflow-hidden p-6 sm:p-8">
        {/* Upload Stage / Preview Canvas */}
        <div className="lg:col-span-7 bg-base-200/50 rounded-box border border-base-300 min-h-[480px] sm:min-h-[580px] relative overflow-hidden flex flex-col items-center justify-center p-6 text-center">
          {image ? (
            <div className="relative w-full h-full min-h-[480px] flex items-center justify-center">
              <img
                src={
                  status === 'done' && outPreviewImage && !showOriginal
                    ? outPreviewImage
                    : image
                }
                alt="Kết quả thử đồ Wearson AI"
                className="max-h-[560px] max-w-full object-contain rounded-field shadow-md"
              />

              {/* Garment Overlay / Processing Effect */}
              {status === 'working' && (
                <div className="absolute inset-0 bg-neutral/70 backdrop-blur-xs flex flex-col items-center justify-center text-neutral-content p-6 rounded-field">
                  <span className="loading loading-spinner loading-lg text-primary mb-4" />
                  <h3 className="font-serif text-xl mb-1">
                    Wearson AI đang khớp phom dáng và chất liệu...
                  </h3>
                  <p className="text-xs text-neutral-content/70">
                    Mô phỏng trọng lực và độ co giãn của vải trên tỷ lệ cơ thể.
                  </p>
                </div>
              )}

              {/* Done Preview Badge + Compare */}
              {status === 'done' && (
                <div className="absolute bottom-4 inset-x-4 flex flex-wrap justify-between items-center gap-2 bg-base-100/95 backdrop-blur-md p-3.5 rounded-box border border-base-300 shadow-lg">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-success badge-sm">
                      Wearson AI 96%
                    </span>
                    <span className="text-xs font-medium text-base-content">
                      Đang mặc thử: {product.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={() => setShowOriginal(!showOriginal)}
                    >
                      {showOriginal
                        ? 'Xem ảnh đã mặc thử'
                        : 'So sánh với ảnh gốc'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs text-primary"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Đổi ảnh khác
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center cursor-pointer p-8 space-y-4 hover:opacity-90 transition-opacity"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-20 h-20 rounded-full bg-base-100 border border-base-300 shadow-sm flex items-center justify-center text-primary">
                <Icon name="camera" size={32} />
              </div>
              <div>
                <h3 className="font-serif text-2xl font-normal text-neutral mb-1">
                  Tải ảnh toàn thân của bạn
                </h3>
                <p className="text-xs text-base-content/60">
                  Hỗ trợ định dạng JPEG, PNG hoặc WebP (Tối đa 10 MB)
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-primary btn-sm px-6"
              >
                Chọn ảnh từ máy
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            hidden
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handleChoose(e.target.files?.[0])}
          />
        </div>

        {/* Right Garment Selector & Execution Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-primary font-semibold block mb-1">
                Danh mục thiết kế ({tryable.length} mẫu)
              </span>
              <h2 className="font-serif text-2xl font-normal text-neutral">
                Chọn trang phục muốn thử
              </h2>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-outline btn-xs"
            >
              Tải ảnh cá nhân
            </button>
          </div>

          {/* Garments Grid */}
          <div className="grid grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
            {tryable.slice(0, 24).map((p) => {
              const isSelected = p.productId === product.productId;
              return (
                <button
                  key={p.productId}
                  type="button"
                  onClick={() => {
                    setProduct(p);
                    if (status === 'done') setStatus('idle');
                  }}
                  className={`card card-compact border text-left p-2 transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-xs'
                      : 'border-base-300 hover:border-base-content/30 bg-base-100'
                  }`}
                >
                  <figure className="relative aspect-square rounded-field overflow-hidden bg-base-200 m-0">
                    <img
                      src={p.image}
                      alt={p.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <span className="badge badge-primary badge-xs absolute top-2 right-2">
                        Đang chọn
                      </span>
                    )}
                  </figure>
                  <div className="pt-2">
                    <p className="text-xs font-medium text-base-content line-clamp-1">
                      {p.name}
                    </p>
                    <span className="text-xs text-base-content/60">
                      {p.category} • {money(p.price)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              className="btn btn-primary btn-block btn-lg shadow-md gap-2"
              onClick={runTryOn}
              disabled={status === 'working'}
            >
              {status === 'working' ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  <span>Wearson AI đang ghép trang phục...</span>
                </>
              ) : (
                <>
                  <Icon name="camera" size={18} />
                  <span>
                    {status === 'done'
                      ? 'Ghép lại với Wearson AI'
                      : 'Thử trực tiếp với Wearson AI'}
                  </span>
                </>
              )}
            </button>

            {activeVariant && (
              <button
                type="button"
                onClick={() =>
                  dispatch(
                    cartActions.add({ product, variant: activeVariant })
                  )
                }
                className="btn btn-outline btn-block gap-2"
              >
                <Icon name="bag" size={16} />
                <span>
                  Thêm {product.name} vào túi ({money(product.price)})
                </span>
              </button>
            )}

            <div className="alert alert-soft alert-info p-3 text-xs leading-relaxed">
              <span className="font-semibold">Gợi ý:</span> Bạn muốn trả lời 4 câu hỏi định hướng hoặc nói qua Amical AI Voice để phối nguyên bộ 3 món đồ rồi thử cùng lúc?{' '}
              <Link href="/outfits" className="underline font-semibold">
                Mở Phòng Tư Vấn Phối Đồ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
