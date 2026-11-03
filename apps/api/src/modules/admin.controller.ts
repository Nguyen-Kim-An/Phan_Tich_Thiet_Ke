import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { DatabaseService } from '../database.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly db: DatabaseService) {}

  @Get('overview')
  async overview() {
    const { rows } = await this.db.query(`SELECT
      (SELECT COALESCE(SUM(total_amount),0) FROM orders WHERE payment_status='paid') revenue,
      (SELECT COUNT(*) FROM orders) orders,
      (SELECT COUNT(*) FROM users WHERE role='customer') customers,
      (SELECT COUNT(*) FROM product_variants WHERE stock_quantity <= 5) low_stock,
      (SELECT COUNT(*) FROM tryon_sessions) tryons`);
    return rows[0];
  }

  @Get('inventory')
  async inventory() {
    return (await this.db.query(`SELECT v.variant_id,v.sku,p.name,v.color_name,v.size,v.stock_quantity FROM product_variants v JOIN products p ON p.product_id=v.product_id ORDER BY v.stock_quantity,p.name`)).rows;
  }

  @Patch('inventory/:id')
  async stock(@Param('id') id: string, @Body() body: { delta:number }) {
    return (await this.db.query('SELECT adjust_variant_stock($1,$2) stock_quantity',[id,body.delta])).rows[0];
  }

  @Get('orders')
  async orders() { return (await this.db.query(`SELECT o.order_id,o.created_at,o.total_amount,o.order_status,o.payment_status,u.full_name,u.email FROM orders o JOIN users u ON u.user_id=o.user_id ORDER BY o.created_at DESC`)).rows; }

  @Patch('orders/:id/status')
  async status(@Param('id') id:string,@Body() body:{ status:string }) {
    return (await this.db.query('UPDATE orders SET order_status=$2 WHERE order_id=$1 RETURNING *',[id,body.status])).rows[0];
  }
}
