import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles } from '@clinic/common';
import { SearchService } from './search.service';
import { SearchDto, GlobalSearchDto, AutocompleteDto, SearchResultDto } from './dto/search.dto';

@ApiTags('search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('global')
  @ApiOperation({ summary: 'Global search across all content types' })
  @ApiResponse({ status: 200, description: 'Search results', type: SearchResultDto })
  @Roles('client', 'coach', 'admin')
  async globalSearch(@Query() searchDto: GlobalSearchDto): Promise<SearchResultDto> {
    return this.searchService.globalSearch(searchDto);
  }

  @Get('clients')
  @ApiOperation({ summary: 'Search clients' })
  @ApiResponse({ status: 200, description: 'Client search results', type: SearchResultDto })
  @Roles('coach', 'admin')
  async searchClients(@Query() searchDto: SearchDto): Promise<SearchResultDto> {
    return this.searchService.searchClients(searchDto);
  }

  @Get('appointments')
  @ApiOperation({ summary: 'Search appointments' })
  @ApiResponse({ status: 200, description: 'Appointment search results', type: SearchResultDto })
  @Roles('client', 'coach', 'admin')
  async searchAppointments(@Query() searchDto: SearchDto): Promise<SearchResultDto> {
    return this.searchService.searchAppointments(searchDto);
  }

  @Get('session-notes')
  @ApiOperation({ summary: 'Search session notes' })
  @ApiResponse({ status: 200, description: 'Session notes search results', type: SearchResultDto })
  @Roles('coach', 'admin')
  async searchSessionNotes(@Query() searchDto: SearchDto): Promise<SearchResultDto> {
    return this.searchService.searchSessionNotes(searchDto);
  }

  @Get('files')
  @ApiOperation({ summary: 'Search files and documents' })
  @ApiResponse({ status: 200, description: 'File search results', type: SearchResultDto })
  @Roles('client', 'coach', 'admin')
  async searchFiles(@Query() searchDto: SearchDto): Promise<SearchResultDto> {
    return this.searchService.searchFiles(searchDto);
  }

  @Get('coaches')
  @ApiOperation({ summary: 'Search coaches and therapists' })
  @ApiResponse({ status: 200, description: 'Coach search results', type: SearchResultDto })
  @Roles('client', 'admin')
  async searchCoaches(@Query() searchDto: SearchDto): Promise<SearchResultDto> {
    return this.searchService.searchCoaches(searchDto);
  }

  @Get('advanced')
  @ApiOperation({ summary: 'Advanced search with faceted filters' })
  @ApiResponse({ status: 200, description: 'Advanced search results with facets' })
  @Roles('coach', 'admin')
  async advancedSearch(
    @Query() searchDto: SearchDto & { facets?: string },
  ): Promise<SearchResultDto & { facets?: Record<string, any> }> {
    const facets = searchDto.facets ? searchDto.facets.split(',') : undefined;
    return this.searchService.advancedSearch({ ...searchDto, facets });
  }

  @Get('similar/:index/:id')
  @ApiOperation({ summary: 'Find similar documents' })
  @ApiParam({ name: 'index', description: 'Index name', enum: ['clients', 'appointments', 'session-notes', 'files', 'coaches'] })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ status: 200, description: 'Similar documents', type: SearchResultDto })
  @Roles('coach', 'admin')
  async findSimilar(
    @Param('index') index: string,
    @Param('id') id: string,
    @Query('fields') fields?: string,
  ): Promise<SearchResultDto> {
    const fieldList = fields ? fields.split(',') : [];
    return this.searchService.findSimilar(index, id, fieldList);
  }

  @Get('autocomplete/:index')
  @ApiOperation({ summary: 'Get autocomplete suggestions' })
  @ApiParam({ name: 'index', description: 'Index name', enum: ['clients', 'appointments', 'session-notes', 'files', 'coaches'] })
  @ApiResponse({ status: 200, description: 'Autocomplete suggestions', type: [String] })
  @Roles('client', 'coach', 'admin')
  async getAutocompleteSuggestions(
    @Param('index') index: string,
    @Query() autocompleteDto: AutocompleteDto,
  ): Promise<string[]> {
    return this.searchService.getAutocompleteSuggestions(index, autocompleteDto);
  }
}