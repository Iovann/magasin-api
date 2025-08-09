import { IsNotEmpty, IsString, IsInt, Min, IsNumber } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * Data transfer object for creating a new product.
 */
export class CreateProductDto {
  /**
   * The name of the product.
   * @example "Glock"
   */
  @ApiProperty({
    description: "The name of the product",
    example: "Glock",
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  /**
   * The model name of the product.
   * @example "Glock 17"
   */
  @ApiProperty({
    description: "The model name of the product",
    example: "Glock 17",
  })
  @IsNotEmpty()
  @IsString()
  modelName: string;

  /**
   * The quantity in stock.
   * @example 5
   */
  @ApiProperty({
    description: "The quantity in stock",
    example: 5,
    minimum: 1,
    type: "integer",
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;

  /**
   * The price of the product.
   * @example 29.99
   */
  @ApiProperty({
    description: "The price of the product",
    example: 29.99,
    minimum: 0,
    type: "number",
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;
}
