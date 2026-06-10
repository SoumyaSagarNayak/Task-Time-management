import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmployeeListDto {
    @ApiProperty({ example: 'cuid123' })
    id: string;

    @ApiProperty({ example: 'John Doe' })
    fullName: string;

    @ApiProperty({ example: 'JD' })
    initials: string;

    @ApiProperty({ example: 'john.doe@example.com' })
    email: string;

    @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
    avatarUrl?: string;

    @ApiPropertyOptional({ example: 'Engineering' })
    department?: string;
}
