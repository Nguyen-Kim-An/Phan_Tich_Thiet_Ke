'use client';

import { useEffect, useId, useState } from 'react';
import type { BoundingBox } from '@/domain/models';
import { Icon } from './icons';

interface ObjectSelectionModalProps {
  imageUrl: string;
  fileName: string;
  boxes: BoundingBox[];
  onConfirm: (selectedBox?: BoundingBox) => void;
  onCancel: () => void;
  busy?: boolean;
  detecting?: boolean;
  error?: string | null;
}

export function ObjectSelectionModal({
  imageUrl,
  fileName,
  boxes,
  onConfirm,
  onCancel,
  busy = false,
  detecting = false,
  error,
}: ObjectSelectionModalProps) {
  const [selectedId, setSelectedId] = useState<string>(boxes[0]?.id || 'full');

  const activeBox = boxes.find((b) => b.id === selectedId);
  const groupId = useId();
  const [aspectRatio, setAspectRatio] = useState(4 / 5);
  useEffect(() => { setSelectedId(boxes[0]?.id || 'full'); }, [boxes]);

  return (
    <div
      className="modal modal-open bg-neutral/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${groupId}-title`}
    >
      <div className="modal-box w-full max-w-2xl border border-base-300 p-0">
        <div className="p-4 sm:p-5 border-b border-base-300 flex items-center justify-between bg-base-200/50">
          <div>
            <span className="text-xs uppercase tracking-widest text-primary font-semibold block mb-0.5">
              Tìm kiếm bằng hình ảnh
            </span>
            <h3 id={`${groupId}-title`} className="font-serif text-xl text-neutral">
              Chọn vùng trang phục cần tìm kiếm
            </h3>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-circle btn-sm"
            onClick={onCancel}
            disabled={busy}
            aria-label="Đóng"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* Interactive Image Canvas with Bounding Boxes */}
          <div className="md:col-span-7 relative rounded-box overflow-hidden bg-base-200 border border-base-300"
            style={{ aspectRatio }}>
            <img
              src={imageUrl}
              alt={fileName}
              className="w-full h-full object-contain"
              onLoad={(event) => setAspectRatio(event.currentTarget.naturalWidth / event.currentTarget.naturalHeight)}
            />
            {boxes.map((box) => {
              const isSelected = selectedId === box.id;
              return (
                <button
                  key={box.id}
                  type="button"
                  onClick={() => setSelectedId(box.id)}
                  disabled={busy || detecting}
                  aria-label={`Chọn vùng ${box.label}`}
                  aria-pressed={isSelected}
                  style={{
                    left: `${box.x}%`,
                    top: `${box.y}%`,
                    width: `${box.width}%`,
                    height: `${box.height}%`,
                  }}
                  className={`absolute rounded-field border-2 transition-all cursor-pointer flex items-start justify-start p-1.5 ${
                    isSelected
                      ? 'border-primary bg-primary/20 ring-2 ring-primary/40 z-20'
                      : 'border-base-100/80 bg-neutral/20 hover:border-primary/80 z-10'
                  }`}
                >
                  <span
                    className={`badge badge-xs font-medium shadow-sm ${
                      isSelected ? 'badge-primary' : 'badge-neutral'
                    }`}
                  >
                    {box.label.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Panel: Detected BoundingBoxes */}
          <div className="md:col-span-5 space-y-4">
            <p className="text-xs text-base-content/70 leading-relaxed">
              {detecting ? 'AI đang gợi ý các vùng trang phục trong ảnh…' : boxes.length
                ? `Có ${boxes.length} vùng trang phục được gợi ý. Bấm khung trên ảnh hoặc chọn bên dưới để tìm món tương tự.`
                : 'Chưa có vùng trang phục rõ ràng. Bạn vẫn có thể tìm theo toàn bộ ảnh.'}
            </p>

            <fieldset className="space-y-2" disabled={busy || detecting}>
              <legend className="sr-only">Chọn vùng trang phục</legend>
              {boxes.map((box) => (
                <label
                  key={box.id}
                  className={`card card-compact border p-3 flex flex-row items-center gap-3 cursor-pointer transition-all ${
                    selectedId === box.id
                      ? 'border-primary bg-primary/5'
                      : 'border-base-300 bg-base-100 hover:border-base-content/30'
                  }`}
                >
                  <input
                    type="radio"
                    name={groupId}
                    className="radio radio-primary radio-xs"
                    checked={selectedId === box.id}
                    onChange={() => setSelectedId(box.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-base-content truncate">
                      {box.label}
                    </div>
                    <div className="text-[11px] text-base-content/60">
                      Vùng AI gợi ý — kiểm tra khung trên ảnh
                    </div>
                  </div>
                </label>
              ))}

              <label
                className={`card card-compact border p-3 flex flex-row items-center gap-3 cursor-pointer transition-all ${
                  selectedId === 'full'
                    ? 'border-primary bg-primary/5'
                    : 'border-base-300 bg-base-100 hover:border-base-content/30'
                }`}
              >
                <input
                  type="radio"
                  name={groupId}
                  className="radio radio-primary radio-xs"
                  checked={selectedId === 'full'}
                  onChange={() => setSelectedId('full')}
                />
                <div className="flex-1">
                  <div className="text-xs font-semibold text-base-content">
                    Sử dụng toàn bộ bức ảnh
                  </div>
                  <div className="text-[11px] text-base-content/60">
                    AI phân tích trang phục chính trong toàn bộ ảnh
                  </div>
                </div>
              </label>
            </fieldset>

            {error && <div role="alert" className="alert alert-warning alert-soft text-sm">{error}</div>}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                className="btn btn-primary btn-block btn-sm gap-2"
                disabled={busy || detecting}
                onClick={() => onConfirm(selectedId === 'full' ? undefined : activeBox)}
              >
                {busy || detecting ? <span className="loading loading-spinner loading-sm" /> : <Icon name="search" size={15} />}
                <span>{detecting ? 'Đang nhận diện vùng…' : busy ? 'AI đang tìm sản phẩm…' : 'Xác nhận & Tìm kiếm'}</span>
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-block btn-xs"
                onClick={onCancel}
                disabled={busy}
              >
                Hủy bỏ
              </button>
            </div>
            <p className="text-[11px] text-base-content/60">Khung là gợi ý gần đúng từ AI. Ảnh được gửi tới dịch vụ AI để phân tích, không lưu thành tệp trên server.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
