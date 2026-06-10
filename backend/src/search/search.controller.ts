import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SearchService, SearchResultItem } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser, type CurrentUserData } from '../auth/decorators/current-user.decorator';

@ApiTags('Search')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Full-text search across tasks, time entries, and comments' })
  @ApiResponse({ status: 200, description: 'Ranked search results with snippets' })
  search(
    @Query() query: SearchQueryDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ results: SearchResultItem[] }> {
    return this.searchService.search(query, user);
  }
}
