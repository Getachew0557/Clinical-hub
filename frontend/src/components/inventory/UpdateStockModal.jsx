import React, { useState, useEffect } from 'react';
import { X, Save, TrendingUp } from 'lucide-react';
import {
    Typography, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Grid,
    FormControl, InputLabel, Select, MenuItem,
    IconButton, Box, Alert
} from '@mui/material';
import inventoryService from '../../api/inventory.service';

export default function UpdateStockModal({ open, onClose, onSuccess, item }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: 'In',
        quantity: '',
        notes: ''
    });

    useEffect(() => {
        if (open) {
            setFormData({
                type: 'In',
                quantity: '',
                notes: ''
            });
        }
    }, [open]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        const qty = parseInt(formData.quantity);
        if (isNaN(qty) || qty <= 0) {
            alert('Quantity must be a positive number');
            return;
        }

        if (formData.type === 'Out' && qty > item.quantity) {
            alert(`Cannot remove ${qty}. Only ${item.quantity} in stock.`);
            return;
        }

        setLoading(true);
        try {
            await inventoryService.updateStock(item.id, formData);
            alert('Stock updated successfully!');
            onSuccess();
            onClose();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update stock');
        } finally {
            setLoading(false);
        }
    };

    if (!item) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{ sx: { borderRadius: 5, m: { xs: 2, sm: 4 } } }}
        >
            <form onSubmit={handleSubmit}>
                <DialogTitle sx={{ borderBottom: '1px solid #f1f5f9', p: 3 }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <TrendingUp size={20} />
                            </div>
                            <Typography variant="h6" fontWeight={800}>Update Stock</Typography>
                        </div>
                        <IconButton onClick={onClose} size="small">
                            <X size={20} />
                        </IconButton>
                    </div>
                </DialogTitle>

                <DialogContent sx={{ p: 4 }}>
                    <Box sx={{ mb: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #e2e8f0' }}>
                        <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                            {item.name}
                        </Typography>
                        <div className="flex justify-between mt-1">
                            <Typography variant="caption" color="text.secondary">Current Stock:</Typography>
                            <Typography variant="caption" fontWeight={700} color={item.quantity <= item.reorderLevel ? 'error.main' : 'success.main'}>
                                {item.quantity} {item.unit}
                            </Typography>
                        </div>
                    </Box>

                    <Grid container spacing={3} sx={{ mt: 0.5 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth required>
                                <InputLabel>Operation</InputLabel>
                                <Select
                                    name="type"
                                    value={formData.type}
                                    label="Operation"
                                    onChange={handleInputChange}
                                >
                                    <MenuItem value="In">Add Stock (+)</MenuItem>
                                    <MenuItem value="Out">Remove Stock (-)</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                label="Quantity"
                                name="quantity"
                                type="number"
                                fullWidth
                                required
                                inputProps={{ min: 1 }}
                                value={formData.quantity}
                                onChange={handleInputChange}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                label="Reason / Notes (Optional)"
                                name="notes"
                                fullWidth
                                multiline
                                rows={2}
                                placeholder={formData.type === 'Out' ? "e.g. Used for procedure, Expired" : "e.g. New delivery received"}
                                value={formData.notes}
                                onChange={handleInputChange}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ p: 3, borderTop: '1px solid #f1f5f9', gap: 2 }}>
                    <Button color="inherit" onClick={onClose}>Cancel</Button>
                    <Button
                        type="submit"
                        variant="contained"
                        startIcon={<Save size={18} />}
                        disabled={loading}
                        sx={{ borderRadius: 3, px: 4 }}
                    >
                        {loading ? 'Saving...' : 'Update'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
