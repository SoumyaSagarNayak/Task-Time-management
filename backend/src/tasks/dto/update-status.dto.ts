import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class UpdateStatusDto {
    @ApiProperty({ enum: TaskStatus, example: TaskStatus.IN_PROGRESS })
    @IsEnum(TaskStatus)
    status: TaskStatus;

    @ApiPropertyOptional({ example: 0.5 })
    @IsNumber()
    @IsOptional()
    boardOrder?: number;
}
