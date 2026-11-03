import { Controller, Get, Param, Query } from '@nestjs/common';
import { DatabaseService } from '../database.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly db: DatabaseService) {}

  @Get('categories')
  async categories() {
    return (await this.db.query('SELECT category_id,name,parent_id FROM categories ORDER BY parent_id NULLS FIRST,name')).rows;
  }

  @Get('products')
  async products(@Query('q') q = '', @Query('category') category = '') {
    const term = `%${q}%`;
    return (await this.db.query(`
      SELECT p.product_id,p.name,p.base_price,p.description,p.status,c.name category_name,
        COALESCE((SELECT image_url FROM product_images i WHERE i.product_id=p.product_id AND i.is_primary ORDER BY i.variant_id NULLS FIRST LIMIT 1),'') image_url,
        COALESCE(SUM(v.stock_quantity),0)::int stock_quantity,
        json_agg(json_build_object('variantId',v.variant_id,'sku',v.sku,'colorCode',v.color_code,'colorName',v.color_name,'size',v.size,'price',COALESCE(v.price_override,p.base_price),'stock',v.stock_quantity) ORDER BY v.sku) variants
      FROM products p JOIN categories c ON c.category_id=p.category_id
      LEFT JOIN product_variants v ON v.product_id=p.product_id
      WHERE p.status='active' AND ($1='' OR p.name ILIKE $2 OR p.description ILIKE $2) AND ($3='' OR p.category_id::text=$3)
      GROUP BY p.product_id,c.name ORDER BY p.name`, [q, term, category])).rows;
  }

  @Get('products/:id')
  async product(@Param('id') id: string) {
    const products = await this.db.query(`SELECT p.*,c.name category_name,
      COALESCE(json_agg(DISTINCT jsonb_build_object('variantId',v.variant_id,'sku',v.sku,'colorCode',v.color_code,'colorName',v.color_name,'size',v.size,'price',COALESCE(v.price_override,p.base_price),'stock',v.stock_quantity)) FILTER (WHERE v.variant_id IS NOT NULL),'[]') variants,
      COALESCE(json_agg(DISTINCT jsonb_build_object('url',i.image_url,'variantId',i.variant_id,'primary',i.is_primary)) FILTER (WHERE i.image_id IS NOT NULL),'[]') images
      FROM products p JOIN categories c ON c.category_id=p.category_id LEFT JOIN product_variants v ON v.product_id=p.product_id LEFT JOIN product_images i ON i.product_id=p.product_id WHERE p.product_id=$1 AND p.status='active' GROUP BY p.product_id,c.name`, [id]);
    return products.rows[0] ?? null;
  }

  @Get('outfits')
  async outfits() {
    return (await this.db.query(`SELECT o.outfit_id,o.title,o.style_tag,json_agg(json_build_object('productId',p.product_id,'name',p.name,'price',p.base_price,'isMain',oi.is_main_item)) items FROM outfits o JOIN outfit_items oi ON oi.outfit_id=o.outfit_id JOIN products p ON p.product_id=oi.product_id GROUP BY o.outfit_id ORDER BY o.title`)).rows;
  }
}
