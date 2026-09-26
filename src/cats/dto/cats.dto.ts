import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsIn, IsInt, IsString } from 'class-validator';

export const CAT_STATES = ['입양', '키우는 중'] as const;
export type state = (typeof CAT_STATES)[number];

export class CatDto {
  @IsInt()
  id: number;

  @IsString()
  name: string;

  @IsString()
  pet: string;

  @IsIn(CAT_STATES)
  state: state;
}

export class UpdateCatDto extends PartialType(
  OmitType(CatDto, ['id'] as const),
) {}

export class CreateCatDto extends CatDto {}
