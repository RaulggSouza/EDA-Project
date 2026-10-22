import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { DiscountService } from './discount.service';

@Controller()
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @Get('products')
  listProducts() {
    return this.discountService.listProducts();
  }

  @Get('suggestions')
  listSuggestions() {
    return this.discountService.listSuggestions();
  }

  @Post('suggestions/:sku/apply')
  @HttpCode(200)
  apply(@Param('sku') sku: string) {
    return this.discountService.apply(sku);
  }
}
