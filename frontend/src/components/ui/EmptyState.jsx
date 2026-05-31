import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Inbox, Search, Users, Calendar, FileText, Package } from 'lucide-react';

const EmptyState = ({
  icon = Inbox,
  title = 'No data found',
  description = 'There are no items to display at the moment.',
  actionLabel = null,
  onAction = null,
  illustration = null,
}) => {
  const IconComponent = icon;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 12,
        px: 4,
        textAlign: 'center',
      }}
    >
      {illustration ? (
        <Box sx={{ mb: 4, maxWidth: 200 }}>{illustration}</Box>
      ) : (
        <Box
          sx={{
            mb: 4,
            p: 4,
            borderRadius: '50%',
            bgcolor: '#f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconComponent size={64} className="text-slate-400" />
        </Box>
      )}
      <Typography variant="h6" className="fw-700" sx={{ mb: 1, color: '#1e293b' }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ mb: 4, color: '#64748b', maxWidth: 400 }}>
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

// ── Pre-configured Empty States ───────────────────────────────────────────────────

export const EmptyPatients = ({ onAdd }) => (
  <EmptyState
    icon={Users}
    title="No patients found"
    description="Get started by adding your first patient to the system."
    actionLabel="Add Patient"
    onAction={onAdd}
  />
);

export const EmptyAppointments = ({ onBook }) => (
  <EmptyState
    icon={Calendar}
    title="No appointments scheduled"
    description="You don't have any upcoming appointments. Book one now."
    actionLabel="Book Appointment"
    onAction={onBook}
  />
);

export const EmptyDoctors = ({ onAdd }) => (
  <EmptyState
    icon={Users}
    title="No doctors available"
    description="There are no doctors registered in the system yet."
    actionLabel="Add Doctor"
    onAction={onAdd}
  />
);

export const EmptyInventory = ({ onAdd }) => (
  <EmptyState
    icon={Package}
    title="Inventory is empty"
    description="Start by adding items to your inventory tracking system."
    actionLabel="Add Item"
    onAction={onAdd}
  />
);

export const EmptySearch = ({ query }) => (
  <EmptyState
    icon={Search}
    title={`No results for "${query}"`}
    description="Try adjusting your search terms or filters to find what you're looking for."
  />
);

export const EmptyInvoices = ({ onCreate }) => (
  <EmptyState
    icon={FileText}
    title="No invoices found"
    description="There are no invoices to display at the moment."
    actionLabel="Create Invoice"
    onAction={onCreate}
  />
);

export const EmptyRecords = ({ onCreate }) => (
  <EmptyState
    icon={FileText}
    title="No medical records"
    description="No medical records have been created for this patient yet."
    actionLabel="Create Record"
    onAction={onCreate}
  />
);

export default EmptyState;
