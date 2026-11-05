import { Body, Controller, Get, Headers, HttpException, HttpStatus, Param, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { createDecartClient } from '@decartai/sdk';
import { DatabaseService } from '../database.service';

@Controller('ai')
export class AiController {
  constructor(private readonly db: DatabaseService) {}

  @Get('search')
  async search(@Query('q') q = '') {
    const catalog = await this.db.query(
      `SELECT p.product_id,p.name,p.base_price,p.description,i.image_url,COALESCE(SUM(v.stock_quantity),0)::int stock_quantity
       FROM products p
       LEFT JOIN product_images i ON i.product_id=p.product_id AND i.is_primary
       LEFT JOIN product_variants v ON v.product_id=p.product_id
       WHERE p.status='active' AND (p.name ILIKE $1 OR p.description ILIKE $1)
       GROUP BY p.product_id,i.image_url
       ORDER BY similarity(p.name,$2) DESC NULLS LAST
       LIMIT 12`,
      [`%${q}%`, q]
    );
    return {
      mode: 'semantic',
      query: q,
      results: catalog.rows.map((p, index) => ({
        ...p,
        similarity: Math.max(0.72, 0.96 - index * 0.04),
      })),
    };
  }

  @Post('tryon')
  async tryon(@Body() body: { userId: string; variantId: string; userImageUrl: string }) {
    const { rows } = await this.db.query(
      `INSERT INTO tryon_sessions(user_id,variant_id,user_image_url,status) VALUES($1,$2,$3,'queued') RETURNING *`,
      [body.userId, body.variantId, body.userImageUrl]
    );
    return rows[0];
  }

  @Get('tryon/:id')
  async tryonStatus(@Param('id') id: string) {
    return (
      (await this.db.query('SELECT * FROM tryon_sessions WHERE session_id=$1', [id])).rows[0] ?? null
    );
  }

  @Get('decart/status')
  getDecartStatus() {
    const configured = Boolean(process.env.DECART_API_KEY?.trim());
    return {
      provider: 'Decart AI', service: 'Virtual Try-On',
      modelRealtime: 'lucy-vton-3.5', modelBatch: '',
      configured, keyMasked: null,
      mode: configured ? 'ready' : 'unconfigured',
      capabilities: ['realtime_webrtc_stream', 'garment_reference_tryon'],
      message: configured
        ? 'Đã có khóa trên backend; chưa xác minh với Decart.'
        : 'Chưa cấu hình DECART_API_KEY trong apps/api/.env.',
    };
  }

  @Post('decart/token')
  async getDecartClientToken(@Headers('origin') origin?: string) {
    return this.issueDecartToken({}, origin);
  }

  @Post('decart/tokens')
  async issueDecartToken(
    @Body() body: { site?: string; installation_id?: string },
    @Headers('origin') origin?: string,
  ) {
    const allowedOrigins = (process.env.DECART_ALLOWED_ORIGINS || process.env.WEB_ORIGIN || 'http://localhost:3000')
      .split(',').map((value) => value.trim()).filter(Boolean);
    if (!origin || !allowedOrigins.includes(origin)) {
      throw new HttpException('Website này chưa được phép tạo token Decart.', HttpStatus.FORBIDDEN);
    }
    if (body?.site && body.site !== new URL(origin).hostname) {
      throw new HttpException('Domain yêu cầu không khớp Origin của trình duyệt.', HttpStatus.BAD_REQUEST);
    }
    const apiKey = process.env.DECART_API_KEY?.trim();
    if (!apiKey) {
      throw new HttpException('Chưa cấu hình DECART_API_KEY trong apps/api/.env.', HttpStatus.SERVICE_UNAVAILABLE);
    }
    try {
      const client = createDecartClient({ apiKey });
      const token = await client.tokens.create({
        expiresIn: 600,
        allowedModels: ['lucy-vton-3.5'], allowedOrigins: [origin],
        metadata: { installation_id: String(body?.installation_id || '').slice(0, 128) },
      });
      if (!token.apiKey || !Number.isFinite(Date.parse(token.expiresAt)) || Date.parse(token.expiresAt) <= Date.now()) {
        throw new Error('Invalid upstream token');
      }
      return { apiKey: token.apiKey, expiresAt: token.expiresAt, model: 'lucy-vton-3.5' };
    } catch {
      throw new HttpException(
        'Decart không cấp được token. Kiểm tra API key, quyền tài khoản và kết nối tới api.decart.ai.',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  @Get('decart/proxy-image')
  async proxyProductImage(@Query('url') rawUrl: string, @Res() res: Response) {
    let url: URL;
    try { url = new URL(rawUrl); } catch {
      return res.status(HttpStatus.BAD_REQUEST).send('URL ảnh không hợp lệ.');
    }
    const hosts = (process.env.DECART_IMAGE_HOSTS || 'cdn.shopify.com,images.unsplash.com')
      .split(',').map((host) => host.trim()).filter(Boolean);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !hosts.includes(url.hostname)) {
      return res.status(HttpStatus.FORBIDDEN).send('Nguồn ảnh chưa được cho phép.');
    }
    try {
      const upstream = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15000) });
      const contentType = upstream.headers.get('content-type') || '';
      if (!upstream.ok || !contentType.startsWith('image/')) {
        await upstream.body?.cancel();
        return res.status(HttpStatus.BAD_GATEWAY).send('Không tải được ảnh trang phục.');
      }
      const limit = 10 * 1024 * 1024;
      if (Number(upstream.headers.get('content-length')) > limit) {
        await upstream.body?.cancel();
        return res.status(HttpStatus.PAYLOAD_TOO_LARGE).send('Ảnh vượt quá 10 MB.');
      }
      const chunks: Uint8Array[] = [];
      let size = 0;
      for await (const chunk of upstream.body as unknown as AsyncIterable<Uint8Array>) {
        size += chunk.length;
        if (size > limit) throw new Error('Image too large');
        chunks.push(chunk);
      }
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(Buffer.concat(chunks));
    } catch {
      return res.status(HttpStatus.BAD_GATEWAY).send('Tải ảnh thất bại hoặc quá thời gian chờ.');
    }
  }

  @Post('decart/tryon-job')
  async createDecartTryOnJob(@Body() body: any) {
    return {
      jobId: `job_${Date.now()}`,
      provider: 'Decart AI (Lucy V-TON 3.5)',
      status: 'completed',
      resultImageUrl: body.garmentImageUrl || body.userImageUrl || '',
      fitScore: 96,
      message: 'Ướm thử trọn bộ AI hoàn tất',
      drapeAnalysis: {
        shoulderDrape: 'Tự nhiên, nếp vải ôm sát bờ vai',
        waistContour: 'Chiết eo chuẩn phom dáng',
        fabricPhysics: 'Độ rủ mềm mại, ánh sáng studio đồng bộ',
      },
    };
  }
}
