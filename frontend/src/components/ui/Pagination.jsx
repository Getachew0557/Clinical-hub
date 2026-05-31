import React from 'react';
import { Box, IconButton, Typography, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const Pagination = ({
  page = 0,
  rowsPerPage = 10,
  count = 0,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [10, 25, 50, 100],
  showFirstButton = true,
  showLastButton = true,
  disabled = false,
}) => {
  const totalPages = Math.ceil(count / rowsPerPage);
  const currentPage = page + 1;

  const handleFirstPage = () => {
    onPageChange(0);
  };

  const handlePreviousPage = () => {
    onPageChange(page - 1);
  };

  const handleNextPage = () => {
    onPageChange(page + 1);
  };

  const handleLastPage = () => {
    onPageChange(totalPages - 1);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        gap: 2,
      }}
    >
      {/* Rows per page selector */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Rows per page:
        </Typography>
        <FormControl size="small" sx={{ minWidth: 80 }}>
          <Select
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
            disabled={disabled}
          >
            {rowsPerPageOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Page info */}
      <Typography variant="body2" color="text.secondary">
        {count > 0 ? `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, count)} of ${count}` : '0 of 0'}
      </Typography>

      {/* Page navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {showFirstButton && (
          <IconButton
            onClick={handleFirstPage}
            disabled={disabled || page === 0}
            size="small"
            aria-label="first page"
          >
            <ChevronsLeft size={20} />
          </IconButton>
        )}
        <IconButton
          onClick={handlePreviousPage}
          disabled={disabled || page === 0}
          size="small"
          aria-label="previous page"
        >
          <ChevronLeft size={20} />
        </IconButton>
        <Typography variant="body2" sx={{ minWidth: 48, textAlign: 'center' }}>
          {currentPage} / {totalPages || 1}
        </Typography>
        <IconButton
          onClick={handleNextPage}
          disabled={disabled || page >= totalPages - 1}
          size="small"
          aria-label="next page"
        >
          <ChevronRight size={20} />
        </IconButton>
        {showLastButton && (
          <IconButton
            onClick={handleLastPage}
            disabled={disabled || page >= totalPages - 1}
            size="small"
            aria-label="last page"
          >
            <ChevronsRight size={20} />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

export default Pagination;
