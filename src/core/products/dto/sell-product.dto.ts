import { IsNotEmpty, IsInt, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * Data transfer object for selling a product.
 */
export class SellProductDto {
  /**
   * The quantity of the product to sell.
   * @example 1
   */
  @ApiProperty({
    description: "The quantity of the product to sell",
    example: 1,
    minimum: 1,
    type: "integer",
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;
}
