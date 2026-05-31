import React, { useState } from 'react';
import {
    X, Save, UserPlus, Phone,
    Calendar, MapPin, Heart, PlusCircle,
    UserCircle
} from 'lucide-react';
import {
    Typography, Grid, FormControl, Select, MenuItem,
    CircularProgress, Box
} from '@mui/material';
import patientService from '../../api/patient.service';
import authService from '../../api/auth.service';
import { Modal, ModalContent, ModalActions } from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useToast } from '../../hooks/useToast';

export default function AddPatientModal({ open, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const { success, error } = useToast();
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

            success('Patient account and profile registered successfully!');
            onSuccess();
            onClose();
            setFormData({
                fullName: '', email: '', password: '',
                dateOfBirth: '', gender: '',
                phone: '', address: '', bloodGroup: '',
                allergies: '', emergencyContact: ''
            });
        } catch (err) {
            error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Register New Patient"
            maxWidth="md"
        >
            <form onSubmit={handleSubmit}>
                <ModalContent>
                    <div className="pt-2">
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Input
                                    name="fullName"
                                    label="Full Name"
                                    fullWidth
                                    required
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    placeholder="Full Name"
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Input
                                    name="email"
                                    label="Email Address"
                                    type="email"
                                    fullWidth
                                    required
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="patient@example.com"
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Input
                                    name="password"
                                    label="Password"
                                    type="password"
                                    fullWidth
                                    required
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Set password"
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Input
                                    name="dateOfBirth"
                                    label="Date of Birth"
                                    type="date"
                                    fullWidth
                                    required
                                    value={formData.dateOfBirth}
                                    onChange={handleInputChange}
                                />
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
                                <Input
                                    name="phone"
                                    label="Phone Number"
                                    fullWidth
                                    required
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="+251..."
                                />
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
                                <Input
                                    name="address"
                                    label="Home Address"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    placeholder="Enter full home address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Input
                                    name="allergies"
                                    label="Allergies / Medical Conditions"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    value={formData.allergies}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Penicillin allergy, Diabetes..."
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Input
                                    name="emergencyContact"
                                    label="Emergency Contact (Name & Phone)"
                                    fullWidth
                                    value={formData.emergencyContact}
                                    onChange={handleInputChange}
                                    placeholder="John Doe - 0911..."
                                />
                            </Grid>
                        </Grid>
                    </div>
                </ModalContent>

                <ModalActions
                    onCancel={onClose}
                    onConfirm={handleSubmit}
                    confirmText="Register Patient"
                    loading={loading}
                />
            </form>
        </Modal>
    );
}
