import React, { useState, useEffect } from 'react';
import { X, Save, Calendar as CalendarIcon } from 'lucide-react';
import {
    Typography, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Grid,
    FormControl, InputLabel, Select, MenuItem,
    IconButton, CircularProgress
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
    const [slots, setSlots] = useState([]);
    const [fetchingData, setFetchingData] = useState(false);
    const [fetchingSlots, setFetchingSlots] = useState(false);
    const [availableTypes, setAvailableTypes] = useState(['clinic', 'video']);

    const [formData, setFormData] = useState({
        doctorId: '',
        patientId: role === 'Patient' ? user.id : '',
        appointmentDate: new Date().toISOString().split('T')[0],
        appointmentTime: '',
        reason: '',
        notes: '',
        type: 'clinic'
    });

    // Reset on open
    useEffect(() => {
        if (open) {
            loadInitialData();
            setFormData({
                doctorId: '',
                patientId: role === 'Patient' ? user.id : '',
                appointmentDate: new Date().toISOString().split('T')[0],
                appointmentTime: '',
                reason: '',
                notes: '',
                type: 'clinic'
            });
            setSlots([]);
            setAvailableTypes(['clinic', 'video']);
        }
    }, [open]);

    // Fetch slots when doctor, date, or type changes
    useEffect(() => {
        if (formData.doctorId && formData.appointmentDate) {
            fetchSlots();
        } else {
            setSlots([]);
        }
    }, [formData.doctorId, formData.appointmentDate, formData.type]);

    // Update available types when doctor changes
    useEffect(() => {
        if (!formData.doctorId || doctors.length === 0) return;
        const selectedDoc = doctors.find(d =>
            d.userId === formData.doctorId || d.id === formData.doctorId
        );
        if (selectedDoc) {
            const types = Array.isArray(selectedDoc.serviceTypes)
                ? selectedDoc.serviceTypes
                : (selectedDoc.serviceTypes ? JSON.parse(selectedDoc.serviceTypes) : ['clinic', 'video']);
            setAvailableTypes(types);
            if (!types.includes(formData.type)) {
                setFormData(prev => ({ ...prev, type: types[0] || 'clinic', appointmentTime: '' }));
            }
        }
    }, [formData.doctorId, doctors]);

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

    const fetchSlots = async () => {
        try {
            setFetchingSlots(true);
            const data = await appointmentService.getAvailability(
                formData.doctorId, formData.appointmentDate, formData.type
            );
            setSlots(data.slots || []);
        } catch (err) {
            setSlots([]);
        } finally {
            setFetchingSlots(false);
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

    const availableSlots = slots.filter(s => s.available);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
            PaperProps={{ sx: { borderRadius: 5, m: { xs: 2, sm: 4 } } }}>
            <form onSubmit={handleSubmit}>
                <DialogTitle sx={{ borderBottom: '1px solid #f1f5f9', p: 3 }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <CalendarIcon size={20} />
                            </div>
                            <Typography variant="h6" fontWeight={800}>Book Appointment</Typography>
                        </div>
                        <IconButton onClick={onClose} size="small"><X size={20} /></IconButton>
                    </div>
                </DialogTitle>

                <DialogContent sx={{ p: 4 }}>
                    {fetchingData ? (
                        <div className="flex justify-center p-8"><CircularProgress size={24} /></div>
                    ) : (
                        <Grid container spacing={3} sx={{ mt: 0.5 }}>
                            {/* Patient */}
                            {isStaff ? (
                                <Grid item xs={12}>
                                    <FormControl fullWidth required>
                                        <InputLabel>Select Patient</InputLabel>
                                        <Select name="patientId" value={formData.patientId}
                                            label="Select Patient" onChange={handleInputChange}>
                                            {patients.map(p => (
                                                <MenuItem key={p.id} value={p.userId || p.id}>
                                                    {p.fullName || p.name}{p.email ? ` (${p.email})` : ''}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            ) : (
                                <Grid item xs={12}>
                                    <TextField label="Patient Name" fullWidth disabled value={user?.fullName || ''} />
                                </Grid>
                            )}

                            {/* Doctor */}
                            <Grid item xs={12}>
                                <FormControl fullWidth required>
                                    <InputLabel>Select Doctor</InputLabel>
                                    <Select name="doctorId" value={formData.doctorId}
                                        label="Select Doctor" onChange={handleInputChange}>
                                        {doctors.map(d => (
                                            <MenuItem key={d.id} value={d.userId || d.id}>
                                                {d.fullName} — {d.specialization}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Consultation Type — filtered by doctor's serviceTypes */}
                            {formData.doctorId && (
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary"
                                        sx={{ display: 'block', mb: 1.5, fontWeight: 700, textTransform: 'uppercase' }}>
                                        Consultation Type
                                    </Typography>
                                    <div className="flex gap-3">
                                        {[
                                            { val: 'clinic', label: '🏥 Clinic Visit', desc: 'In-person' },
                                            { val: 'video',  label: '📹 Video Call',   desc: 'Online' },
                                        ]
                                        .filter(({ val }) => availableTypes.includes(val))
                                        .map(({ val, label, desc }) => (
                                            <button key={val} type="button"
                                                onClick={() => setFormData(p => ({ ...p, type: val, appointmentTime: '' }))}
                                                className={`flex-1 flex flex-col items-center gap-0.5 py-3 px-3 rounded-2xl border-2 transition-all text-sm font-bold ${
                                                    formData.type === val
                                                        ? val === 'video'
                                                            ? 'bg-teal-600 text-white border-teal-600'
                                                            : 'bg-amber-500 text-white border-amber-500'
                                                        : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                                                }`}>
                                                <span>{label}</span>
                                                <span className={`text-[10px] ${formData.type === val ? 'text-white/70' : 'text-slate-400'}`}>{desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                    {availableTypes.length === 1 && (
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                            This doctor only offers {availableTypes[0] === 'clinic' ? 'clinic visits' : 'video consultations'}.
                                        </Typography>
                                    )}
                                </Grid>
                            )}

                            {/* Date */}
                            <Grid item xs={12} md={6}>
                                <TextField label="Date" name="appointmentDate" type="date" fullWidth required
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{ min: new Date().toISOString().split('T')[0] }}
                                    value={formData.appointmentDate} onChange={handleInputChange} />
                            </Grid>

                            {/* Time — slot picker if available, else free input */}
                            <Grid item xs={12} md={6}>
                                {formData.doctorId && availableSlots.length > 0 ? (
                                    <FormControl fullWidth required>
                                        <InputLabel>Time Slot</InputLabel>
                                        <Select name="appointmentTime" value={formData.appointmentTime}
                                            label="Time Slot" onChange={handleInputChange}>
                                            {availableSlots.map(s => (
                                                <MenuItem key={s.timeValue} value={s.timeValue}>
                                                    {s.time} ({s.remainingSpots} spot{s.remainingSpots !== 1 ? 's' : ''} left)
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                ) : (
                                    <TextField label="Time" name="appointmentTime" type="time" fullWidth required
                                        InputLabelProps={{ shrink: true }}
                                        helperText={fetchingSlots ? 'Loading slots...' : formData.doctorId ? 'No available slots — enter manually' : 'Select a doctor first'}
                                        value={formData.appointmentTime} onChange={handleInputChange} />
                                )}
                            </Grid>

                            {/* Reason */}
                            <Grid item xs={12}>
                                <TextField label="Reason for Visit" name="reason" fullWidth required
                                    placeholder="e.g. Routine Checkup, Follow-up visit"
                                    value={formData.reason} onChange={handleInputChange} />
                            </Grid>

                            {/* Notes (staff only) */}
                            {isStaff && (
                                <Grid item xs={12}>
                                    <TextField label="Internal Notes" name="notes" fullWidth multiline rows={2}
                                        value={formData.notes} onChange={handleInputChange} />
                                </Grid>
                            )}
                        </Grid>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 3, borderTop: '1px solid #f1f5f9', gap: 2 }}>
                    <Button color="inherit" onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="contained" startIcon={<Save size={18} />}
                        disabled={loading || fetchingData} sx={{ borderRadius: 3, px: 4 }}>
                        {loading ? 'Booking...' : 'Confirm Booking'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
