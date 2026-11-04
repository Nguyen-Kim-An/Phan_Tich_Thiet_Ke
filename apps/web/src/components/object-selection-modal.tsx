'use client';

import { useState } from 'react';
import type { BoundingBox } from '@/domain/models';
import { Icon } from './icons';

interface ObjectSelectionModalProps {
  imageUrl: string;
  fileName: string;
  boxes: BoundingBox[];
  onConfirm: (selectedBox?: BoundingBox) => void;
  onCancel: () => void;
}

export function ObjectSelectionModal({
  imageUrl,
  fileName,
  boxes,
  onConfirm,
  onCancel,
}: ObjectSelectionModalProps) {
  const [selectedId, setSelectedId] = useState<string>(boxes[0]?.id || 'full');

  const activeBox = boxes.find((b) => b.id === selectedId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="obj-select-title"
    >
      <div className="card bg-base-100 border border-base-300 shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-base-300 flex items-center justify-between bg-base-200/50">
          <div>
            <span className="text-xs uppercase tracking-widest text-primary font-semibold block mb-0.5">
              Tìm kiếm bằng hình ảnh
            </span>
            <h3 id="obj-select-title" className="font-serif text-xl text-neutral">
              Chọn vùng trang phục cần tìm kiếm
            </h3>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-circle btn-sm"
            onClick={onCancel}
            aria-label="Đóng"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* Interactive Image Canvas with Bounding Boxes */}
          <div className="md:col-span-7 relative rounded-box overflow-hidden bg-base-200 border border-base-300 aspect-[4/5] flex items-center justify-center">
            <img
              src={imageUrl}
              alt={fileName}
              className="w-full h-full object-cover"
            />
            {boxes.map((box) => {
              const isSelected = selectedId === box.id;
              return (
                <button
                  key={box.id}
                  type="button"
                  onClick={() => setSelectedId(box.id)}
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
              Hệ thống nhận diện <strong>{boxes.length} vùng trang phục</strong> trên bức ảnh của bạn. Hãy chọn món đồ muốn tìm tương đồng hoặc tìm theo toàn bộ bức ảnh:
            </p>

            <div className="space-y-2">
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
                    name="inSelectedBox"
                    className="radio radio-primary radio-xs"
                    checked={selectedId === box.id}
                    onChange={() => setSelectedId(box.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-base-content truncate">
                      {box.label}
                    </div>
                    <div className="text-[11px] text-base-content/60">
                      Độ khớp nhận diện {Math.round(box.confidence * 100)}%
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
                  name="inSelectedBox"
                  className="radio radio-primary radio-xs"
                  checked={selectedId === 'full'}
                  onChange={() => setSelectedId('full')}
                />
                <div className="flex-1">
                  <div className="text-xs font-semibold text-base-content">
                    Sử dụng toàn bộ bức ảnh
                  </div>
                  <div className="text-[11px] text-base-content/60">
                    Tìm theo tổng thể bảng màu & phong cách
                  </div>
                </div>
              </label>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                className="btn btn-primary btn-block btn-sm gap-2"
                onClick={() => onConfirm(selectedId === 'full' ? undefined : activeBox)}
              >
                <Icon name="search" size={15} />
                <span>Xác nhận & Tìm kiếm</span>
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-block btn-xs"
                onClick={onCancel}
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
