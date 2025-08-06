import { IsNotEmpty, IsInt, Min, IsUUID } from 'class-validator';

export class UpdateProductDto {
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;
}