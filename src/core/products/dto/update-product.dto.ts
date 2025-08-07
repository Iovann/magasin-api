import { IsNotEmpty, IsInt, Min } from 'class-validator';

export class UpdateProductDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;
}