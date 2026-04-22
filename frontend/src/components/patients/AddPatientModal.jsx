import React, { useState } from 'react';
import {
    X, Save, UserPlus, Phone,
    Calendar, MapPin, Heart, PlusCircle,
    UserCircle
} from 'lucide-react';
import {
    Typography, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Grid,
    FormControl, InputLabel, Select, MenuItem,
    IconButton, CircularProgress, Box
} from '@mui/material';
import patientService from '../../api/patient.service';
import authService from '../../api/auth.service';

export default function AddPatientModal({ open, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        dateOfBirth: '',
        gender: '',
        phone: '',
        address: '',
        bloodGroup: '',
        allergies: '',
        emergencyContact: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Create Auth User
            const authUser = await authService.register({
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                role: 'Patient'
            });

            // 2. Create Patient Profile
            await patientService.createPatient({
                ...formData,
                userId: authUser.user.id
            });

            alert('Patient account and profile registered successfully!');
            onSuccess();
            onClose();
            setFormData({
                fullName: '', email: '', password: '',
                dateOfBirth: '', gender: '',
                phone: '', address: '', bloodGroup: '',
                allergies: '', emergencyContact: ''
            });
        } catch (err) {
            alert(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md" // Increased from sm
            fullWidth
            PaperProps={{ sx: { borderRadius: 3, mt: 4 } }} // Reduced top margin
        >
            <form onSubmit={handleSubmit}>
                <DialogTitle sx={{ borderBottom: '1px solid #f1f5f9', p: 3 }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <UserPlus size={20} />
                            </div>
                            <Typography variant="h6" fontWeight={800}>Register New Patient</Typography>
                        </div>
                        <IconButton onClick={onClose} size="small">
                            <X size={20} />
                        </IconButton>
                    </div>
                </DialogTitle>

                <DialogContent sx={{ p: 4 }}>
                    <div className="pt-2">
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
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
                                        placeholder="Full Name"
                                    />
                                </Box>
                            </Grid>

                            <Grid item xs={12} md={6}>
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
                                        placeholder="patient@example.com"
                                    />
                                </Box>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Box>
                                    <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                        Password
                                    </Typography>
                                    <TextField
                                        name="password"
                                        type="password"
                                        fullWidth
                                        required
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Set password"
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
                                    />
                                </Box>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Box>
                                    <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                        Gender
                                    </Typography>
                                    <FormControl fullWidth required>
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
                                        placeholder="+251..."
                                    />
                                </Box>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Box>
                                    <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                        Blood Group
                                    </Typography>
                                    <FormControl fullWidth>
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
                                        placeholder="Enter full home address"
                                        value={formData.address}
                                        onChange={handleInputChange}
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
                                        placeholder="e.g. Penicillin allergy, Diabetes..."
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
                                        placeholder="John Doe - 0911..."
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                    </div>
                </DialogContent>

                <DialogActions sx={{ p: 3, borderTop: '1px solid #f1f5f9', gap: 2 }}>
                    <Button color="inherit" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button
                        type="submit"
                        variant="contained"
                        startIcon={<Save size={18} />}
                        disabled={loading}
                        sx={{ borderRadius: 3, px: 4 }}
                    >
                        {loading ? 'Registering...' : 'Register Patient'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
