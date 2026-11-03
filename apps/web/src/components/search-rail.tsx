'use client';

import { FormEvent, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from './icons';

export function SearchRail({ compact = false }: { compact?: boolean }) {
  const [mode, setMode] = useState<'text' | 'image' | 'voice'>('text');
  const [query, setQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const finalQuery = query.trim() || (mode === 'image' ? 'phong cách từ ảnh' : 'gợi ý trang phục');
    router.push(`/shop?q=${encodeURIComponent(finalQuery)}&mode=${mode}`);
  };

  const placeholderText = {
    text: 'Thử “váy lụa xanh cho tiệc tối”, “blazer công sở”…',
    image: 'Tải ảnh trang phục để Stylist AI tìm kiểu dáng tương tự…',
    voice: 'Nhấn vào mic và mô tả phong cách bạn đang tìm…',
  }[mode];

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Mode Switcher Tabs */}
      <div
        role="tablist"
        className={`tabs ${compact ? 'tabs-box bg-base-200/80 p-1 mb-2 max-w-max rounded-field' : 'tabs-border mb-3'}`}
      >
        <button
          role="tab"
          type="button"
          className={`tab tab-sm gap-1.5 ${mode === 'text' ? 'tab-active font-medium' : ''}`}
          onClick={() => setMode('text')}
        >
          <Icon name="search" size={14} />
          <span>Văn bản</span>
        </button>
        <button
          role="tab"
          type="button"
          className={`tab tab-sm gap-1.5 ${mode === 'image' ? 'tab-active font-medium' : ''}`}
          onClick={() => {
            setMode('image');
            fileInputRef.current?.click();
          }}
        >
          <Icon name="camera" size={14} />
          <span>Hình ảnh</span>
        </button>
        <button
          role="tab"
          type="button"
          className={`tab tab-sm gap-1.5 ${mode === 'voice' ? 'tab-active font-medium' : ''}`}
          onClick={() => setMode('voice')}
        >
          <Icon name="mic" size={14} />
          <span>Giọng nói</span>
        </button>
      </div>

      {/* Input Group */}
      <div className="join w-full shadow-xs">
        <div className="join-item flex items-center pl-4 pr-2 bg-base-100 border border-base-300 border-r-0 text-base-content/60">
          <Icon
            name={mode === 'image' ? 'camera' : mode === 'voice' ? 'mic' : 'search'}
            size={18}
          />
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholderText}
          aria-label="Nội dung tìm kiếm"
          className="input input-bordered join-item flex-1 bg-base-100 border-x-0 focus:outline-none text-sm placeholder:text-base-content/40"
        />
        <button
          type="submit"
          className="btn btn-primary join-item px-5"
          aria-label="Tìm kiếm"
        >
          <Icon name="arrow" size={18} />
        </button>
      </div>

      {/* Hidden file picker for image search mode */}
      <input
        ref={fileInputRef}
        hidden
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setQuery(`Ảnh: ${file.name}`);
          }
        }}
      />
    </form>
  );
}
