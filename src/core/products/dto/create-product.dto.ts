import { IsNotEmpty, IsString, IsInt, Min, IsNumber } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateProductDto {
  @ApiProperty({
    description: "Nom du produit",
    example: "Glock",
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: "Nom du modèle du produit",
    example: "Glock 17",
  })
  @IsNotEmpty()
  @IsString()
  modelName: string;

  @ApiProperty({
    description: "Quantité en stock",
    example: 5,
    minimum: 1,
    type: "integer",
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: "Prix du produit",
    example: 29.99,
    minimum: 0,
    type: "number",
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;
}
