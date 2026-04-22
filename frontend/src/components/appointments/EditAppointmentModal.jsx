import React, { useState, useEffect } from 'react';
import {
    X, Save, Calendar as CalendarIcon,
    Clock, User, Stethoscope as DoctorIcon,
    AlertCircle, FileText
} from 'lucide-react';
import {
    Typography, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Grid,
    FormControl, InputLabel, Select, MenuItem,
    IconButton, CircularProgress, Alert, Box
} from '@mui/material';
import appointmentService from '../../api/appointment.service';
import doctorService from '../../api/doctor.service';
import { useSelector } from 'react-redux';

export default function EditAppointmentModal({ open, onClose, onSuccess, appointment }) {
    const { user } = useSelector((s) => s.auth);
    const role = user?.role || 'Patient';
    const isStaff = ['Admin', 'Receptionist'].includes(role);
    const isDoctor = role === 'Doctor';
    const isPatient = role === 'Patient';

    const [loading, setLoading] = useState(false);
    const [doctors, setDoctors] = useState([]);
    const [fetchingData, setFetchingData] = useState(false);

    const [formData, setFormData] = useState({
        doctorId: '',
        appointmentDate: '',
        appointmentTime: '',
        reason: '',
        notes: '',
        status: ''
    });

    useEffect(() => {
        if (open && appointment) {
            setFormData({
                doctorId: appointment.doctorId || '',
                appointmentDate: appointment.appointmentDate || '',
                appointmentTime: appointment.appointmentTime?.slice(0, 5) || '',
                reason: appointment.reason || '',
                notes: appointment.notes || '',
                status: appointment.status || ''
            });
            if (isStaff) loadDoctors();
        }
    }, [open, appointment]);

    const loadDoctors = async () => {
        try {
            setFetchingData(true);
            const drData = await doctorService.getAllDoctors({ isActive: true });
            setDoctors(drData.doctors || []);
        } catch (err) {
            console.error('Error loading doctors:', err);
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
            await appointmentService.updateAppointment(appointment.id, formData);
            alert('Appointment updated successfully!');
            onSuccess();
            onClose();
        } catch (err) {
            alert(err.response?.data?.message || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    // Permission Logic
    const canEditDetails = isStaff || (isPatient && appointment?.status === 'Pending');
    const canEditNotes = isStaff || isDoctor;
    const canEditStatus = isStaff || isDoctor;

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
                                <FileText size={20} />
                            </div>
                            <Typography variant="h6" fontWeight={800}>Edit Appointment</Typography>
                        </div>
                        <IconButton onClick={onClose} size="small">
                            <X size={20} />
                        </IconButton>
                    </div>
                </DialogTitle>

                <DialogContent sx={{ p: 4 }}>
                    <Grid container spacing={3} sx={{ mt: 0.5 }}>
                        <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>
                                APPOINTMENT ID: {appointment?.id?.slice(0, 8)}
                            </Typography>
                        </Grid>

                        {isStaff && (
                            <Grid item xs={12}>
                                <Box>
                                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ ml: 0.5, mb: 0.75, display: 'block', textTransform: 'uppercase' }}>
                                        Assigned Doctor
                                    </Typography>
                                    <FormControl fullWidth>
                                        <Select
                                            name="doctorId"
                                            value={formData.doctorId}
                                            displayEmpty
                                            onChange={handleInputChange}
                                            disabled={!canEditDetails}
                                        >
                                            <MenuItem value="" disabled>Select Doctor</MenuItem>
                                            {doctors.map(d => (
                                                <MenuItem key={d.id} value={d.userId}>
                                                    {d.fullName} ({d.specialization})
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Grid>
                        )}

                        <Grid item xs={12} md={6}>
                            <Box>
                                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ ml: 0.5, mb: 0.75, display: 'block', textTransform: 'uppercase' }}>
                                    Appointment Date
                                </Typography>
                                <TextField
                                    name="appointmentDate"
                                    type="date"
                                    fullWidth
                                    required
                                    value={formData.appointmentDate}
                                    onChange={handleInputChange}
                                    disabled={!canEditDetails}
                                />
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Box>
                                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ ml: 0.5, mb: 0.75, display: 'block', textTransform: 'uppercase' }}>
                                    Appointment Time
                                </Typography>
                                <TextField
                                    name="appointmentTime"
                                    type="time"
                                    fullWidth
                                    required
                                    value={formData.appointmentTime}
                                    onChange={handleInputChange}
                                    disabled={!canEditDetails}
                                />
                            </Box>
                        </Grid>

                        <Grid item xs={12}>
                            <Box>
                                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ ml: 0.5, mb: 0.75, display: 'block', textTransform: 'uppercase' }}>
                                    Reason for Visit
                                </Typography>
                                <TextField
                                    name="reason"
                                    fullWidth
                                    required
                                    multiline
                                    rows={2}
                                    value={formData.reason}
                                    onChange={handleInputChange}
                                    disabled={!canEditDetails}
                                />
                            </Box>
                        </Grid>

                        <Grid item xs={12}>
                            <Box>
                                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ ml: 0.5, mb: 0.75, display: 'block', textTransform: 'uppercase' }}>
                                    Clinical Notes
                                </Typography>
                                <TextField
                                    name="notes"
                                    fullWidth
                                    multiline
                                    rows={3}
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    disabled={!canEditNotes}
                                    placeholder={isDoctor ? "Add diagnosis, treatment plan, etc." : "Internal clinic notes"}
                                />
                            </Box>
                        </Grid>

                        {isStaff && (
                            <Grid item xs={12}>
                                <Box>
                                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ ml: 0.5, mb: 0.75, display: 'block', textTransform: 'uppercase' }}>
                                        Appointment Status
                                    </Typography>
                                    <FormControl fullWidth>
                                        <Select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleInputChange}
                                        >
                                            <MenuItem value="Pending">Pending</MenuItem>
                                            <MenuItem value="Confirmed">Confirmed</MenuItem>
                                            <MenuItem value="Completed">Completed</MenuItem>
                                            <MenuItem value="Cancelled">Cancelled</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Grid>
                        )}
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
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
