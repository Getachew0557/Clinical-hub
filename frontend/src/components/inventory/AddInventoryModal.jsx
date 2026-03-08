import React, { useState } from 'react';
import { X, Save, Package } from 'lucide-react';
import {
    Typography, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Grid,
    FormControl, InputLabel, Select, MenuItem,
    IconButton
} from '@mui/material';
import inventoryService from '../../api/inventory.service';

export default function AddInventoryModal({ open, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        quantity: 0,
        unit: '',
        reorderLevel: 5,
        pricePerUnit: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await inventoryService.createItem(formData);
            alert('Item added successfully!');
            onSuccess();
            onClose();
            // Reset form
            setFormData({
                name: '', category: '', quantity: 0,
                unit: '', reorderLevel: 5, pricePerUnit: ''
            });
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add item');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: 5, m: { xs: 2, sm: 4 } } }}
        >
            <form onSubmit={handleSubmit}>
                <DialogTitle sx={{ borderBottom: '1px solid #f1f5f9', p: 3 }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <Package size={20} />
                            </div>
                            <Typography variant="h6" fontWeight={800}>Add New Item</Typography>
                        </div>
                        <IconButton onClick={onClose} size="small">
                            <X size={20} />
                        </IconButton>
                    </div>
                </DialogTitle>

                <DialogContent sx={{ p: 4 }}>
                    <Grid container spacing={3} sx={{ mt: 0.5 }}>
                        <Grid item xs={12}>
                            <TextField
                                label="Item Name"
                                name="name"
                                fullWidth
                                required
                                value={formData.name}
                                onChange={handleInputChange}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Category</InputLabel>
                                <Select
                                    name="category"
                                    value={formData.category}
                                    label="Category"
                                    onChange={handleInputChange}
                                >
                                    <MenuItem value="Equipment">Equipment</MenuItem>
                                    <MenuItem value="Supplies">Supplies</MenuItem>
                                    <MenuItem value="Medication">Medication</MenuItem>
                                    <MenuItem value="Instruments">Instruments</MenuItem>
                                    <MenuItem value="Other">Other</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Unit"
                                name="unit"
                                fullWidth
                                required
                                placeholder="e.g. Boxes, Packs, Pieces"
                                value={formData.unit}
                                onChange={handleInputChange}
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <TextField
                                label="Initial Quantity"
                                name="quantity"
                                type="number"
                                fullWidth
                                required
                                inputProps={{ min: 0 }}
                                value={formData.quantity}
                                onChange={handleInputChange}
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <TextField
                                label="Reorder Level"
                                name="reorderLevel"
                                type="number"
                                fullWidth
                                required
                                inputProps={{ min: 0 }}
                                value={formData.reorderLevel}
                                onChange={handleInputChange}
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <TextField
                                label="Price Per Unit ($)"
                                name="pricePerUnit"
                                type="number"
                                fullWidth
                                inputProps={{ min: 0, step: "0.01" }}
                                value={formData.pricePerUnit}
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
                        {loading ? 'Saving...' : 'Save Item'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
