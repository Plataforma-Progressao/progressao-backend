import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectActivityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  rejectionReason!: string;
}
