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
import { getPatientPhotoUrl } from '../../utils/cn';


export default function EditPatientModal({ open, onClose, onSuccess, patient }) {
    const { user } = useSelector((s) => s.auth);
    const role = user?.role || 'Patient';
    const isAdmin = role === 'Admin';
    const isPatient = role === 'Patient';

    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
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
            setPreviewUrl(patient.profilePhoto || null);
            setSelectedFile(null);
        }
    }, [open, patient]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let dataToSend = formData;
            
            // If there's a file or we need to send multipart
            if (selectedFile) {
                dataToSend = new FormData();
                Object.keys(formData).forEach(key => {
                    dataToSend.append(key, formData[key]);
                });
                dataToSend.append('profilePhoto', selectedFile);
            }

            await patientService.updatePatient(patient.id, dataToSend);
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
                                        src={previewUrl ? (previewUrl.startsWith('blob:') ? previewUrl : getPatientPhotoUrl(previewUrl)) : undefined}
                                        sx={{ width: 100, height: 100, borderRadius: 4, bgcolor: '#eff6ff', color: '#3b82f6' }}
                                    >
                                        <UserCircle size={64} />
                                    </Avatar>
                                    {canEdit && (
                                        <>
                                            <input
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                id="icon-button-file"
                                                type="file"
                                                onChange={handleFileChange}
                                            />
                                            <label htmlFor="icon-button-file">
                                                <IconButton
                                                    size="small"
                                                    component="span"
                                                    sx={{
                                                        position: 'absolute', bottom: -10, right: -10,
                                                        bgcolor: 'white', boxShadow: 1, '&:hover': { bgcolor: '#f1f5f9' }
                                                    }}
                                                >
                                                    <Upload size={16} className="text-blue-600" />
                                                </IconButton>
                                            </label>
                                        </>
                                    )}
                                </Box>
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>
                                    PATIENT ID: {patient?.id ? patient.id.slice(0, 8) : 'NEW'}
                                </Typography>
                            </Grid>

                            <Grid item xs={12}>
                                <Box>
                                    <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                        Full Name
                                    </Typography>
                                    <TextField
                                        name="fullName"
                                        fullWidth
                                        required
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        disabled={!canEdit}
                                    />
                                </Box>
                            </Grid>

                            <Grid item xs={12}>
                                <Box>
                                    <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                        Email Address
                                    </Typography>
                                    <TextField
                                        name="email"
                                        type="email"
                                        fullWidth
                                        required
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        disabled={!isAdmin} // Only admin can edit email
                                        helperText={!isAdmin ? "Contact administrator to change email" : ""}
                                    />
                                </Box>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Box>
                                    <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                        Date of Birth
                                    </Typography>
                                    <TextField
                                        name="dateOfBirth"
                                        type="date"
                                        fullWidth
                                        required
                                        value={formData.dateOfBirth}
                                        onChange={handleInputChange}
                                        disabled={!canEdit}
                                    />
                                </Box>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Box>
                                    <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                        Gender
                                    </Typography>
                                    <FormControl fullWidth required disabled={!canEdit}>
                                        <Select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleInputChange}
                                            displayEmpty
                                        >
                                            <MenuItem value="" disabled>Select Gender</MenuItem>
                                            <MenuItem value="Male">Male</MenuItem>
                                            <MenuItem value="Female">Female</MenuItem>
                                            <MenuItem value="Other">Other</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Box>
                                    <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                        Phone Number
                                    </Typography>
                                    <TextField
                                        name="phone"
                                        fullWidth
                                        required
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        disabled={!canEdit}
                                    />
                                </Box>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Box>
                                    <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                        Blood Group
                                    </Typography>
                                    <FormControl fullWidth disabled={!canEdit}>
                                        <Select
                                            name="bloodGroup"
                                            value={formData.bloodGroup}
                                            onChange={handleInputChange}
                                            displayEmpty
                                        >
                                            <MenuItem value="" disabled>Select Blood Group</MenuItem>
                                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                                <MenuItem key={bg} value={bg}>{bg}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Grid>

                            <Grid item xs={12}>
                                <Box>
                                    <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                        Home Address
                                    </Typography>
                                    <TextField
                                        name="address"
                                        fullWidth
                                        multiline
                                        rows={2}
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        disabled={!canEdit}
                                    />
                                </Box>
                            </Grid>

                            <Grid item xs={12}>
                                <Box>
                                    <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                        Allergies / Medical Conditions
                                    </Typography>
                                    <TextField
                                        name="allergies"
                                        fullWidth
                                        multiline
                                        rows={2}
                                        value={formData.allergies}
                                        onChange={handleInputChange}
                                        disabled={!canEdit}
                                    />
                                </Box>
                            </Grid>

                            <Grid item xs={12}>
                                <Box>
                                    <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                        Emergency Contact (Name & Phone)
                                    </Typography>
                                    <TextField
                                        name="emergencyContact"
                                        fullWidth
                                        value={formData.emergencyContact}
                                        onChange={handleInputChange}
                                        disabled={!canEdit}
                                    />
                                </Box>
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
