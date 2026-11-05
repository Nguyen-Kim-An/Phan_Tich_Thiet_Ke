import { Body, Controller, HttpCode, HttpException, HttpStatus, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageSearchService, validateBoxes } from './image-search.service';

@Controller('ai/image-search')
export class ImageSearchController {
  constructor(private readonly imageSearch: ImageSearchService) {}

  @Post()
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 10 * 1024 * 1024, files: 1 } }))
  search(@UploadedFile() image?: { buffer: Buffer; mimetype: string; size: number }, @Body('category') category?: string, @Body('box') boxJson?: string) {
    if (!image || !image.size || !['image/jpeg', 'image/png', 'image/webp'].includes(image.mimetype)) {
      throw new HttpException('Hãy chọn ảnh JPEG, PNG hoặc WebP, tối đa 10 MB.', HttpStatus.BAD_REQUEST);
    }
    let box;
    if (boxJson) {
      try { box = validateBoxes([JSON.parse(boxJson)])[0]; } catch { /* Reject below. */ }
      if (!box) throw new HttpException('Vùng ảnh được chọn không hợp lệ.', HttpStatus.BAD_REQUEST);
    }
    return this.imageSearch.search(image.buffer, typeof category === 'string' ? category : '', box);
  }

  @Post('detect')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 10 * 1024 * 1024, files: 1 } }))
  detect(@UploadedFile() image?: { buffer: Buffer; mimetype: string; size: number }) {
    if (!image || !image.size || !['image/jpeg', 'image/png', 'image/webp'].includes(image.mimetype)) {
      throw new HttpException('Hãy chọn ảnh JPEG, PNG hoặc WebP, tối đa 10 MB.', HttpStatus.BAD_REQUEST);
    }
    return this.imageSearch.detect(image.buffer);
  }
}
