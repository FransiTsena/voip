import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
  MenuItem,
  Box,
  Stack
} from '@mui/material';

interface QueueDialogProps {
  open: boolean;
  loading: boolean;
  error: string | null;
  newQueue: {
    queueId?: string;
    name: string;
    strategy: string;
    maxCallers: string;
    description: string;
  };
  queueId?: string;
  strategies: string[];
  onClose: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  nameDisabled?: boolean;
  editMode?: boolean;
}

const QueueDialog: React.FC<QueueDialogProps> = ({
  open,
  loading,
  error,
  newQueue,
  strategies,
  onClose,
  onChange,
  onSubmit,
  nameDisabled = false,
  editMode = false,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="sm"
    fullWidth
    PaperProps={{
      sx: {
        borderRadius: 5,
        background: 'linear-gradient(135deg, #f8fafc 60%, #e0f2fe 100%)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
        p: 0,
      },
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', px: 3, pt: 3, pb: 1 }}>
      <Box
        sx={{
          width: 8,
          height: 40,
          borderRadius: 2,
          background: 'linear-gradient(180deg,rgb(10, 2, 24) 60%,rgb(10, 42, 48) 100%)',
          mr: 2,
        }}
      />
      <DialogTitle
        sx={{
          fontWeight: 800,
          fontSize: 28,
          color: 'primary.main',
          letterSpacing: 1,
          flex: 1,
          p: 0,
        }}
      >
        {editMode ? 'Edit Queue' : 'Create New Queue'}
      </DialogTitle>
    </Box>
    <form onSubmit={onSubmit}>
      <DialogContent sx={{ pb: 0, pt: 1, px: 4 }}>
        <Stack spacing={2}>
          {/* Queue ID field (optional, shown if queueId is present) */}
          {typeof newQueue.queueId !== 'undefined' && (
            <TextField
              label="Queue ID"
              name="queueId"
              value={newQueue.queueId}
              onChange={onChange}
              variant="filled"
              InputProps={{ sx: { borderRadius: 3, background: '#fff' } }}
              disabled={!!editMode}
            />
          )}
          <TextField
            label="Queue Name"
            name="name"
            value={newQueue.name}
            onChange={onChange}
            required
            autoFocus
            variant="filled"
            InputProps={{ sx: { borderRadius: 3, background: '#fff' }, readOnly: nameDisabled }}
            disabled={nameDisabled}
          />
          <TextField
            select
            label="Strategy"
            name="strategy"
            value={newQueue.strategy}
            onChange={onChange}
            required
            variant="filled"
            InputProps={{ sx: { borderRadius: 3, background: '#fff' } }}
          >
            {strategies.map((strategy) => (
              <MenuItem key={strategy} value={strategy}>
                {strategy}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Max Callers"
            name="maxCallers"
            type="number"
            value={newQueue.maxCallers}
            onChange={onChange}
            required
            inputProps={{ min: 1 }}
            variant="filled"
            InputProps={{ sx: { borderRadius: 3, background: '#fff' } }}
          />
          <TextField
            label="Description"
            name="description"
            value={newQueue.description}
            onChange={onChange}
            multiline
            rows={2}
            variant="filled"
            InputProps={{ sx: { borderRadius: 3, background: '#fff' } }}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ pb: 3, pr: 4, pt: 2, justifyContent: 'flex-end' }}>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            borderRadius: 3,
            fontWeight: 600,
            color: 'grey.700',
            background: 'rgba(236,239,241,0.7)',
            boxShadow: 'none',
            mr: 1.5,
            px: 3,
            '&:hover': { background: 'rgba(236,239,241,1)' },
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading || !newQueue.name.trim() || !newQueue.maxCallers}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          sx={{
            borderRadius: 3,
            fontWeight: 700,
            fontSize: 16,
            px: 4,
            boxShadow: '0 2px 8px 0 rgba(16, 185, 129, 0.10)',
          }}
        >
          {loading ? (editMode ? 'Saving...' : 'Creating...') : (editMode ? 'Save' : 'Create')}
        </Button>
      </DialogActions>
    </form>
  </Dialog>
);

export default QueueDialog;
