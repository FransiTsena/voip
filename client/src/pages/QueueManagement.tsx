import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Button, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Divider, Card, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { UseSocket } from '../context/SocketContext';
import baseUrl from '../util/baseUrl';
import QueueDialog from '../components/QueueDialog';

interface Queue {
  name: string;
  strategy?: string;
  calls?: number;
  completed?: number;
  abandoned?: number;
  [key: string]: any;
}

const QUEUE_STRATEGIES = [
  'ringall',
  'leastrecent',
  'fewestcalls',
  'random',
  'rrmemory',
  'rrordered',
  'linear',
  'wrandom',
];

const QueueManagement: React.FC = () => {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedQueueName, setSelectedQueueName] = useState<string | null>(null);
  const [newQueue, setNewQueue] = useState({
    queueId: '',
    name: '',
    strategy: 'ringall',
    maxCallers: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { socket } = UseSocket();
  // Member management state
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [memberQueue, setMemberQueue] = useState<Queue | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [newMember, setNewMember] = useState('');
  // Fetch members for a queue
  const fetchMembers = async (queueName: string) => {
    setMemberLoading(true);
    setMemberError(null);
    try {
      const res = await axios.get(`${baseUrl}/api/queue/${encodeURIComponent(queueName)}/members`);
      setMembers(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      // Handle 404 with specific message
      if (err.response?.status === 404 && err.response?.data?.message === 'No members found in this queue') {
        setMembers([]);
        setMemberError(null); // No error, just empty
      } else {
        setMemberError(err.response?.data?.error || err.response?.data?.message || 'Failed to fetch members');
      }
    } finally {
      setMemberLoading(false);
    }
  };

  // Open member dialog for a queue
  const handleOpenMembers = (queue: Queue) => {
    setMemberQueue(queue);
    setMemberDialogOpen(true);
    setNewMember('');
    fetchMembers(queue.name);
  };

  const handleCloseMembers = () => {
    setMemberDialogOpen(false);
    setMemberQueue(null);
    setMembers([]);
    setMemberError(null);
    setNewMember('');
  };

  // Add member to queue
  const handleAddMember = async () => {
    if (!memberQueue || !newMember) return;
    setMemberLoading(true);
    setMemberError(null);
    try {
      await axios.post(`${baseUrl}/api/queue/${encodeURIComponent(memberQueue.name)}/members`, { 
        member: newMember, });
      setNewMember('');
      fetchMembers(memberQueue.name);
    } catch (err: any) {
      setMemberError(err.response?.data?.error || 'Failed to add member');
    } finally {
      setMemberLoading(false);
    }
  };

  // Remove member from queue
  const handleRemoveMember = async (memberId: string) => {
    if (!memberQueue) return;
    setMemberLoading(true);
    setMemberError(null);
    try {
      await axios.delete(`${baseUrl}/api/queue/${encodeURIComponent(memberQueue.name)}/members/${encodeURIComponent(memberId)}`, );
      fetchMembers(memberQueue.name);
    } catch (err: any) {
      setMemberError(err.response?.data?.error || 'Failed to remove member');
    } finally {
      setMemberLoading(false);
    }
  };

  // Subscribe to live queue updates
  useEffect(() => {
    if (!socket) return;
    const handleQueueUpdate = (data: Queue[]) => {
      setQueues(data);
    };
    socket.on('queueUpdate', handleQueueUpdate);
    return () => {
      socket.off('queueUpdate', handleQueueUpdate);
    };
  }, [socket]);

  // Optionally, fetch queues on mount for initial data (if needed)
  // useEffect(() => {
  //   fetchQueues();
  // }, []);

  const fetchQueues = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${baseUrl}/api/queue`);
      const data = Array.isArray(res.data) ? res.data : [];
      setQueues(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch queues');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewQueue({ ...newQueue, [e.target.name]: e.target.value });
  };

  const handleDialogOpen = () => {
    setEditMode(false);
    setDialogOpen(true);
    setNewQueue({ queueId: '', name: '', strategy: 'ringall', maxCallers: '', description: '' });
    setSelectedQueueName(null);
  };
  const handleDialogClose = () => {
    setDialogOpen(false);
    setError(null);
    setNewQueue({ queueId: '', name: '', strategy: 'ringall', maxCallers: '', description: '' });
    setEditMode(false);
    setSelectedQueueName(null);
  };
  const handleEdit = (queue: Queue) => {
    setEditMode(true);
    setDialogOpen(true);
    setNewQueue({
      queueId: queue.queueId || '',
      name: queue.name || '',
      strategy: queue.strategy || 'ringall',
      maxCallers: queue.maxCallers || '',
      description: queue.description || '',
    });
    setSelectedQueueName(queue.name);
  };
  const handleCreateOrEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (editMode && selectedQueueName) {
        // Update queue
        const payload = {
          queueId: newQueue.queueId,
          name: newQueue.name,
          strategy: newQueue.strategy,
          maxCallers: newQueue.maxCallers,
          description: newQueue.description,
        };
        await axios.put(`${baseUrl}/api/queue/${encodeURIComponent(selectedQueueName)}`, payload);
      } else {
        // Create queue
        const payload = {
          queueId: newQueue.queueId,
          name: newQueue.name,
          strategy: newQueue.strategy,
          maxCallers: newQueue.maxCallers,
          description: newQueue.description,
        };
        await axios.post(`${baseUrl}/api/queue`, payload);
      }
      setNewQueue({ queueId: '', name: '', strategy: 'ringall', maxCallers: '', description: '' });
      setDialogOpen(false);
      setEditMode(false);
      setSelectedQueueName(null);
      fetchQueues();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save queue');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (queueName: string) => {
    if (!window.confirm(`Are you sure you want to delete queue "${queueName}"?`)) return;
    setDeleteLoading(queueName);
    setError(null);
    try {
      await axios.delete(`${baseUrl}/api/queue/${encodeURIComponent(queueName)}`);
      fetchQueues();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete queue');
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e0f7fa 0%, #fce4ec 100%)',
        py: { xs: 4, md: 8 },
        px: { xs: 1, md: 4 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Card
        elevation={8}
        sx={{
          width: '100%',
          maxWidth: 1300,
          mx: 'auto',
          borderRadius: 6,
          p: { xs: 2, md: 5 },
          background: 'rgba(255,255,255,0.98)',
          boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.18)',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2} mb={4}>
          <Typography
            variant="h3"
            fontWeight={900}
            color="primary.main"
            sx={{ letterSpacing: 1, flex: 1, fontSize: { xs: 28, md: 38 } }}
          >
            Queue Management
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleDialogOpen}
            sx={{
              borderRadius: 3,
              fontWeight: 700,
              fontSize: 18,
              px: 4,
              py: 1.5,
              boxShadow: '0 4px 16px 0 rgba(16, 185, 129, 0.18)',
              background: 'linear-gradient(90deg,rgb(10, 2, 24) 60%,rgb(10, 42, 48) 100%)',
              color: 'white',
              transition: 'background 0.2s',
              '&:hover': {
                background: 'linear-gradient(90deg,rgb(10, 2, 24) 60%,rgb(10, 42, 48) 100%)',
                color: 'white',
              },
            }}
          >
            + Create Queue
          </Button>
        </Stack>
        <Divider sx={{ mb: 4, borderColor: 'primary.main', opacity: 0.15 }} />
        <QueueDialog
          open={dialogOpen}
          loading={loading}
          error={error}
          newQueue={newQueue}
          queueId={newQueue.queueId}
          strategies={QUEUE_STRATEGIES}
          onClose={handleDialogClose}
          onChange={handleInputChange}
          onSubmit={handleCreateOrEdit}
          nameDisabled={editMode}
          editMode={editMode}
        />
        <TableContainer
          component={Paper}
          sx={{
            boxShadow: 6,
            borderRadius: 4,
            mt: 2,
            background: 'rgba(236, 239, 241, 0.98)',
            overflow: 'hidden',
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ background: 'linear-gradient(90deg,rgb(10, 2, 24) 60%,rgb(10, 42, 48) 100%)' }}>
                <TableCell sx={{ color: 'white', fontWeight: 900, fontSize: 20,letterSpacing: 1 }}>Queue</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 900, fontSize: 20, letterSpacing: 1 }}>Strategy</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 900, fontSize: 20, letterSpacing: 1 }}>Calls</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 900, fontSize: 20, letterSpacing: 1 }}>Completed</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 900, fontSize: 20, letterSpacing: 1 }}>Abandoned</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 900, fontSize: 20, letterSpacing: 1 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {queues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', fontSize: 20, py: 7 }}>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                      <img src="/vite.svg" alt="No queues" style={{ width: 80, opacity: 0.25 }} />
                      <Typography variant="h6" color="text.secondary" fontWeight={600}>
                        No queues to display.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                queues.map((queue) => (
                  <TableRow
                    key={queue.name}
                    sx={{
                      transition: 'background 0.2s',
                      '&:hover': { background: 'rgba(6,182,212,0.08)' },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 700, fontSize: 18, color: 'primary.dark' }}>{queue.name}</TableCell>
                    <TableCell sx={{ fontWeight: 500, color: 'secondary.dark' }}>{queue.strategy || 'ringall'}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{queue.calls ?? 0}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{queue.completed ?? 0}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{queue.abandoned ?? 0}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleEdit(queue)}
                          sx={{
                            borderRadius: 2,
                            fontWeight: 600,
                            borderColor: '#16a34a',
                            color: '#16a34a',
                            background: 'rgba(22,163,74,0.06)',
                            '&:hover': {
                              background: 'rgba(22,163,74,0.18)',
                              borderColor: '#16a34a',
                            },
                          }}
                          disabled={deleteLoading === queue.name}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          color="info"
                          size="small"
                          onClick={() => handleOpenMembers(queue)}
                          sx={{
                            borderRadius: 2,
                            fontWeight: 600,
                            background: 'rgba(59,130,246,0.06)',
                            color: '#2563eb',
                            borderColor: '#2563eb',
                            '&:hover': {
                              background: 'rgba(59,130,246,0.18)',
                              borderColor: '#2563eb',
                            },
                          }}
                        >
                          Members
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleDelete(queue.name)}
                          sx={{
                            borderRadius: 2,
                            fontWeight: 600,
                            background: 'rgba(239,68,68,0.06)',
                            '&:hover': {
                              background: 'rgba(239,68,68,0.18)',
                            },
                          }}
                          disabled={deleteLoading === queue.name}
                        >
                          {deleteLoading === queue.name ? 'Deleting...' : 'Delete'}
                        </Button>
                      </Stack>
                    </TableCell>
      {/* Member Management Dialog */}
      <Dialog open={memberDialogOpen} onClose={handleCloseMembers} maxWidth="xs" fullWidth>
        <DialogTitle>Queue Members {memberQueue ? `- ${memberQueue.name}` : ''}</DialogTitle>
        <DialogContent>
          {memberError && (
            <Typography color="error" mb={2}>{memberError}</Typography>
          )}
          <Box display="flex" gap={1} mb={2}>
            <TextField
              label="Add Member (ID/Extension)"
              value={newMember}
              onChange={e => setNewMember(e.target.value)}
              size="small"
              fullWidth
              disabled={memberLoading}
            />
            <Button
              variant="contained"
              onClick={handleAddMember}
              disabled={!newMember || memberLoading}
            >
              Add
            </Button>
          </Box>
          <List dense>
            {memberLoading ? (
              <Typography variant="body2">Loading...</Typography>
            ) : members.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No members in this queue.</Typography>
            ) : (
              members.map((m: any) => (
                <ListItem key={m.id || m.member || m} divider>
                  <ListItemText primary={m.name || m.member || m} />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveMember(m.id || m.member || m)} disabled={memberLoading}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMembers} color="primary">Close</Button>
        </DialogActions>
      </Dialog>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default QueueManagement;
