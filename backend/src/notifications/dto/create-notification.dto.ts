import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class CreateNotificationDto {
    @IsString()
    @IsNotEmpty()
    recipientId: string;

    @IsString()
    @IsOptional()
    actorId?: string;

    @IsString()
    @IsNotEmpty()
    type: string;

    @IsString()
    @IsNotEmpty()
    entityType: string;

    @IsString()
    @IsNotEmpty()
    entityId: string;

    @IsObject()
    @IsOptional()
    payload?: Record<string, any>;
}
