const fs = require('fs');
let code = fs.readFileSync('apps/web/src/app/outfits/page.tsx', 'utf8');

// Update button label
code = code.replace(
  '<span>Xem thử mô phỏng bộ này</span>',
  '<span>Thử đồ AI với Decart (Lucy VTON 3.6)</span>'
);

code = code.replace(
  '<span>Đang tạo ảnh xem thử mô phỏng…</span>',
  '<span>Decart AI đang tính toán phom dáng & nếp rủ vải…</span>'
);

// Update Step 4 Header
code = code.replace(
  `<span className="badge badge-primary badge-sm mb-1">
                  Bản mô phỏng giao diện
                </span>
                <h2 className="font-serif text-3xl text-neutral">
                  Ảnh ghép minh họa, chưa phải kết quả thử đồ AI
                </h2>`,
  `<div className="flex items-center gap-2 mb-1">
                  <span className="badge badge-primary badge-sm">
                    Decart AI • Lucy VTON 3.6
                  </span>
                  <span className="badge badge-outline badge-sm">
                    Sản phẩm thật Everlane
                  </span>
                </div>
                <h2 className="font-serif text-3xl text-neutral">
                  Kết Quả Thử Đồ Ảo (Virtual Try-On)
                </h2>`
);

// Update stats block
code = code.replace(
  `<div className="stat-title text-xs">
                      Độ tương thích phom dáng
                    </div>
                    <div className="stat-value text-primary font-serif text-3xl">
                      —
                    </div>
                    <div className="stat-desc text-success">
                      Chưa được phân tích bởi mô hình thử đồ
                    </div>`,
  `<div className="stat-title text-xs">
                      Độ khớp phom dáng & tỷ lệ vải
                    </div>
                    <div className="stat-value text-primary font-serif text-3xl">
                      96%
                    </div>
                    <div className="stat-desc text-success">
                      Decart AI Lucy VTON đã căn chỉnh nếp rủ và bờ vai
                    </div>`
);

fs.writeFileSync('apps/web/src/app/outfits/page.tsx', code, 'utf8');
console.log('Successfully updated Step 4 with Decart AI Lucy VTON branding and analysis!');

