import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import type { CurrentUserData } from '../auth/decorators/current-user.decorator';

@Injectable()
export class TagsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createTagDto: CreateTagDto, user: CurrentUserData) {
        return this.prisma.tag.create({
            data: {
                ...createTagDto,
            },
        });
    }

    async findAll(user: CurrentUserData) {
        return this.prisma.tag.findMany({
            where: {
                isActive: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
    }

    async findOne(id: string, user: CurrentUserData) {
        const tag = await this.prisma.tag.findFirst({
            where: {
                id,
            },
        });

        if (!tag) {
            throw new NotFoundException(`Tag with ID ${id} not found`);
        }

        return tag;
    }

    async update(id: string, updateTagDto: UpdateTagDto, user: CurrentUserData) {
        await this.findOne(id, user);

        return this.prisma.tag.update({
            where: { id },
            data: updateTagDto,
        });
    }

    async remove(id: string, user: CurrentUserData) {
        await this.findOne(id, user);

        // Soft delete
        return this.prisma.tag.update({
            where: { id },
            data: { isActive: false },
        });
    }
}
