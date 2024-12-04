import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Pagination,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Image as ImageIcon,
  Share as ShareIcon,
  Sort as SortIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import useCloudStorageStore from '../../store/cloudStorageStore';

const SceneManager: React.FC = () => {
  const {
    scenes,
    totalScenes,
    currentPage,
    itemsPerPage,
    isLoading,
    error,
    loadScenes,
    deleteScene,
    updateMetadata,
    generateThumbnail,
    setSort,
    setFilter,
    setItemsPerPage,
    clearError,
  } = useCloudStorageStore();

  const [selectedScene, setSelectedScene] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    tags: [] as string[],
  });
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filterData, setFilterData] = useState({
    author: '',
    tags: [] as string[],
    dateStart: '',
    dateEnd: '',
  });

  useEffect(() => {
    loadScenes();
  }, [loadScenes]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, sceneId: string) => {
    event.stopPropagation();
    setSelectedScene(sceneId);
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedScene(null);
  };

  const handleDelete = async () => {
    if (selectedScene) {
      await deleteScene(selectedScene);
      handleMenuClose();
    }
  };

  const handleEdit = () => {
    if (selectedScene) {
      const scene = scenes.find((s) => s.id === selectedScene);
      if (scene) {
        setEditData({
          name: scene.name,
          tags: scene.tags,
        });
        setEditDialogOpen(true);
      }
    }
    handleMenuClose();
  };

  const handleEditSave = async () => {
    if (selectedScene) {
      await updateMetadata(selectedScene, editData);
      setEditDialogOpen(false);
    }
  };

  const handleGenerateThumbnail = async () => {
    if (selectedScene) {
      await generateThumbnail(selectedScene);
      handleMenuClose();
    }
  };

  const handlePageChange = (event: unknown, page: number) => {
    loadScenes(page);
  };

  const handleSortChange = (sortBy: 'name' | 'date' | 'size', order: 'asc' | 'desc') => {
    setSort(sortBy, order);
    setSortMenuAnchor(null);
  };

  const handleFilterApply = () => {
    setFilter({
      author: filterData.author,
      tags: filterData.tags,
      dateRange: filterData.dateStart && filterData.dateEnd
        ? {
            start: new Date(filterData.dateStart).getTime(),
            end: new Date(filterData.dateEnd).getTime(),
          }
        : undefined,
    });
    setFilterDialogOpen(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Scenes</Typography>
        <Box>
          <IconButton onClick={(e) => setSortMenuAnchor(e.currentTarget)}>
            <SortIcon />
          </IconButton>
          <IconButton onClick={() => setFilterDialogOpen(true)}>
            <FilterIcon />
          </IconButton>
        </Box>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {scenes.map((scene) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={scene.id}>
              <Card>
                <CardMedia
                  component="img"
                  height="140"
                  image={scene.thumbnail || '/placeholder.png'}
                  alt={scene.name}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" noWrap>
                      {scene.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, scene.id)}
                    >
                      <MoreIcon />
                    </IconButton>
                  </Box>
                  <Typography variant="caption" display="block">
                    {new Date(scene.updatedAt).toLocaleDateString()}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
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
      )}

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={Math.ceil(totalScenes / itemsPerPage)}
          page={currentPage}
          onChange={handlePageChange}
        />
      </Box>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={handleGenerateThumbnail}>
          <ImageIcon sx={{ mr: 1 }} /> Generate Thumbnail
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={() => setSortMenuAnchor(null)}
      >
        <MenuItem onClick={() => handleSortChange('name', 'asc')}>
          Name (A-Z)
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('name', 'desc')}>
          Name (Z-A)
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('date', 'desc')}>
          Newest First
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('date', 'asc')}>
          Oldest First
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('size', 'desc')}>
          Largest First
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('size', 'asc')}>
          Smallest First
        </MenuItem>
      </Menu>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Scene</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Tags"
            value={editData.tags.join(', ')}
            onChange={(e) =>
              setEditData({
                ...editData,
                tags: e.target.value.split(',').map((tag) => tag.trim()),
              })
            }
            helperText="Separate tags with commas"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Filter Scenes</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Author"
            value={filterData.author}
            onChange={(e) =>
              setFilterData({ ...filterData, author: e.target.value })
            }
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Tags"
            value={filterData.tags.join(', ')}
            onChange={(e) =>
              setFilterData({
                ...filterData,
                tags: e.target.value.split(',').map((tag) => tag.trim()),
              })
            }
            helperText="Separate tags with commas"
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            type="date"
            label="Start Date"
            value={filterData.dateStart}
            onChange={(e) =>
              setFilterData({ ...filterData, dateStart: e.target.value })
            }
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            type="date"
            label="End Date"
            value={filterData.dateEnd}
            onChange={(e) =>
              setFilterData({ ...filterData, dateEnd: e.target.value })
            }
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleFilterApply} variant="contained">
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(error)}
        autoHideDuration={6000}
        onClose={clearError}
      >
        <Alert severity="error" onClose={clearError}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SceneManager;
