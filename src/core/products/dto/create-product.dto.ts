import { IsNotEmpty, IsString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({
    description: 'Nom du produit',
    example: 'Glock',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Nom du modèle du produit',
    example: 'Glock 17',
  })
  @IsNotEmpty()
  @IsString()
  modelName: string;

  @ApiProperty({
    description: 'Quantité en stock',
    example: 5,
    minimum: 1,
    type: 'integer',
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;
}
