import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsHexColor } from 'class-validator';

export class CreateTagDto {
    @ApiProperty({ description: 'The name of the tag' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiPropertyOptional({ description: 'The hex color code for the tag', default: '#3B82F6' })
    @IsOptional()
    @IsHexColor()
    color?: string;
}
