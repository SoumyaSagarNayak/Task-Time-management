import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser, type CurrentUserData } from '../auth/decorators/current-user.decorator';

@ApiTags('Tags')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('tags')
export class TagsController {
    constructor(private readonly tagsService: TagsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new tag' })
    @ApiResponse({ status: 201, description: 'Tag created successfully' })
    create(@Body() createTagDto: CreateTagDto, @CurrentUser() user: CurrentUserData) {
        return this.tagsService.create(createTagDto, user);
    }

    @Get()
    @ApiOperation({ summary: 'Get all tags' })
    @ApiResponse({ status: 200, description: 'List of tags' })
    findAll(@CurrentUser() user: CurrentUserData) {
        return this.tagsService.findAll(user);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get tag by ID' })
    @ApiResponse({ status: 200, description: 'Tag details' })
    @ApiResponse({ status: 404, description: 'Tag not found' })
    findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
        return this.tagsService.findOne(id, user);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update tag' })
    @ApiResponse({ status: 200, description: 'Tag updated successfully' })
    @ApiResponse({ status: 404, description: 'Tag not found' })
    update(
        @Param('id') id: string,
        @Body() updateTagDto: UpdateTagDto,
        @CurrentUser() user: CurrentUserData,
    ) {
        return this.tagsService.update(id, updateTagDto, user);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Soft delete tag' })
    @ApiResponse({ status: 200, description: 'Tag deleted successfully' })
    @ApiResponse({ status: 404, description: 'Tag not found' })
    remove(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
        return this.tagsService.remove(id, user);
    }
}
