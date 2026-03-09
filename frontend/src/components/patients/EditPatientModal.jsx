import React, { useState, useEffect } from 'react';
import {
    X, Save, Edit, Phone,
    Calendar, MapPin, Heart, AlertCircle,
    UserCircle, Upload
} from 'lucide-react';
import {
    Typography, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Grid,
    FormControl, InputLabel, Select, MenuItem,
    IconButton, CircularProgress, Avatar, Box, Alert
} from '@mui/material';
import patientService from '../../api/patient.service';
import { useSelector } from 'react-redux';

export default function EditPatientModal({ open, onClose, onSuccess, patient }) {
    const { user } = useSelector((s) => s.auth);
    const role = user?.role || 'Patient';
    const isAdmin = role === 'Admin';
    const isPatient = role === 'Patient';

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        dateOfBirth: '',
        gender: '',
        phone: '',
        address: '',
        bloodGroup: '',
        allergies: '',
        emergencyContact: ''
    });

    useEffect(() => {
        if (open && patient) {
            setFormData({
                fullName: patient.fullName || '',
                email: patient.email || '',
                dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.split('T')[0] : '',
                gender: patient.gender || '',
                phone: patient.phone || '',
                address: patient.address || '',
                bloodGroup: patient.bloodGroup || '',
                allergies: patient.allergies || '',
                emergencyContact: patient.emergencyContact || ''
            });
        }
    }, [open, patient]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await patientService.updatePatient(patient.id, formData);
            alert('Profile updated successfully!');
            onSuccess();
            onClose();
        } catch (err) {
            alert(err.response?.data?.message || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    // Permission Logic: Admin/Receptionist/Doctor or the Patient itself can edit
    const canEdit = ['Admin', 'Receptionist', 'Doctor'].includes(role) || (isPatient && patient?.userId === user?.id);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: 5, mt: 10 } }}
        >
            <form onSubmit={handleSubmit}>
                <DialogTitle sx={{ borderBottom: '1px solid #f1f5f9', p: 3 }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <Edit size={20} />
                            </div>
                            <Typography variant="h6" fontWeight={800}>Edit Patient Profile</Typography>
                        </div>
                        <IconButton onClick={onClose} size="small">
                            <X size={20} />
                        </IconButton>
                    </div>
                </DialogTitle>

                <DialogContent sx={{ p: 4 }}>
                    {!canEdit && (
                        <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }}>
                            You only have read-only access to this profile.
                        </Alert>
                    )}

                    <div className="pt-2">
                        <Grid container spacing={3}>
                            <Grid item xs={12} className="flex justify-center mb-4">
                                <Box sx={{ position: 'relative' }}>
                                    <Avatar
                                        src={patient?.profilePhoto}
                                        sx={{ width: 100, height: 100, borderRadius: 4, bgcolor: '#eff6ff', color: '#3b82f6' }}
                                    >
                                        <UserCircle size={64} />
                                    </Avatar>
                                    {canEdit && (
                                        <IconButton
                                            size="small"
                                            sx={{
                                                position: 'absolute', bottom: -10, right: -10,
                                                bgcolor: 'white', boxShadow: 1, '&:hover': { bgcolor: '#f1f5f9' }
                                            }}
                                        >
                                            <Upload size={16} className="text-blue-600" />
                                        </IconButton>
                                    )}
                                </Box>
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>
                                    PATIENT ID: {patient?.id ? patient.id.slice(0, 8) : 'NEW'}
                                </Typography>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    label="Full Name"
                                    name="fullName"
                                    fullWidth
                                    required
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    disabled={!canEdit}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    label="Email Address"
                                    name="email"
                                    type="email"
                                    fullWidth
                                    required
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    disabled={!isAdmin} // Only admin can edit email
                                    helperText={!isAdmin ? "Contact administrator to change email" : ""}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Date of Birth"
                                    name="dateOfBirth"
                                    type="date"
                                    fullWidth
                                    required
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.dateOfBirth}
                                    onChange={handleInputChange}
                                    disabled={!canEdit}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth required disabled={!canEdit}>
                                    <InputLabel>Gender</InputLabel>
                                    <Select
                                        name="gender"
                                        value={formData.gender}
                                        label="Gender"
                                        onChange={handleInputChange}
                                    >
                                        <MenuItem value="Male">Male</MenuItem>
                                        <MenuItem value="Female">Female</MenuItem>
                                        <MenuItem value="Other">Other</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Phone Number"
                                    name="phone"
                                    fullWidth
                                    required
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    disabled={!canEdit}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth disabled={!canEdit}>
                                    <InputLabel>Blood Group</InputLabel>
                                    <Select
                                        name="bloodGroup"
                                        value={formData.bloodGroup}
                                        label="Blood Group"
                                        onChange={handleInputChange}
                                    >
                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                            <MenuItem key={bg} value={bg}>{bg}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    label="Home Address"
                                    name="address"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    disabled={!canEdit}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    label="Allergies / Medical Conditions"
                                    name="allergies"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    value={formData.allergies}
                                    onChange={handleInputChange}
                                    disabled={!canEdit}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    label="Emergency Contact (Name & Phone)"
                                    name="emergencyContact"
                                    fullWidth
                                    value={formData.emergencyContact}
                                    onChange={handleInputChange}
                                    disabled={!canEdit}
                                />
                            </Grid>
                        </Grid>
                    </div>
                </DialogContent>

                <DialogActions sx={{ p: 3, borderTop: '1px solid #f1f5f9', gap: 2 }}>
                    <Button color="inherit" onClick={onClose}>Cancel</Button>
                    <Button
                        type="submit"
                        variant="contained"
                        startIcon={<Save size={18} />}
                        disabled={loading || !canEdit}
                        sx={{ borderRadius: 3, px: 4 }}
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
