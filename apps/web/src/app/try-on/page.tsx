'use client';

import { useRef, useState } from 'react';
import { products } from '@/lib/catalog';
import { Icon } from '@/components/icons';

export default function TryOn() {
  const tryable = products.filter((p) =>
    ['ao', 'vay', 'ao-khoac'].includes(p.categorySlug)
  );
  const [image, setImage] = useState<string>();
  const [product, setProduct] = useState(tryable[0]);
  const [status, setStatus] = useState<'idle' | 'working' | 'done'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChoose = (file?: File) => {
    if (file) {
      setImage(URL.createObjectURL(file));
      setStatus('idle');
    }
  };

  const runTryOn = () => {
    if (!image) {
      fileInputRef.current?.click();
      return;
    }
    setStatus('working');
    setTimeout(() => {
      setStatus('done');
    }, 2200);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
        <span className="badge badge-primary badge-outline gap-1.5 font-medium mb-3">
          <Icon name="spark" size={14} />
          Phòng thử đồ ảo MaisonAI
        </span>
        <h1 className="font-serif text-4xl sm:text-6xl font-normal text-neutral mb-3">
          Thấy mình trong lựa chọn mới.
        </h1>
        <p className="text-sm sm:text-base text-base-content/70">
          Chụp hoặc tải ảnh toàn thân với ánh sáng rõ và nền đơn giản để AI tái tạo tỷ lệ cơ thể và độ rủ trang phục chuẩn xác nhất.
        </p>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start bg-base-100 rounded-box border border-base-300 shadow-xl overflow-hidden p-6 sm:p-8">
        {/* Upload Stage / Preview Canvas */}
        <div className="lg:col-span-7 bg-base-200/50 rounded-box border border-base-300 min-h-[480px] sm:min-h-[580px] relative overflow-hidden flex flex-col items-center justify-center p-6 text-center">
          {image ? (
            <div className="relative w-full h-full min-h-[480px] flex items-center justify-center">
              <img
                src={image}
                alt="Ảnh cơ thể người dùng"
                className="max-h-[560px] max-w-full object-contain rounded-field"
              />

              {/* Garment Overlay / Processing Effect */}
              {status === 'working' && (
                <div className="absolute inset-0 bg-neutral/70 backdrop-blur-xs flex flex-col items-center justify-center text-neutral-content p-6 rounded-field animate-in fade-in">
                  <span className="loading loading-spinner loading-lg text-primary mb-4" />
                  <h3 className="font-serif text-xl mb-1">
                    Đang khớp phom dáng và chất liệu...
                  </h3>
                  <p className="text-xs text-neutral-content/70">
                    Mô phỏng trọng lực và độ co giãn của vải trên tỷ lệ cơ thể.
                  </p>
                </div>
              )}

              {/* Done Preview Badge */}
              {status === 'done' && (
                <div className="absolute bottom-4 inset-x-4 flex justify-between items-center bg-base-100/95 backdrop-blur-md p-3.5 rounded-box border border-base-300 shadow-lg">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-success badge-sm">✓ Đã thử</span>
                    <span className="text-xs font-medium text-base-content">
                      Đang xem: {product.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs text-primary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Đổi ảnh khác
                  </button>
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
          <div>
            <span className="text-xs uppercase tracking-wider text-primary font-semibold block mb-1">
              Bước 2
            </span>
            <h2 className="font-serif text-2xl font-normal text-neutral">
              Chọn trang phục muốn thử
            </h2>
            <p className="text-xs text-base-content/60 mt-1">
              Chọn từ bộ sưu tập mùa mới để xem trang phục hiển thị thế nào.
            </p>
          </div>

          {/* Garments Grid */}
          <div className="grid grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
            {tryable.slice(0, 8).map((p) => {
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
                      {p.category}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action Button */}
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
                  <span>Đang xử lý tạo dáng...</span>
                </>
              ) : (
                <>
                  <Icon name="spark" size={18} />
                  <span>
                    {!image
                      ? 'Tải ảnh và thử ngay'
                      : status === 'done'
                      ? 'Thử lại với trang phục khác'
                      : 'Bắt đầu thử đồ AI'}
                  </span>
                </>
              )}
            </button>

            {/* Privacy Alert */}
            <div className="alert alert-soft alert-info p-3 text-xs leading-relaxed">
              <span className="font-semibold">Cam kết bảo mật:</span> Ảnh cá nhân chỉ dùng cho phiên xử lý thử đồ hiện tại và tự động xóa vĩnh viễn sau 24 giờ.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
