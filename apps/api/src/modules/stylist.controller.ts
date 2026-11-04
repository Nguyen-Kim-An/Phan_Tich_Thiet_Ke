import { Body, Controller, Post } from '@nestjs/common';
import { StylistRecommendDto } from './stylist.dto';
import { StylistService } from './stylist.service';

@Controller('ai/stylist')
export class StylistController {
  constructor(private readonly stylist: StylistService) {}

  @Post('recommend')
  recommend(@Body() dto: StylistRecommendDto) {
    return this.stylist.recommend(dto);
  }
}
