import { IsNotEmpty, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SellProductDto {
  @ApiProperty({
    description: 'Quantité de produit à vendre',
    example: 1,
    minimum: 1,
    type: 'integer',
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;
}
