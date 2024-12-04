import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Autocomplete,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import { useAdvancedSceneStore } from '../../store/advancedSceneStore';
import { SearchFilters, SortOptions } from '../../services/sceneSearch';

export const SceneSearch: React.FC = () => {
  const {
    searchResults,
    searchScenes,
    getUniqueTags,
    getUniqueCreators,
    isLoading,
    error
  } = useAdvancedSceneStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });
  const [sortOption, setSortOption] = useState<SortOptions>({
    field: 'updatedAt',
    direction: 'desc'
  });
  const [isFilterDialogOpen, setFilterDialogOpen] = useState(false);

  // Get available tags and creators
  const availableTags = getUniqueTags();
  const availableCreators = getUniqueCreators();

  useEffect(() => {
    handleSearch();
  }, [sortOption]);

  const handleSearch = async () => {
    const filters: SearchFilters = {
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      creator: selectedCreator || undefined,
      dateRange: dateRange.start && dateRange.end
        ? { start: dateRange.start, end: dateRange.end }
        : undefined
    };

    await searchScenes(searchQuery, filters, sortOption);
  };

  const handleTagChange = (event: any, newTags: string[]) => {
    setSelectedTags(newTags);
  };

  const handleSortChange = (field: SortOptions['field']) => {
    setSortOption(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <Box p={3}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box display="flex" gap={2}>
            <TextField
              fullWidth
              label="Search Scenes"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              startIcon={<SearchIcon />}
            >
              Search
            </Button>
            <Button
              variant="outlined"
              onClick={() => setFilterDialogOpen(true)}
              startIcon={<FilterListIcon />}
            >
              Filters
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Box display="flex" gap={1} alignItems="center">
            <Typography variant="subtitle2">Sort by:</Typography>
            <Button
              size="small"
              onClick={() => handleSortChange('name')}
              startIcon={<SortIcon />}
              variant={sortOption.field === 'name' ? 'contained' : 'outlined'}
            >
              Name {sortOption.field === 'name' && (sortOption.direction === 'asc' ? '↑' : '↓')}
            </Button>
            <Button
              size="small"
              onClick={() => handleSortChange('updatedAt')}
              startIcon={<SortIcon />}
              variant={sortOption.field === 'updatedAt' ? 'contained' : 'outlined'}
            >
              Last Updated {sortOption.field === 'updatedAt' && (sortOption.direction === 'asc' ? '↑' : '↓')}
            </Button>
          </Box>
        </Grid>

        {/* Search Results */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            {searchResults.map((scene) => (
              <Grid item xs={12} sm={6} md={4} key={scene.id}>
                <Card>
                  <CardMedia
                    component="img"
                    height="140"
                    image={scene.thumbnail || '/default-scene-thumbnail.png'}
                    alt={scene.name}
                  />
                  <CardContent>
                    <Typography variant="h6" noWrap>
                      {scene.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(scene.updatedAt).toLocaleDateString()}
                    </Typography>
                    <Box mt={1}>
                      {scene.tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      {/* Filter Dialog */}
      <Dialog
        open={isFilterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Filter Scenes</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <Autocomplete
              multiple
              options={availableTags}
              value={selectedTags}
              onChange={handleTagChange}
              renderInput={(params) => (
                <TextField {...params} label="Tags" placeholder="Select tags" />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    size="small"
                  />
                ))
              }
            />

            <FormControl fullWidth>
              <InputLabel>Creator</InputLabel>
              <Select
                value={selectedCreator}
                onChange={(e) => setSelectedCreator(e.target.value)}
                label="Creator"
              >
                <MenuItem value="">All Creators</MenuItem>
                {availableCreators.map((creator) => (
                  <MenuItem key={creator} value={creator}>
                    {creator}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box display="flex" gap={2}>
              <DatePicker
                label="From Date"
                value={dateRange.start}
                onChange={(date) => setDateRange(prev => ({ ...prev, start: date }))}
              />
              <DatePicker
                label="To Date"
                value={dateRange.end}
                onChange={(date) => setDateRange(prev => ({ ...prev, end: date }))}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              handleSearch();
              setFilterDialogOpen(false);
            }}
            variant="contained"
          >
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
