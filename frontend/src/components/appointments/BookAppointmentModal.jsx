import React, { useState, useEffect } from 'react';
import {
    X, Save, Calendar as CalendarIcon,
    Clock, User, Stethoscope as DoctorIcon,
    AlertCircle
} from 'lucide-react';
import {
    Typography, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Grid,
    FormControl, InputLabel, Select, MenuItem,
    IconButton, CircularProgress, Alert, Autocomplete
} from '@mui/material';
import appointmentService from '../../api/appointment.service';
import doctorService from '../../api/doctor.service';
import patientService from '../../api/patient.service';
import { useSelector } from 'react-redux';

export default function BookAppointmentModal({ open, onClose, onSuccess }) {
    const { user } = useSelector((s) => s.auth);
    const role = user?.role || 'Patient';
    const isStaff = ['Admin', 'Receptionist'].includes(role);

    const [loading, setLoading] = useState(false);
    const [doctors, setDoctors] = useState([]);
    const [patients, setPatients] = useState([]);
    const [fetchingData, setFetchingData] = useState(false);

    const [formData, setFormData] = useState({
        doctorId: '',
        patientId: role === 'Patient' ? user.id : '',
        appointmentDate: '',
        appointmentTime: '',
        reason: '',
        notes: ''
    });

    useEffect(() => {
        if (open) {
            loadInitialData();
        }
    }, [open]);

    const loadInitialData = async () => {
        try {
            setFetchingData(true);
            const drData = await doctorService.getAllDoctors({ isActive: true });
            setDoctors(drData.doctors || []);

            if (isStaff) {
                const ptData = await patientService.getAllPatients();
                setPatients(ptData.patients || []);
            }
        } catch (err) {
            console.error('Error loading booking data:', err);
        } finally {
            setFetchingData(false);
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
            await appointmentService.createAppointment(formData);
            alert('Appointment booked successfully!');
            onSuccess();
            onClose();
        } catch (err) {
            alert(err.response?.data?.message || 'Booking failed');
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
                                <CalendarIcon size={20} />
                            </div>
                            <Typography variant="h6" fontWeight={800}>Book Appointment</Typography>
                        </div>
                        <IconButton onClick={onClose} size="small">
                            <X size={20} />
                        </IconButton>
                    </div>
                </DialogTitle>

                <DialogContent sx={{ p: 4 }}>
                    {fetchingData ? (
                        <div className="flex justify-center p-8">
                            <CircularProgress size={24} />
                        </div>
                    ) : (
                        <Grid container spacing={3} sx={{ mt: 0.5 }}>
                            {isStaff ? (
                                <Grid item xs={12}>
                                    <FormControl fullWidth required>
                                        <InputLabel>Select Patient</InputLabel>
                                        <Select
                                            name="patientId"
                                            value={formData.patientId}
                                            label="Select Patient"
                                            onChange={handleInputChange}
                                        >
                                            {patients.map(p => (
                                                <MenuItem key={p.id} value={p.id}>
                                                    {p.name} ({p.email})
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            ) : (
                                <Grid item xs={12}>
                                    <TextField
                                        label="Patient Name"
                                        fullWidth
                                        disabled
                                        value={user?.fullName || ''}
                                    />
                                </Grid>
                            )}

                            <Grid item xs={12}>
                                <FormControl fullWidth required>
                                    <InputLabel>Select Doctor</InputLabel>
                                    <Select
                                        name="doctorId"
                                        value={formData.doctorId}
                                        label="Select Doctor"
                                        onChange={handleInputChange}
                                    >
                                        {doctors.map(d => (
                                            <MenuItem key={d.id} value={d.userId}>
                                                {d.fullName} ({d.specialization})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Date"
                                    name="appointmentDate"
                                    type="date"
                                    fullWidth
                                    required
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.appointmentDate}
                                    onChange={handleInputChange}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Time"
                                    name="appointmentTime"
                                    type="time"
                                    fullWidth
                                    required
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.appointmentTime}
                                    onChange={handleInputChange}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    label="Reason for Visit"
                                    name="reason"
                                    fullWidth
                                    required
                                    placeholder="e.g. Tooth ache, Routine Checkup"
                                    value={formData.reason}
                                    onChange={handleInputChange}
                                />
                            </Grid>

                            {isStaff && (
                                <Grid item xs={12}>
                                    <TextField
                                        label="Internal Notes"
                                        name="notes"
                                        fullWidth
                                        multiline
                                        rows={2}
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                    />
                                </Grid>
                            )}
                        </Grid>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 3, borderTop: '1px solid #f1f5f9', gap: 2 }}>
                    <Button color="inherit" onClick={onClose}>Cancel</Button>
                    <Button
                        type="submit"
                        variant="contained"
                        startIcon={<Save size={18} />}
                        disabled={loading || fetchingData}
                        sx={{ borderRadius: 3, px: 4 }}
                    >
                        {loading ? 'Booking...' : 'Confirm Booking'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
