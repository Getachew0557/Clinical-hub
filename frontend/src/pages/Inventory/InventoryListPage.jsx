import React, { useState, useEffect } from 'react';
import {
    Package, Plus, Search, MoreHorizontal,
    AlertTriangle, CheckCircle, Trash2, Edit, TrendingUp, TrendingDown
} from 'lucide-react';
import {
    Typography, Button, Card, CardContent, InputBase,
    Chip, IconButton, Menu, MenuItem, CircularProgress, Alert,
    Box, LinearProgress
} from '@mui/material';
import inventoryService from '../../api/inventory.service';
import AddInventoryModal from '../../components/inventory/AddInventoryModal';
import UpdateStockModal from '../../components/inventory/UpdateStockModal';
import { useSelector } from 'react-redux';

export default function InventoryListPage() {
    const { user } = useSelector((s) => s.auth);
    const role = user?.role || 'Patient';
    const isAdmin = role === 'Admin';
    const isStaff = ['Admin', 'Receptionist', 'Doctor'].includes(role);

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Modal state
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [stockModalOpen, setStockModalOpen] = useState(false);

    // Menu state
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        if (isStaff) {
            fetchInventory();
        } else {
            setError('You do not have permission to view inventory.');
            setLoading(false);
        }
    }, [isStaff]);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const data = await inventoryService.getAllItems();
            setItems(data.items || []);
            setError(null);
        } catch (err) {
            console.error('Fetch Inventory Error:', err);
            setError('Failed to load inventory. Please ensure the inventory-service is running.');
        } finally {
            setLoading(false);
        }
    };

    const handleMenuOpen = (event, item) => {
        setAnchorEl(event.currentTarget);
        setSelectedItem(item);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleDelete = async () => {
        if (!selectedItem || !window.confirm(`Are you sure you want to delete ${selectedItem.name}?`)) return;
        try {
            await inventoryService.deleteItem(selectedItem.id);
            setItems(prev => prev.filter(i => i.id !== selectedItem.id));
            handleMenuClose();
        } catch (err) {
            alert('Failed to delete item');
        }
    };

    const categories = ['All', ...new Set(items.map(item => item.category))];

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const getStockStatus = (item) => {
        if (item.quantity <= 0) return { label: 'Out of Stock', color: 'error', icon: AlertTriangle };
        if (item.quantity <= item.reorderLevel) return { label: 'Low Stock', color: 'warning', icon: AlertTriangle };
        return { label: 'In Stock', color: 'success', icon: CheckCircle };
    };

    if (!isStaff) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <div className="flex flex-col gap-6">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Typography variant="h5" fontWeight={800} color="text.primary">
                        Inventory Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Track and manage clinic supplies and equipment
                    </Typography>
                </div>
                {['Admin', 'Receptionist'].includes(role) && (
                    <Button
                        variant="contained"
                        startIcon={<Plus size={18} />}
                        sx={{ borderRadius: 3 }}
                        onClick={() => setAddModalOpen(true)}
                    >
                        Add New Item
                    </Button>
                )}
            </div>

            {/* ── Filters & Search ── */}
            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
                <CardContent className="p-4 flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <Chip
                                key={cat}
                                label={cat}
                                onClick={() => setSelectedCategory(cat)}
                                color={selectedCategory === cat ? 'primary' : 'default'}
                                variant={selectedCategory === cat ? 'filled' : 'outlined'}
                                sx={{ borderRadius: 2, fontWeight: 600 }}
                            />
                        ))}
                    </div>
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-1.5 border border-slate-100 focus-within:border-blue-500 focus-within:bg-white transition-all w-full md:w-80">
                        <Search size={18} className="text-slate-400" />
                        <InputBase
                            placeholder="Search inventory..."
                            className="w-full text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* ── Content ── */}
            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <CircularProgress size={32} />
                </div>
            ) : error ? (
                <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredItems.length > 0 ? (
                        filteredItems.map((item) => {
                            const status = getStockStatus(item);
                            const percentWarning = item.quantity === 0 ? 0 : Math.min(100, Math.max(10, (item.quantity / (item.reorderLevel * 3)) * 100));

                            return (
                                <Card
                                    key={item.id}
                                    elevation={0}
                                    sx={{
                                        border: '1px solid #e2e8f0',
                                        borderRadius: 4,
                                        '&:hover': { border: '1px solid #94a3b8', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <CardContent className="p-5">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-600">
                                                    <Package size={24} />
                                                </div>
                                                <div>
                                                    <Typography variant="subtitle1" fontWeight={800} color="text.primary" className="leading-tight">
                                                        {item.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                        {item.category}
                                                    </Typography>
                                                </div>
                                            </div>
                                            <IconButton size="small" onClick={(e) => handleMenuOpen(e, item)}>
                                                <MoreHorizontal size={20} />
                                            </IconButton>
                                        </div>

                                        <div className="flex items-center justify-between mb-3 px-1">
                                            <div>
                                                <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ display: 'inline-block', mr: 1 }}>
                                                    {item.quantity}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ display: 'inline-block' }}>
                                                    {item.unit}
                                                </Typography>
                                            </div>
                                            <Chip
                                                label={status.label}
                                                size="small"
                                                color={status.color}
                                                icon={<status.icon size={14} />}
                                                sx={{ fontWeight: 700, borderRadius: 2 }}
                                            />
                                        </div>

                                        <Box sx={{ width: '100%', mb: 3 }}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={percentWarning}
                                                color={status.color}
                                                sx={{ height: 6, borderRadius: 3, backgroundColor: '#f1f5f9' }}
                                            />
                                            <div className="flex justify-between mt-1.5">
                                                <Typography variant="caption" color="text.secondary">Reorder Level: {item.reorderLevel}</Typography>
                                                {item.pricePerUnit && <Typography variant="caption" color="text.secondary font-medium">${item.pricePerUnit}/{item.unit}</Typography>}
                                            </div>
                                        </Box>
                                    </CardContent>

                                    {/* Quick Actions Footer */}
                                    {['Admin', 'Receptionist'].includes(role) && (
                                        <div className="border-t border-slate-100 p-2 flex bg-slate-50/50">
                                            <Button
                                                fullWidth
                                                size="small"
                                                color="primary"
                                                onClick={() => { setSelectedItem(item); setStockModalOpen(true); }}
                                                sx={{ fontWeight: 600 }}
                                            >
                                                Update Stock
                                            </Button>
                                        </div>
                                    )}
                                </Card>
                            );
                        })
                    ) : (
                        <div className="col-span-full flex h-48 flex-col items-center justify-center gap-3 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
                            <Package size={32} />
                            <p className="text-sm">No inventory items found.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ── Actions Menu ── */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: { borderRadius: 3, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', mt: 1, minWidth: 160 }
                }}
            >
                {['Admin', 'Receptionist'].includes(role) && (
                    <MenuItem onClick={() => { setStockModalOpen(true); handleMenuClose(); }} sx={{ gap: 1.5, py: 1.2, px: 2 }}>
                        <TrendingUp size={16} className="text-blue-500" />
                        <span className="text-sm font-medium">Add/Remove Stock</span>
                    </MenuItem>
                )}

                {isAdmin && (
                    <MenuItem onClick={handleDelete} sx={{ gap: 1.5, py: 1.2, px: 2 }}>
                        <Trash2 size={16} className="text-red-600" />
                        <span className="text-sm font-medium text-red-600">Delete Item</span>
                    </MenuItem>
                )}
            </Menu>

            {/* ── Modals ── */}
            <AddInventoryModal
                open={addModalOpen}
                onClose={() => setAddModalOpen(false)}
                onSuccess={fetchInventory}
            />

            <UpdateStockModal
                open={stockModalOpen}
                onClose={() => setStockModalOpen(false)}
                item={selectedItem}
                onSuccess={fetchInventory}
            />
        </div>
    );
}

