import React from 'react';
import { Box, Skeleton } from '@mui/material';

// ── Card Skeleton ─────────────────────────────────────────────────────────────────

export const CardSkeleton = ({ count = 1 }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    {Array.from({ length: count }).map((_, index) => (
      <Box
        key={index}
        sx={{
          p: 3,
          border: '1px solid #e2e8f0',
          borderRadius: 3,
          bgcolor: 'white',
        }}
      >
        <Skeleton variant="rectangular" width="100%" height={120} />
      </Box>
    ))}
  </Box>
);

// ── Table Skeleton ────────────────────────────────────────────────────────────────

export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <Box sx={{ width: '100%' }}>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <Box key={rowIndex} sx={{ display: 'flex', gap: 2, mb: 2 }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton
            key={colIndex}
            variant="rectangular"
            width={`${100 / columns}%`}
            height={40}
          />
        ))}
      </Box>
    ))}
  </Box>
);

// ── List Skeleton ─────────────────────────────────────────────────────────────────

export const ListSkeleton = ({ count = 5 }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    {Array.from({ length: count }).map((_, index) => (
      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
        <Skeleton variant="circular" width={40} height={40} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="40%" height={20} />
        </Box>
      </Box>
    ))}
  </Box>
);

// ── Form Skeleton ─────────────────────────────────────────────────────────────────

export const FormSkeleton = ({ fields = 5 }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    {Array.from({ length: fields }).map((_, index) => (
      <Box key={index}>
        <Skeleton variant="text" width="30%" height={20} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" width="100%" height={56} />
      </Box>
    ))}
    <Skeleton variant="rectangular" width="30%" height={40} sx={{ mt: 2 }} />
  </Box>
);

// ── Avatar Skeleton ────────────────────────────────────────────────────────────────

export const AvatarSkeleton = ({ size = 40 }) => (
  <Skeleton variant="circular" width={size} height={size} />
);

// ── Text Skeleton ─────────────────────────────────────────────────────────────────

export const TextSkeleton = ({ lines = 3, width = '100%' }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        variant="text"
        width={typeof width === 'number' ? `${width}%` : width}
        height={20}
      />
    ))}
  </Box>
);

// ── Button Skeleton ────────────────────────────────────────────────────────────────

export const ButtonSkeleton = ({ width = 120, height = 40 }) => (
  <Skeleton variant="rectangular" width={width} height={height} sx={{ borderRadius: 2 }} />
);

// ── Chart Skeleton ─────────────────────────────────────────────────────────────────

export const ChartSkeleton = ({ height = 300 }) => (
  <Box sx={{ height }}>
    <Skeleton variant="rectangular" width="100%" height="100%" />
  </Box>
);

// ── Dashboard Stats Skeleton ───────────────────────────────────────────────────────

export const DashboardStatsSkeleton = ({ count = 4 }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3 }}>
    {Array.from({ length: count }).map((_, index) => (
      <Box
        key={index}
        sx={{
          p: 3,
          border: '1px solid #e2e8f0',
          borderRadius: 3,
          bgcolor: 'white',
        }}
      >
        <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="60%" height={48} />
      </Box>
    ))}
  </Box>
);

export default {
  CardSkeleton,
  TableSkeleton,
  ListSkeleton,
  FormSkeleton,
  AvatarSkeleton,
  TextSkeleton,
  ButtonSkeleton,
  ChartSkeleton,
  DashboardStatsSkeleton,
};
