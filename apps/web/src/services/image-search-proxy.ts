
export async function forwardImageSearch(request: Request, suffix = '') {
  if (Number(request.headers.get('content-length')) > 12 * 1024 * 1024) {
    return Response.json({ message: 'Ảnh tối đa 10 MB.' }, { status: 413 });
  }
  try {
    const form = await request.formData();
    const image = form.get('image');
    if (!(image instanceof File) || !['image/jpeg', 'image/png', 'image/webp'].includes(image.type)) {
      return Response.json({ message: 'Hãy chọn ảnh JPEG, PNG hoặc WebP.' }, { status: 400 });
    }
    if (!image.size || image.size > 10 * 1024 * 1024) {
      return Response.json({ message: 'Ảnh phải lớn hơn 0 byte và không vượt quá 10 MB.' }, { status: 413 });
    }
    const backend = (process.env.API_INTERNAL_URL || 'http://localhost:4000/api/v1').replace(/\/$/, '');
    const forward = new FormData();
    forward.set('image', image);
    const category = form.get('category');
    if (typeof category === 'string') forward.set('category', category);
    const box = form.get('box');
    if (typeof box === 'string') forward.set('box', box);
    let response: Response;
    try {
      response = await fetch(`${backend}/ai/image-search${suffix}`, {
        method: 'POST', body: forward, cache: 'no-store',
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(100000)]),
      });
    } catch {
      return Response.json({ message: 'Không kết nối được backend tìm ảnh hoặc hết thời gian chờ. Kiểm tra API cổng 4000.' }, { status: 502 });
    }
    const result = await response.json().catch(() => ({ message: 'Backend trả dữ liệu không hợp lệ.' }));
    return Response.json(result, { status: response.status, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ message: 'Không đọc được nội dung ảnh. Hãy chọn một ảnh JPEG, PNG hoặc WebP hợp lệ.' }, { status: 422 });
  }
}
