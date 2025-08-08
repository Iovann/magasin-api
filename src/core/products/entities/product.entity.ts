import { ApiProperty } from '@nestjs/swagger';

export class Product {
  @ApiProperty({
    description: 'Identifiant unique du produit',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'Nom du produit',
    example: 'Glock',
  })
  name: string;

  @ApiProperty({
    description: 'Nom du modèle du produit',
    example: 'Glock 17',
  })
  modelName: string;

  @ApiProperty({
    description: 'Quantité en stock',
    example: 5,
    type: 'integer',
  })
  quantity: number;

  @ApiProperty({
    description: 'Prix du produit',
    example: 29.99,
    type: 'number',
  })
  price: number;

  @ApiProperty({
    description: 'Date de création du produit',
    example: '2024-01-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date de dernière mise à jour du produit',
    example: '2024-01-02T10:30:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  updatedAt: Date;
}
