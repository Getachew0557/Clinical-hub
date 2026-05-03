import React, { useState, useEffect } from 'react';
import { 
    Typography, Box, Card, CardContent, Button, Grid, 
    TextField, Dialog, DialogTitle, DialogContent, 
    DialogActions, IconButton, Alert, CircularProgress,
    Avatar, Tooltip
} from '@mui/material';
import { 
    Plus, Edit2, Trash2, MapPin, Phone, 
    Mail, Globe, Building2, Upload, X 
} from 'lucide-react';
import hospitalService from '../../api/hospital.service';
import { getDoctorPhotoUrl } from '../../utils/cn';

export default function HospitalListPage() {
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');

    const [openDialog, setOpenDialog] = useState(false);
    const [editingHospital, setEditingHospital] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        description: ''
    });
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchHospitals();
    }, []);

    const fetchHospitals = async () => {
        try {
            setLoading(true);
            const data = await hospitalService.getAllHospitals();
            setHospitals(data);
        } catch (err) {
            setError('Failed to fetch hospitals');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (hospital = null) => {
        if (hospital) {
            setEditingHospital(hospital);
            setFormData({
                name: hospital.name,
                address: hospital.address || '',
                phone: hospital.phone || '',
                email: hospital.email || '',
                description: hospital.description || ''
            });
            setLogoPreview(getDoctorPhotoUrl(hospital.logo));
        } else {
            setEditingHospital(null);
            setFormData({
                name: '',
                address: '',
                phone: '',
                email: '',
                description: ''
            });
            setLogoPreview(null);
        }
        setLogoFile(null);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingHospital(null);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        if (logoFile) data.append('logo', logoFile);

        try {
            if (editingHospital) {
                await hospitalService.updateHospital(editingHospital.id, data);
                setSuccessMsg('Hospital updated successfully');
            } else {
                await hospitalService.createHospital(data);
                setSuccessMsg('Hospital added successfully');
            }
            fetchHospitals();
            handleCloseDialog();
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Operation failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to deactivate this hospital?')) return;
        try {
            await hospitalService.deleteHospital(id);
            setSuccessMsg('Hospital deactivated');
            fetchHospitals();
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setError('Delete failed');
        }
    };

    if (loading) return (
        <Box className="flex items-center justify-center h-64">
            <CircularProgress />
        </Box>
    );

    return (
        <Box sx={{ p: { xs: 2, lg: 4 } }}>
            <Box className="flex justify-between items-center mb-8">
                <Box>
                    <Typography variant="h4" fontWeight={800} color="text.primary">
                        Hospital Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage clinical sites and hospital network
                    </Typography>
                </Box>
                <Button 
                    variant="contained" 
                    startIcon={<Plus size={18} />}
                    onClick={() => handleOpenDialog()}
                    sx={{ borderRadius: 3, px: 3 }}
                >
                    Add Hospital
                </Button>
            </Box>

            {successMsg && <Alert severity="success" sx={{ mb: 4, borderRadius: 3 }}>{successMsg}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>{error}</Alert>}

            <Grid container spacing={3}>
                {hospitals.map((hospital) => (
                    <Grid item xs={12} md={6} lg={4} key={hospital.id}>
                        <Card elevation={0} sx={{ 
                            border: '1px solid #e2e8f0', 
                            borderRadius: 4,
                            '&:hover': { borderColor: '#0d9488', boxShadow: '0 8px 24px rgba(13,148,136,0.08)' },
                            transition: 'all 0.3s'
                        }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box className="flex items-center gap-4 mb-4">
                                    <Avatar 
                                        src={getDoctorPhotoUrl(hospital.logo)} 
                                        variant="rounded"
                                        sx={{ width: 64, height: 64, bgcolor: '#f0fdfa', border: '1px solid #ccfbf1' }}
                                    >
                                        <Building2 className="text-teal-600" />
                                    </Avatar>
                                    <Box className="flex-1">
                                        <Typography variant="subtitle1" fontWeight={700} noWrap>
                                            {hospital.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" className="flex items-center gap-1">
                                            <MapPin size={12} /> {hospital.address || 'No address'}
                                        </Typography>
                                    </Box>
                                    <Box className="flex flex-col gap-1">
                                        <IconButton size="small" onClick={() => handleOpenDialog(hospital)}>
                                            <Edit2 size={16} className="text-slate-400" />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => handleDelete(hospital.id)}>
                                            <Trash2 size={16} className="text-red-400" />
                                        </IconButton>
                                    </Box>
                                </Box>

                                <Box className="space-y-2 mb-4">
                                    <Box className="flex items-center gap-2 text-slate-600">
                                        <Phone size={14} />
                                        <Typography variant="body2">{hospital.phone || 'N/A'}</Typography>
                                    </Box>
                                    <Box className="flex items-center gap-2 text-slate-600">
                                        <Mail size={14} />
                                        <Typography variant="body2">{hospital.email || 'N/A'}</Typography>
                                    </Box>
                                </Box>

                                <Typography variant="body2" color="text.secondary" sx={{ 
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    height: 40
                                }}>
                                    {hospital.description || 'No description provided.'}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Add/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                <form onSubmit={handleSubmit}>
                    <DialogTitle className="flex justify-between items-center">
                        <Typography variant="h6" fontWeight={800}>
                            {editingHospital ? 'Edit Hospital' : 'Add New Hospital'}
                        </Typography>
                        <IconButton onClick={handleCloseDialog}><X size={20} /></IconButton>
                    </DialogTitle>
                    <DialogContent dividers className="space-y-4">
                        <Box className="flex flex-col items-center gap-3 mb-4">
                            <Box className="relative">
                                <Avatar 
                                    src={logoPreview} 
                                    variant="rounded"
                                    sx={{ width: 100, height: 100, bgcolor: '#f8fafc', border: '2px dashed #e2e8f0' }}
                                >
                                    <Building2 size={40} className="text-slate-300" />
                                </Avatar>
                                <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg text-white">
                                    <Upload size={14} />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </label>
                            </Box>
                            <Typography variant="caption" color="text.secondary">Upload Hospital Logo</Typography>
                        </Box>

                        <TextField
                            fullWidth label="Hospital Name" required
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                        <TextField
                            fullWidth label="Address"
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                        />
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth label="Phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth label="Email" type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                            </Grid>
                        </Grid>
                        <TextField
                            fullWidth label="Description" multiline rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={handleCloseDialog} color="inherit" sx={{ borderRadius: 2 }}>Cancel</Button>
                        <Button 
                            type="submit" variant="contained" 
                            disabled={saving}
                            sx={{ borderRadius: 2, px: 4 }}
                        >
                            {saving ? <CircularProgress size={20} /> : (editingHospital ? 'Save Changes' : 'Add Hospital')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
