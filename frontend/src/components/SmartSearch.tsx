import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Button,
  Paper,
  useTheme,
  alpha,
  Popper,
  ClickAwayListener,
  Fade,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  History as HistoryIcon,
  Bookmark as SaveIcon,
  BookmarkBorder as SaveOutlineIcon,
  Sort as SortIcon,
} from '@mui/icons-material';

export interface SearchFilter {
  id: string;
  label: string;
  value: any;
  type: 'select' | 'range' | 'date' | 'boolean';
  options?: { label: string; value: any }[];
  icon?: React.ReactElement;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: Record<string, any>;
  timestamp: Date;
}

export interface SortOption {
  id: string;
  label: string;
  field: string;
  direction: 'asc' | 'desc';
}

interface SmartSearchProps {
  placeholder?: string;
  onSearch: (query: string, filters: Record<string, any>, sort?: SortOption) => void;
  filters?: SearchFilter[];
  sortOptions?: SortOption[];
  savedSearches?: SavedSearch[];
  onSaveSearch?: (search: SavedSearch) => void;
  onDeleteSavedSearch?: (id: string) => void;
  enableFuzzySearch?: boolean;
  debounceMs?: number;
  maxSuggestions?: number;
  recentSearches?: string[];
  onRecentSearchUpdate?: (searches: string[]) => void;
}

const SmartSearch: React.FC<SmartSearchProps> = ({
  placeholder = 'Search...',
  onSearch,
  filters = [],
  sortOptions = [],
  savedSearches = [],
  onSaveSearch,
  onDeleteSavedSearch,
  enableFuzzySearch = true,
  debounceMs = 300,
  maxSuggestions = 5,
  recentSearches = [],
  onRecentSearchUpdate,
}) => {
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [currentSort, setCurrentSort] = useState<SortOption | undefined>();
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionAnchorEl, setSuggestionAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(query, activeFilters, currentSort);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, activeFilters, currentSort, onSearch, debounceMs]);

  // Handle query change
  const handleQueryChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = event.target.value;
    setQuery(newQuery);
    setSuggestionAnchorEl(event.currentTarget);
    setSuggestionsOpen(Boolean(newQuery && (recentSearches.length > 0 || savedSearches.length > 0)));
  }, [recentSearches.length, savedSearches.length]);

  // Handle filter change
  const handleFilterChange = useCallback((filterId: string, value: any) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterId]: value,
    }));
  }, []);

  // Clear filter
  const clearFilter = useCallback((filterId: string) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[filterId];
      return newFilters;
    });
  }, []);

  // Clear all
  const clearAll = useCallback(() => {
    setQuery('');
    setActiveFilters({});
    setCurrentSort(undefined);
    setSuggestionsOpen(false);
  }, []);

  // Select suggestion
  const selectSuggestion = useCallback((suggestion: string) => {
    setQuery(suggestion);
    setSuggestionsOpen(false);

    // Update recent searches
    if (onRecentSearchUpdate) {
      const newRecent = [suggestion, ...recentSearches.filter(s => s !== suggestion)]
        .slice(0, maxSuggestions);
      onRecentSearchUpdate(newRecent);
    }
  }, [recentSearches, onRecentSearchUpdate, maxSuggestions]);

  // Save current search
  const saveCurrentSearch = useCallback(() => {
    if (!onSaveSearch || !query.trim()) return;

    const newSavedSearch: SavedSearch = {
      id: Date.now().toString(),
      name: `Search: ${query}`,
      query,
      filters: activeFilters,
      timestamp: new Date(),
    };

    onSaveSearch(newSavedSearch);
  }, [query, activeFilters, onSaveSearch]);

  // Load saved search
  const loadSavedSearch = useCallback((search: SavedSearch) => {
    setQuery(search.query);
    setActiveFilters(search.filters);
    setSuggestionsOpen(false);
  }, []);

  // Filter suggestions based on current query
  const filteredSuggestions = useMemo(() => {
    if (!query.trim()) return [];

    const queryLower = query.toLowerCase();
    const recent = recentSearches
      .filter(search => search.toLowerCase().includes(queryLower))
      .slice(0, maxSuggestions);

    const saved = savedSearches
      .filter(search =>
        search.name.toLowerCase().includes(queryLower) ||
        search.query.toLowerCase().includes(queryLower)
      )
      .slice(0, maxSuggestions);

    return { recent, saved };
  }, [query, recentSearches, savedSearches, maxSuggestions]);

  // Get active filter count
  const activeFilterCount = Object.keys(activeFilters).length;

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {/* Main Search Input */}
      <TextField
        fullWidth
        placeholder={placeholder}
        value={query}
        onChange={handleQueryChange}
        onFocus={(e) => {
          setSuggestionAnchorEl(e.currentTarget);
          setSuggestionsOpen(Boolean(query && (recentSearches.length > 0 || savedSearches.length > 0)));
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {/* Save Search Button */}
                {query.trim() && onSaveSearch && (
                  <IconButton
                    size="small"
                    onClick={saveCurrentSearch}
                    title="Save search"
                  >
                    <SaveOutlineIcon fontSize="small" />
                  </IconButton>
                )}

                {/* Sort Button */}
                {sortOptions.length > 0 && (
                  <IconButton
                    size="small"
                    onClick={(e) => setSortAnchorEl(e.currentTarget)}
                    title="Sort options"
                    sx={{ color: currentSort ? 'primary.main' : 'action.disabled' }}
                  >
                    <SortIcon fontSize="small" />
                  </IconButton>
                )}

                {/* Filter Button */}
                {filters.length > 0 && (
                  <IconButton
                    size="small"
                    onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                    title="Filters"
                    sx={{ color: activeFilterCount > 0 ? 'primary.main' : 'action.disabled' }}
                  >
                    <FilterIcon fontSize="small" />
                    {activeFilterCount > 0 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -2,
                          right: -2,
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          backgroundColor: 'primary.main',
                          color: 'primary.contrastText',
                          fontSize: '0.6rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                        }}
                      >
                        {activeFilterCount}
                      </Box>
                    )}
                  </IconButton>
                )}

                {/* Clear Button */}
                {(query || activeFilterCount > 0) && (
                  <IconButton
                    size="small"
                    onClick={clearAll}
                    title="Clear all"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </InputAdornment>
          ),
          sx: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          },
        }}
      />

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
          {Object.entries(activeFilters).map(([filterId, value]) => {
            const filter = filters.find(f => f.id === filterId);
            if (!filter) return null;

            return (
              <Chip
                key={filterId}
                label={`${filter.label}: ${value}`}
                size="small"
                onDelete={() => clearFilter(filterId)}
                color="primary"
                variant="outlined"
                icon={filter.icon}
              />
            );
          })}
        </Box>
      )}

      {/* Search Suggestions Popper */}
      <Popper
        open={suggestionsOpen}
        anchorEl={suggestionAnchorEl}
        placement="bottom-start"
        transition
        style={{ zIndex: 1300, width: suggestionAnchorEl?.clientWidth }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={350}>
            <Paper
              elevation={8}
              sx={{
                mt: 1,
                borderRadius: 2,
                overflow: 'hidden',
                maxHeight: 300,
                overflowY: 'auto',
              }}
            >
              <ClickAwayListener onClickAway={() => setSuggestionsOpen(false)}>
                <Box>
                  {/* Recent Searches */}
                  {filteredSuggestions.recent.length > 0 && (
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          px: 2,
                          py: 1,
                          display: 'block',
                          color: 'text.secondary',
                          fontWeight: 600,
                        }}
                      >
                        Recent Searches
                      </Typography>
                      {filteredSuggestions.recent.map((search, index) => (
                        <MenuItem
                          key={index}
                          onClick={() => selectSuggestion(search)}
                          sx={{ py: 1 }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <HistoryIcon fontSize="small" color="action" />
                          </ListItemIcon>
                          <ListItemText
                            primary={search}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </MenuItem>
                      ))}
                    </Box>
                  )}

                  {/* Saved Searches */}
                  {filteredSuggestions.saved.length > 0 && (
                    <Box>
                      {filteredSuggestions.recent.length > 0 && <Divider />}
                      <Typography
                        variant="caption"
                        sx={{
                          px: 2,
                          py: 1,
                          display: 'block',
                          color: 'text.secondary',
                          fontWeight: 600,
                        }}
                      >
                        Saved Searches
                      </Typography>
                      {filteredSuggestions.saved.map((search) => (
                        <MenuItem
                          key={search.id}
                          onClick={() => loadSavedSearch(search)}
                          sx={{ py: 1 }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <SaveIcon fontSize="small" color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={search.name}
                            secondary={search.query}
                            primaryTypographyProps={{ variant: 'body2' }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                        </MenuItem>
                      ))}
                    </Box>
                  )}

                  {filteredSuggestions.recent.length === 0 && filteredSuggestions.saved.length === 0 && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ p: 2, textAlign: 'center' }}
                    >
                      No suggestions found
                    </Typography>
                  )}
                </Box>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
        PaperProps={{
          sx: {
            minWidth: 250,
            maxHeight: 400,
          },
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ px: 2, py: 1, fontWeight: 600 }}
        >
          Filters
        </Typography>
        <Divider />
        {filters.map((filter) => (
          <MenuItem key={filter.id} sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
              {filter.label}
            </Typography>
            {filter.type === 'select' && filter.options && (
              <TextField
                select
                size="small"
                fullWidth
                value={activeFilters[filter.id] || ''}
                onChange={(e) => handleFilterChange(filter.id, e.target.value)}
              >
                <MenuItem value="">
                  <em>All</em>
                </MenuItem>
                {filter.options.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </MenuItem>
        ))}
        {activeFilterCount > 0 && (
          <>
            <Divider />
            <MenuItem onClick={() => setActiveFilters({})}>
              <Typography variant="body2" color="error">
                Clear all filters
              </Typography>
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={() => setSortAnchorEl(null)}
      >
        <Typography
          variant="subtitle2"
          sx={{ px: 2, py: 1, fontWeight: 600 }}
        >
          Sort by
        </Typography>
        <Divider />
        {sortOptions.map((option) => (
          <MenuItem
            key={option.id}
            selected={currentSort?.id === option.id}
            onClick={() => {
              setCurrentSort(option);
              setSortAnchorEl(null);
            }}
          >
            {option.label}
          </MenuItem>
        ))}
        {currentSort && (
          <>
            <Divider />
            <MenuItem
              onClick={() => {
                setCurrentSort(undefined);
                setSortAnchorEl(null);
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Remove sorting
              </Typography>
            </MenuItem>
          </>
        )}
      </Menu>
    </Box>
  );
};

export default SmartSearch;