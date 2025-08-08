import { IsNotEmpty, IsInt, Min, IsNumber, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateProductDto {
  @ApiProperty({
    description: "Nouvelle quantité en stock",
    example: 10,
    minimum: 1,
    type: "integer",
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: "Nouveau prix du produit",
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
