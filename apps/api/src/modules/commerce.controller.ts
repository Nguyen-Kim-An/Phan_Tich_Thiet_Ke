import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsArray, IsInt, IsObject, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DatabaseService } from '../database.service';

class ItemDto { @IsUUID() variantId!: string; @IsInt() @Min(1) quantity!: number; }
class CheckoutDto {
  @IsUUID() userId!: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => ItemDto) items!: ItemDto[];
  @IsObject() shippingAddress!: Record<string,string>;
  @IsString() paymentMethod!: string;
  @IsOptional() @IsString() voucherCode?: string;
}

@Controller('commerce')
export class CommerceController {
  constructor(private readonly db: DatabaseService) {}

  @Post('checkout')
  async checkout(@Body() dto: CheckoutDto) {
    if (!dto.items.length) throw new BadRequestException('Giỏ hàng đang trống');
    return this.db.transaction(async client => {
      let subtotal = 0;
      const resolved: any[] = [];
      for (const item of dto.items) {
        const { rows } = await client.query(`SELECT v.variant_id,v.stock_quantity,COALESCE(v.price_override,p.base_price) price FROM product_variants v JOIN products p ON p.product_id=v.product_id WHERE v.variant_id=$1 FOR UPDATE`, [item.variantId]);
        const variant = rows[0];
        if (!variant || variant.stock_quantity < item.quantity) throw new BadRequestException('Một sản phẩm không còn đủ tồn kho');
        subtotal += Number(variant.price) * item.quantity;
        resolved.push({ ...item, price: Number(variant.price) });
      }
      let discount = 0;
      if (dto.voucherCode) {
        const { rows } = await client.query(`SELECT * FROM vouchers WHERE code=$1 AND active AND now() BETWEEN starts_at AND ends_at AND min_order_amount <= $2`, [dto.voucherCode.toUpperCase(), subtotal]);
        if (rows[0]) discount = rows[0].discount_type === 'percent' ? subtotal * Number(rows[0].discount_value) / 100 : Number(rows[0].discount_value);
      }
      const shippingFee = subtotal >= 1500000 ? 0 : 30000;
      const total = Math.max(0, subtotal - discount) + shippingFee;
      const order = (await client.query(`INSERT INTO orders(user_id,total_amount,shipping_fee,shipping_address,order_status,payment_status) VALUES($1,$2,$3,$4,'new',$5) RETURNING *`, [dto.userId,total,shippingFee,dto.shippingAddress,dto.paymentMethod === 'cod' ? 'pending' : 'paid'])).rows[0];
      for (const item of resolved) {
        await client.query('INSERT INTO order_items(order_id,variant_id,quantity,unit_price) VALUES($1,$2,$3,$4)', [order.order_id,item.variantId,item.quantity,item.price]);
        await client.query('SELECT adjust_variant_stock($1,$2)', [item.variantId,-item.quantity]);
      }
      return { ...order, subtotal, discount };
    });
  }

  @Get('orders/user/:userId')
  async orders(@Param('userId') userId: string) {
    return (await this.db.query(`SELECT o.*,json_agg(json_build_object('sku',v.sku,'name',p.name,'quantity',oi.quantity,'unitPrice',oi.unit_price)) items FROM orders o JOIN order_items oi ON oi.order_id=o.order_id JOIN product_variants v ON v.variant_id=oi.variant_id JOIN products p ON p.product_id=v.product_id WHERE o.user_id=$1 GROUP BY o.order_id ORDER BY o.created_at DESC`, [userId])).rows;
  }
}
