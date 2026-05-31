import React, { useState, useEffect } from 'react';
import {
    Package, Plus, Search, MoreHorizontal,
    AlertTriangle, CheckCircle, Trash2, Edit, TrendingUp, TrendingDown
} from 'lucide-react';
import {
    Typography, Chip, IconButton, Menu, MenuItem, CircularProgress, Alert,
    Box, LinearProgress, InputBase
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import inventoryService from '../../api/inventory.service';
import AddInventoryModal from '../../components/inventory/AddInventoryModal';
import UpdateStockModal from '../../components/inventory/UpdateStockModal';
import { useSelector } from 'react-redux';
import { Card, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useToast } from '../../hooks/useToast';

export default function InventoryListPage() {
    const { t } = useTranslation();
    const { error: toastError } = useToast();
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
            setError(t('videoConsult.accessDenied'));
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
            setError(t('common.error'));
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
        if (!selectedItem || !window.confirm(`${t('common.confirmDelete')} (${selectedItem.name})?`)) return;
        try {
            await inventoryService.deleteItem(selectedItem.id);
            setItems(prev => prev.filter(i => i.id !== selectedItem.id));
            handleMenuClose();
        } catch (err) {
            toastError(t('common.error'));
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
        if (item.quantity <= 0) return { label: t('billing.cancelled'), color: 'error', icon: AlertTriangle };
        if (item.quantity <= item.reorderLevel) return { label: t('inventory.lowStock'), color: 'warning', icon: AlertTriangle };
        return { label: t('common.active'), color: 'success', icon: CheckCircle };
    };

    if (!isStaff) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <div className="flex flex-col gap-6 p-4 lg:p-8 pb-8 min-h-screen">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Typography variant="h5" className="fw-800">
                        {t('inventory.title')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" className="mt-1 fw-500">
                        Track and manage clinic supplies and equipment
                    </Typography>
                </div>
                {['Admin', 'Receptionist'].includes(role) && (
                    <Button
                        variant="contained"
                        startIcon={<Plus size={18} />}
                        onClick={() => setAddModalOpen(true)}
                    >
                        {t('inventory.addItem')}
                    </Button>
                )}
            </div>

            {/* ── Filters & Search ── */}
            <Card>
                <CardContent className="p-4 flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <Chip
                                key={cat}
                                label={cat === 'All' ? t('common.all') : cat}
                                onClick={() => setSelectedCategory(cat)}
                                color={selectedCategory === cat ? 'primary' : 'default'}
                                variant={selectedCategory === cat ? 'filled' : 'outlined'}
                                sx={{ borderRadius: 2, fontWeight: 600 }}
                            />
                        ))}
                    </div>
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-1.5 border border-slate-100 focus-within:border-teal-500 focus-within:bg-white transition-all w-full md:w-80">
                        <Search size={18} className="text-slate-400" />
                        <InputBase
                            placeholder={t('common.searchPlaceholder')}
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
                                        background: 'rgba(255, 255, 255, 0.7)',
                                        backdropFilter: 'blur(12px)',
                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                        borderRadius: 5,
                                        overflow: 'hidden',
                                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                        '&:hover': {
                                            transform: 'translateY(-8px)',
                                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                                            borderColor: '#0d9488',
                                        }
                                    }}
                                >
                                    <CardContent className="p-0">
                                        <div className="p-6 flex justify-between items-start">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 shadow-sm">
                                                    <Package size={28} />
                                                </div>
                                                <div>
                                                    <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.3 }}>
                                                        {item.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                                                        {item.category}
                                                    </Typography>
                                                </div>
                                            </div>
                                            <IconButton 
                                                size="small" 
                                                onClick={(e) => handleMenuOpen(e, item)}
                                                sx={{ bgcolor: 'white/50', '&:hover': { bgcolor: 'white' }, mr: -1, mt: -1 }}
                                            >
                                                <MoreHorizontal size={18} />
                                            </IconButton>
                                        </div>

                                        <div className="px-6 pb-6 space-y-5">
                                            <div className="flex items-end justify-between">
                                                <div className="flex flex-col">
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5 }}>
                                                        {t('inventory.quantity')}
                                                    </Typography>
                                                    <div className="flex items-baseline gap-1.5">
                                                        <Typography variant="h5" fontWeight={800} color="text.primary">
                                                            {item.quantity}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                                            {item.unit}
                                                        </Typography>
                                                    </div>
                                                </div>
                                                <Chip
                                                    label={status.label}
                                                    size="small"
                                                    color={status.color}
                                                    icon={<status.icon size={14} />}
                                                    sx={{ fontWeight: 800, borderRadius: 2, px: 1 }}
                                                />
                                            </div>

                                            <Box sx={{ width: '100%' }}>
                                                <div className="flex justify-between mb-2">
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Inventory Health</Typography>
                                                    <Typography variant="caption" fontWeight={800} color={`${status.color}.main`}>{Math.round(percentWarning)}%</Typography>
                                                </div>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={percentWarning}
                                                    color={status.color}
                                                    sx={{ height: 10, borderRadius: 5, backgroundColor: '#f1f5f9', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}
                                                />
                                                <div className="flex justify-between mt-2 text-slate-500">
                                                    <div className="flex items-center gap-1.5">
                                                        <AlertTriangle size={12} className="text-amber-500" />
                                                        <Typography variant="caption" fontWeight={600}>{t('inventory.reorder')}: {item.reorderLevel}</Typography>
                                                    </div>
                                                    {item.pricePerUnit && (
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                                                            <Typography variant="caption" fontWeight={600}>ETB {item.pricePerUnit}/{item.unit}</Typography>
                                                        </div>
                                                    )}
                                                </div>
                                            </Box>
                                        </div>

                                        {['Admin', 'Receptionist'].includes(role) && (
                                            <div className="px-4 pb-4 pt-2 border-t border-slate-100">
                                                <Button
                                                    fullWidth
                                                    variant="contained"
                                                    size="medium"
                                                    onClick={() => { setSelectedItem(item); setStockModalOpen(true); }}
                                                    sx={{ borderRadius: 2.5, fontWeight: 700, bgcolor: '#0d9488', '&:hover': { bgcolor: '#0f766e' } }}
                                                >
                                                    Update Stock
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })
                    ) : (
                        <div className="col-span-full flex h-48 flex-col items-center justify-center gap-3 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
                            <Package size={32} />
                            <p className="text-sm font-bold">{t('inventory.noItems')}</p>
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
                        <span className="text-sm font-bold">Add/Remove Stock</span>
                    </MenuItem>
                )}

                {isAdmin && (
                    <MenuItem onClick={handleDelete} sx={{ gap: 1.5, py: 1.2, px: 2 }}>
                        <Trash2 size={16} className="text-red-600" />
                        <span className="text-sm font-bold text-red-600">{t('common.delete')}</span>
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
