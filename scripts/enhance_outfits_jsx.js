const fs = require('fs');
let code = fs.readFileSync('apps/web/src/app/outfits/page.tsx', 'utf8');

// Replace the camera buttons and alert block
const targetBlock = `<div className="grid grid-cols-2 gap-2">
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

          <div className="alert alert-info alert-soft text-xs">
            Ảnh không được gửi khi tạo gợi ý. Chức năng thử đồ hiện vẫn là bản mô phỏng.
          </div>`;

const replacementBlock = `<div className="space-y-4">
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

            {/* Decart Realtime Live Stream Button */}
            <div className="bg-primary/5 border border-primary/20 rounded-box p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                  <span className="badge badge-primary badge-xs">Decart AI</span>
                  Lucy VTON 3.6 Realtime
                </span>
                <span className={\`badge badge-xs \${decartStatus?.configured ? 'badge-success' : 'badge-ghost text-xs'}\`}>
                  {decartStatus?.configured ? 'Live API Active' : 'Sandbox Mode'}
                </span>
              </div>
              <p className="text-xs text-base-content/70">
                Trực tiếp biến camera thành gương thử đồ thời gian thực.
              </p>
            </div>

            {/* Quick Sample Fashion Model Selection */}
            <div className="space-y-2 pt-2 border-t border-base-300">
              <span className="text-xs font-bold text-base-content/80 block">
                Hoặc chọn nhanh người mẫu chuẩn để thử đồ ngay:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SAMPLE_MODELS.map((m) => {
                  const isSelected = inBodyPhoto === m.photo;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setInBodyPhoto(m.photo);
                        setTryOnSession(null);
                        setCameraError(null);
                        if (cameraActive) stopWebcam();
                      }}
                      className={\`text-left rounded-box p-1.5 border transition-all text-xs flex flex-col items-center gap-1.5 \${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
                          : 'border-base-300 hover:border-base-content/40 bg-base-200/50'
                      }\`}
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
          </div>`;

// Normalize line endings for replacement
const normalizeText = (t) => t.replace(/\r\n/g, '\n');
const nCode = normalizeText(code);
const nTarget = normalizeText(targetBlock);
const nRepl = normalizeText(replacementBlock);

if (nCode.includes(nTarget)) {
  code = nCode.replace(nTarget, nRepl);
  fs.writeFileSync('apps/web/src/app/outfits/page.tsx', code, 'utf8');
  console.log('Successfully enhanced Step 1 with Sample Models and Decart Live Stream!');
} else {
  console.error('Target block not found in OutfitsPage.');
}

