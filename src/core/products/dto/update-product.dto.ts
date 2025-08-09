import { IsNotEmpty, IsInt, Min, IsNumber, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * Data transfer object for updating a product.
 */
export class UpdateProductDto {
  /**
   * The new quantity in stock.
   * @example 10
   */
  @ApiProperty({
    description: "The new quantity in stock",
    example: 10,
    minimum: 1,
    type: "integer",
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;

  /**
   * The new price of the product.
   * @example 39.99
   */
  @ApiProperty({
    description: "The new price of the product",
    example: 39.99,
    minimum: 0,
    type: "number",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;
}
