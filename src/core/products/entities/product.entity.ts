import { ApiProperty } from "@nestjs/swagger";

/**
 * Represents a Product.
 */
export class Product {
  /**
   * The unique identifier of the product.
   * @example "507f1f77bcf86cd799439011"
   */
  @ApiProperty({
    description: "The unique identifier of the product",
    example: "507f1f77bcf86cd799439011",
  })
  id: string;

  /**
   * The name of the product.
   * @example "Glock"
   */
  @ApiProperty({
    description: "The name of the product",
    example: "Glock",
  })
  name: string;

  /**
   * The model name of the product.
   * @example "Glock 17"
   */
  @ApiProperty({
    description: "The model name of the product",
    example: "Glock 17",
  })
  modelName: string;

  /**
   * The quantity in stock.
   * @example 5
   */
  @ApiProperty({
    description: "The quantity in stock",
    example: 5,
    type: "integer",
  })
  quantity: number;

  /**
   * The price of the product.
   * @example 29.99
   */
  @ApiProperty({
    description: "The price of the product",
    example: 29.99,
    type: "number",
  })
  price: number;

  /**
   * The creation date of the product.
   * @example "2024-01-01T00:00:00.000Z"
   */
  @ApiProperty({
    description: "The creation date of the product",
    example: "2024-01-01T00:00:00.000Z",
    type: "string",
    format: "date-time",
  })
  createdAt: Date;

  /**
   * The last update date of the product.
   * @example "2024-01-02T10:30:00.000Z"
   */
  @ApiProperty({
    description: "The last update date of the product",
    example: "2024-01-02T10:30:00.000Z",
    type: "string",
    format: "date-time",
  })
  updatedAt: Date;
}
