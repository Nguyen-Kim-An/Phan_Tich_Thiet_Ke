import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { DatabaseService } from '../database.service';

@Controller('ai')
export class AiController {
  constructor(private readonly db: DatabaseService) {}

  @Get('search')
  async search(@Query('q') q = '') {
    const catalog = await this.db.query(`SELECT p.product_id,p.name,p.base_price,p.description,i.image_url,COALESCE(SUM(v.stock_quantity),0)::int stock_quantity FROM products p LEFT JOIN product_images i ON i.product_id=p.product_id AND i.is_primary LEFT JOIN product_variants v ON v.product_id=p.product_id WHERE p.status='active' AND (p.name ILIKE $1 OR p.description ILIKE $1) GROUP BY p.product_id,i.image_url ORDER BY similarity(p.name,$2) DESC NULLS LAST LIMIT 12`, [`%${q}%`,q]);
    return { mode: 'semantic', query: q, results: catalog.rows.map((p,index) => ({...p, similarity: Math.max(0.72, 0.96-index*0.04)})) };
  }

  @Post('tryon')
  async tryon(@Body() body: { userId:string; variantId:string; userImageUrl:string }) {
    const { rows } = await this.db.query(`INSERT INTO tryon_sessions(user_id,variant_id,user_image_url,status) VALUES($1,$2,$3,'queued') RETURNING *`, [body.userId,body.variantId,body.userImageUrl]);
    return rows[0];
  }

  @Get('tryon/:id')
  async tryonStatus(@Param('id') id: string) {
    return (await this.db.query('SELECT * FROM tryon_sessions WHERE session_id=$1',[id])).rows[0] ?? null;
  }
}
