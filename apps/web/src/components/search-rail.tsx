'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BoundingBox, Modality } from '@/domain/models';
import {
  ContinuousSpeechController,
  startContinuousVoiceSession,
} from '@/services/interfaces';
import { searchController } from '@/services/search-orchestrator';
import { ObjectSelectionModal } from './object-selection-modal';
import { Icon } from './icons';

const SAMPLE_VOICE_PROMPTS = [
  'Tôi muốn tìm áo khoác blazer xám mặc đi làm dưới 3 triệu',
  'Tìm giúp tôi áo sơ mi trắng thanh lịch công sở',
  'Đầm thiết kế màu đỏ rượu đi tiệc tối',
  'Kiểm tra đơn hàng SF-2026-0038',
];

export function SearchRail({ compact = false }: { compact?: boolean }) {
  const [mode, setMode] = useState<Modality>('text');
  const [inQuery, setInQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  // ImageUpload state
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [detectedBoxes, setDetectedBoxes] = useState<BoundingBox[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechCtrlRef = useRef<ContinuousSpeechController | null>(null);
  const router = useRouter();

  // Cleanup active speech session on unmount
  useEffect(() => {
    return () => {
      speechCtrlRef.current?.stop();
    };
  }, []);

  const actionPerformed = (
    event?: FormEvent,
    overrideQuery?: string,
    overrideMode?: Modality
  ) => {
    if (event) event.preventDefault();
    if (speechCtrlRef.current) {
      speechCtrlRef.current.stop();
      speechCtrlRef.current = null;
    }
    const activeMode = overrideMode || mode;
    const finalQuery =
      (overrideQuery !== undefined ? overrideQuery : inQuery).trim() ||
      (activeMode === 'image' ? 'phong cách từ ảnh' : 'áo sơ mi trắng công sở');

    const params = new URLSearchParams();
    params.set('q', finalQuery);
    params.set('mode', activeMode);
    router.push(`/shop?${params.toString()}`);
  };

  const handleMicToggle = () => {
    setMode('voice');
    inputRef.current?.focus();

    if (isRecording && speechCtrlRef.current) {
      speechCtrlRef.current.stop();
      speechCtrlRef.current = null;
      setIsRecording(false);
      return;
    }

    speechCtrlRef.current = startContinuousVoiceSession(
      inQuery,
      (liveText) => {
        setInQuery(liveText);
      },
      (listening) => {
        setIsRecording(listening);
      }
    );
  };

  const handleFileChange = (file?: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const boxes = searchController.detectGarmentBoxes(file);
    setUploadedPreviewUrl(url);
    setUploadedFileName(file.name);
    setDetectedBoxes(boxes);
  };

  const handleConfirmImageBox = (selectedBox?: BoundingBox) => {
    const label = selectedBox ? selectedBox.label : 'Toàn bộ ảnh';
    const q = `Ảnh (${label}): ${uploadedFileName}`;
    setInQuery(q);
    setUploadedPreviewUrl(null);

    const params = new URLSearchParams();
    params.set('q', q);
    params.set('mode', 'image');
    if (selectedBox) {
      params.set('boxCat', selectedBox.categorySlug);
      params.set('boxLabel', selectedBox.label);
    }
    router.push(`/shop?${params.toString()}`);
  };

  const placeholderText = {
    text: 'Tìm sản phẩm (“áo sơ mi trắng dưới 2 triệu”) hoặc nhập mã đơn (“SF-2026-0038”)…',
    image: 'Tải ảnh trang phục để chọn vùng đồ cần tìm tương đồng…',
    voice: 'Đặt con trỏ tại đây và giữ Ctrl+Space (Amical AI Voice) hoặc bấm nút Thu âm…',
  }[mode];

  return (
    <div className="w-full">
      <form onSubmit={(e) => actionPerformed(e)} className="w-full">
        {/* Mode Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div
            role="tablist"
            className={`tabs ${
              compact
                ? 'tabs-box bg-base-200/80 p-1 rounded-field'
                : 'tabs-border'
            }`}
          >
            <button
              role="tab"
              type="button"
              className={`tab tab-sm gap-1.5 ${
                mode === 'text' ? 'tab-active font-medium' : ''
              }`}
              onClick={() => {
                if (speechCtrlRef.current) {
                  speechCtrlRef.current.stop();
                  speechCtrlRef.current = null;
                }
                setMode('text');
              }}
            >
              <Icon name="search" size={14} />
              <span>Từ khóa & Mã đơn</span>
            </button>
            <button
              role="tab"
              type="button"
              className={`tab tab-sm gap-1.5 ${
                mode === 'voice' ? 'tab-active font-medium' : ''
              }`}
              onClick={() => {
                setMode('voice');
                setTimeout(() => inputRef.current?.focus(), 30);
              }}
            >
              <Icon name="mic" size={14} />
              <span>Giọng nói</span>
            </button>
            <button
              role="tab"
              type="button"
              className={`tab tab-sm gap-1.5 ${
                mode === 'image' ? 'tab-active font-medium' : ''
              }`}
              onClick={() => {
                if (speechCtrlRef.current) {
                  speechCtrlRef.current.stop();
                  speechCtrlRef.current = null;
                }
                setMode('image');
                fileInputRef.current?.click();
              }}
            >
              <Icon name="camera" size={14} />
              <span>Hình ảnh</span>
            </button>
          </div>
        </div>

        {/* Input Group */}
        <div className="join w-full shadow-xs">
          <button
            type="button"
            onClick={() => {
              if (mode === 'voice') handleMicToggle();
              else if (mode === 'image') fileInputRef.current?.click();
              else inputRef.current?.focus();
            }}
            className={`join-item flex items-center pl-4 pr-2.5 border border-base-300 border-r-0 transition-colors ${
              isRecording
                ? 'bg-error/10 text-error'
                : 'bg-base-100 text-base-content/60 hover:text-primary'
            }`}
            title={
              mode === 'voice'
                ? 'Bật hoặc dừng thu âm giọng nói'
                : mode === 'image'
                ? 'Tải ảnh trang phục'
                : 'Nhập từ khóa tìm kiếm'
            }
          >
            <Icon
              name={
                mode === 'image' ? 'camera' : mode === 'voice' ? 'mic' : 'search'
              }
              size={18}
            />
          </button>

          <input
            ref={inputRef}
            value={inQuery}
            onChange={(e) => setInQuery(e.target.value)}
            placeholder={placeholderText}
            aria-label="Nội dung tìm kiếm"
            className="input input-bordered join-item flex-1 bg-base-100 border-x-0 focus:outline-none text-sm placeholder:text-base-content/40"
          />

          {mode === 'voice' && (
            <button
              type="button"
              onClick={handleMicToggle}
              className={`btn join-item btn-sm sm:btn-md gap-1.5 ${
                isRecording
                  ? 'btn-error'
                  : 'btn-ghost border-y border-base-300'
              }`}
            >
              <Icon name="mic" size={15} />
              <span className="text-xs">
                {isRecording ? 'Dừng thu âm' : 'Thu âm'}
              </span>
            </button>
          )}

          {mode === 'image' && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-ghost border-y border-base-300 join-item text-xs"
            >
              Chọn ảnh…
            </button>
          )}

          <button
            type="submit"
            className="btn btn-primary join-item px-5 gap-1.5"
            aria-label="Tìm kiếm"
          >
            <span className="hidden sm:inline text-xs font-semibold">Tìm kiếm</span>
            <Icon name="arrow" size={18} />
          </button>
        </div>

        {/* Voice Input Helper Bar */}
        {mode === 'voice' && (
          <div className="mt-2.5 p-3 rounded-field bg-base-200/70 border border-base-300 text-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`status ${
                    isRecording ? 'status-error animate-ping' : 'status-success'
                  }`}
                />
                <span className="font-medium text-base-content">
                  {isRecording
                    ? 'Đang thu âm liên tục qua Micro — Hãy nói nguyên câu, sau đó bấm "Dừng thu âm" hoặc "Tìm kiếm"'
                    : 'Đặt con trỏ vào ô tìm kiếm và giữ Ctrl + Space để nói qua Amical AI Voice, hoặc bấm nút "Thu âm"'}
                </span>
              </div>
              {inQuery && (
                <button
                  type="button"
                  onClick={() => setInQuery('')}
                  className="btn btn-ghost btn-xs text-base-content/60"
                >
                  Xóa chữ
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_VOICE_PROMPTS.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    setInQuery(sample);
                    actionPerformed(undefined, sample, 'voice');
                  }}
                  className="badge badge-outline hover:badge-primary cursor-pointer py-2.5 text-[11px] transition-colors"
                >
                  “{sample}”
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Search Suggestions */}
        {!compact && mode === 'text' && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-base-content/50 text-[11px]">Gợi ý tìm nhanh:</span>
            <button
              type="button"
              onClick={() => {
                const q = 'áo sơ mi trắng dưới 2 triệu';
                setInQuery(q);
                actionPerformed(undefined, q, 'text');
              }}
              className="badge badge-ghost hover:badge-primary cursor-pointer text-[11px]"
            >
              Áo sơ mi trắng dưới 2 triệu
            </button>
            <button
              type="button"
              onClick={() => {
                const q = 'váy lụa màu đỏ dưới 800k';
                setInQuery(q);
                actionPerformed(undefined, q, 'text');
              }}
              className="badge badge-ghost hover:badge-primary cursor-pointer text-[11px]"
            >
              Váy lụa màu đỏ dưới 800k
            </button>
            <button
              type="button"
              onClick={() => {
                const q = 'SF-2026-0038';
                setInQuery(q);
                actionPerformed(undefined, q, 'text');
              }}
              className="badge badge-ghost hover:badge-primary cursor-pointer text-[11px]"
            >
              Tra cứu đơn: SF-2026-0038
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          hidden
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => handleFileChange(e.target.files?.[0])}
        />
      </form>

      {uploadedPreviewUrl && (
        <ObjectSelectionModal
          imageUrl={uploadedPreviewUrl}
          fileName={uploadedFileName}
          boxes={detectedBoxes}
          onConfirm={handleConfirmImageBox}
          onCancel={() => setUploadedPreviewUrl(null)}
        />
      )}
    </div>
  );
}
