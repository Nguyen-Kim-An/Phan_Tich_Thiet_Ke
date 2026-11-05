'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BoundingBox, Modality } from '@/domain/models';
import {
  ContinuousSpeechController,
  startContinuousVoiceSession,
} from '@/services/voice-session';
import { saveImageSearch } from '@/services/image-search-session';
import type { ImageSearchResult } from '@/services/image-search-types';
import { ObjectSelectionModal } from './object-selection-modal';
import { Icon } from './icons';

const SAMPLE_VOICE_PROMPTS = [
  'Tôi muốn tìm áo khoác blazer xám mặc đi làm dưới 3 triệu',
  'Tìm giúp tôi áo sơ mi trắng thanh lịch công sở',
  'Đầm thiết kế màu đỏ rượu đi tiệc tối',
  'Kiểm tra đơn hàng SF-2026-0038',
];

export function SearchRail({ compact = false, initialMode = 'text' }: { compact?: boolean; initialMode?: Modality }) {
  const [mode, setMode] = useState<Modality>(initialMode);
  const [inQuery, setInQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceStarting, setVoiceStarting] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // ImageUpload state
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [imageSearching, setImageSearching] = useState(false);
  const [imageDetecting, setImageDetecting] = useState(false);
  const [detectedBoxes, setDetectedBoxes] = useState<BoundingBox[]>([]);
  const detectorAbortRef = useRef<AbortController | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const uploadedImageRef = useRef<File | null>(null);
  const imageSearchIdRef = useRef('');
  const previewRef = useRef<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechCtrlRef = useRef<ContinuousSpeechController | null>(null);
  const router = useRouter();

  // Cleanup active speech session on unmount
  useEffect(() => {
    return () => {
      speechCtrlRef.current?.stop();
      detectorAbortRef.current?.abort();
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
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
    if (activeMode === 'image') {
      if (imageSearchIdRef.current) {
        router.push(`/shop?${new URLSearchParams({ q: 'Ảnh tải lên', mode: 'image', imageSearch: imageSearchIdRef.current })}`);
      } else {
        fileInputRef.current?.click();
      }
      return;
    }
    const finalQuery =
      (overrideQuery !== undefined ? overrideQuery : inQuery).trim() ||
      'áo sơ mi trắng công sở';

    const params = new URLSearchParams();
    params.set('q', finalQuery);
    params.set('mode', activeMode);
    router.push(`/shop?${params.toString()}`);
  };

  const stopVoice = () => {
    speechCtrlRef.current?.stop();
    speechCtrlRef.current = null;
    setIsRecording(false);
    setVoiceStarting(false);
  };

  const handleMicToggle = () => {
    setMode('voice');
    inputRef.current?.focus();
    if (speechCtrlRef.current) { stopVoice(); return; }
    setVoiceError(null);
    setVoiceStarting(true);
    let ended = false;
    const controller = startContinuousVoiceSession(
      inQuery,
      setInQuery,
      (listening) => {
        setIsRecording(listening);
        setVoiceStarting(false);
        if (!listening) { ended = true; speechCtrlRef.current = null; }
      },
      setVoiceError,
    );
    speechCtrlRef.current = controller.isSupported && !ended ? controller : null;
  };

  const closeImagePreview = () => {
    if (imageSearching) return;
    detectorAbortRef.current?.abort();
    setImageDetecting(false);
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
    setUploadedPreviewUrl(null);
  };

  const handleFileChange = async (file?: File) => {
    if (!file) return;
    setImageError(null);
    if (file.size > 10 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setImageError('Hãy chọn ảnh JPEG, PNG hoặc WebP không quá 10 MB.');
      return;
    }
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = URL.createObjectURL(file);
    previewRef.current = url;
    uploadedImageRef.current = file;
    imageSearchIdRef.current = '';
    setUploadedPreviewUrl(url);
    setUploadedFileName(file.name);
    setDetectedBoxes([]);
    detectorAbortRef.current?.abort();
    const controller = new AbortController();
    detectorAbortRef.current = controller;
    setImageDetecting(true);
    try {
      const form = new FormData();
      form.set('image', file);
      const response = await fetch('/api/image-search/detect', {
        method: 'POST', body: form, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(55000)]),
      });
      const body = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok) throw new Error(body.message || 'Không nhận diện được vùng trang phục.');
      if (!Array.isArray(body.boxes)) throw new Error('Kết quả nhận diện vùng không hợp lệ.');
      setDetectedBoxes(body.boxes);
    } catch (error) {
      if (!controller.signal.aborted) setImageError(error instanceof Error ? error.message : 'Không nhận diện được vùng ảnh. Bạn có thể tìm toàn bộ ảnh.');
    } finally {
      if (!controller.signal.aborted) setImageDetecting(false);
    }
  };

  const handleConfirmImageBox = async (selectedBox?: BoundingBox) => {
    const image = uploadedImageRef.current;
    if (!image || imageSearching) return;
    setImageSearching(true);
    setImageError(null);
    try {
      const form = new FormData();
      form.set('image', image);
      if (selectedBox) {
        form.set('category', selectedBox.categorySlug);
        form.set('box', JSON.stringify(selectedBox));
      }
      const response = await fetch('/api/image-search', { method: 'POST', body: form, signal: AbortSignal.timeout(110000) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Không tìm kiếm được ảnh.');
      const result = body as ImageSearchResult;
      const matches = result.matches;
      if (!Array.isArray(matches)) throw new Error('Kết quả tìm ảnh không hợp lệ.');
      const id = saveImageSearch({ ...result, matches, fileName: image.name, createdAt: Date.now() });
      imageSearchIdRef.current = id;
      setInQuery('Ảnh tải lên');
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
      setUploadedPreviewUrl(null);
      router.push(`/shop?${new URLSearchParams({ q: 'Ảnh tải lên', mode: 'image', imageSearch: id })}`);
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Tìm kiếm ảnh thất bại. Hãy thử lại.');
    } finally {
      setImageSearching(false);
    }
  };

  const placeholderText = {
    text: 'Tìm sản phẩm (“áo sơ mi trắng dưới 2 triệu”) hoặc nhập mã đơn (“SF-2026-0038”)…',
    image: 'Tải ảnh quần áo để tìm sản phẩm cùng kiểu dáng, màu sắc…',
    voice: 'Bấm Thu âm, cho phép micro rồi nói nội dung cần tìm…',
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
              aria-selected={mode === 'text'}
              onClick={() => {
                stopVoice();
                setVoiceError(null);
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
              aria-selected={mode === 'voice'}
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
              aria-selected={mode === 'image'}
              onClick={() => {
                stopVoice();
                setVoiceError(null);
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
            onChange={(e) => {
              stopVoice();
              setInQuery(e.target.value);
            }}
            placeholder={placeholderText}
            aria-label="Nội dung tìm kiếm"
            className="input input-bordered join-item flex-1 bg-base-100 border-x-0 focus:outline-none text-sm placeholder:text-base-content/40"
          />

          {mode === 'voice' && (
            <button
              type="button"
              onClick={handleMicToggle}
              aria-pressed={isRecording || voiceStarting}
              className={`btn join-item btn-sm sm:btn-md gap-1.5 ${
                isRecording
                  ? 'btn-error'
                  : 'btn-ghost border-y border-base-300'
              }`}
            >
              <Icon name="mic" size={15} />
              <span className="text-xs">
                {voiceStarting ? 'Hủy mở mic' : isRecording ? 'Dừng thu âm' : 'Thu âm'}
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

        {voiceError && mode === 'voice' && (
          <div role="alert" className="alert alert-warning alert-soft mt-3 text-sm">
            {voiceError}
          </div>
        )}

        {mode === 'image' && imageError && !uploadedPreviewUrl && (
          <div role="alert" className="alert alert-warning alert-soft mt-3 text-sm">{imageError}</div>
        )}

        {/* Voice Input Helper Bar */}
        {mode === 'voice' && (
          <div className="mt-2.5 p-3 rounded-field bg-base-200/70 border border-base-300 text-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`status ${
                    isRecording ? 'status-error animate-ping' : 'status-neutral'
                  }`}
                />
                <span role="status" className="font-medium text-base-content">
                  {voiceStarting
                    ? 'Đang mở micro… Nếu trình duyệt hỏi quyền, hãy chọn Cho phép. Bấm Hủy mở mic để dừng.'
                    : isRecording
                    ? 'Đang thu âm liên tục qua Micro — Hãy nói nguyên câu, sau đó bấm "Dừng thu âm" hoặc "Tìm kiếm"'
                    : 'Bấm "Thu âm", cho phép micro rồi nói nội dung cần tìm.'}
                </span>
              </div>
              {inQuery && (
                <button
                  type="button"
                  onClick={() => { stopVoice(); setInQuery(''); }}
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
          onChange={(e) => {
            handleFileChange(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </form>

      {uploadedPreviewUrl && (
        <ObjectSelectionModal
          imageUrl={uploadedPreviewUrl}
          fileName={uploadedFileName}
          boxes={detectedBoxes}
          detecting={imageDetecting}
          busy={imageSearching}
          error={imageError}
          onConfirm={handleConfirmImageBox}
          onCancel={closeImagePreview}
        />
      )}
    </div>
  );
}
