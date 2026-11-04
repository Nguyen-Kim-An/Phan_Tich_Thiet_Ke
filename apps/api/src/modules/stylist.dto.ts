import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class StylistQuizAnswersDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  occasion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  styleVibe?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  fitGoal?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100_000)
  @Max(100_000_000)
  budgetLimit?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  preferredMaterials?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  preferredColors?: string[];

  @IsOptional()
  @IsIn(['XS', 'S', 'M', 'L', 'XL', 'XXL'])
  preferredSize?: string;
}

export class StylistRecommendDto {
  @IsIn(['quiz', 'voice'])
  inputMode!: 'quiz' | 'voice';

  @IsOptional()
  @ValidateNested()
  @Type(() => StylistQuizAnswersDto)
  quizAnswers?: StylistQuizAnswersDto;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  voiceText?: string;
}
