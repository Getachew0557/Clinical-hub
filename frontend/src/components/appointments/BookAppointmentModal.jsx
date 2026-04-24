import React, { useState, useEffect } from 'react';
import { X, Save, Calendar as CalendarIcon, Paperclip } from 'lucide-react';
import {
    Typography, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Grid,
    FormControl, Select, MenuItem,
    IconButton, CircularProgress, Box
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
    const [attachmentFile, setAttachmentFile] = useState(null);

    const [formData, setFormData] = useState({
        doctorId: '',
        patientId: role === 'Patient' ? user.id : '',
        appointmentDate: new Date().toISOString().split('T')[0],
        appointmentTime: '',
        reason: '',
        notes: '',
        type: 'clinic'
    });

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
            setAttachmentFile(null);
        }
    }, [open]);

    useEffect(() => {
        if (formData.doctorId && formData.appointmentDate) {
            fetchSlots();
        } else {
            setSlots([]);
        }
    }, [formData.doctorId, formData.appointmentDate, formData.type]);

    useEffect(() => {
        if (!formData.doctorId || doctors.length === 0) return;
        const selectedDoc = doctors.find(d => d.userId === formData.doctorId || d.id === formData.doctorId);
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
                let patientList = ptData.patients || [];

                // If patient profiles are empty, fall back to auth users with role=Patient
                if (patientList.length === 0) {
                    try {
                        const authData = await import('../../api/auth.service.js').then(m => m.default.getAllUsers());
                        const patientUsers = (Array.isArray(authData) ? authData : [])
                            .filter(u => u.role === 'Patient')
                            .map(u => ({ id: u.id, userId: u.id, fullName: u.fullName, email: u.email }));
                        patientList = patientUsers;
                    } catch { /* ignore */ }
                }
                setPatients(patientList);
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
            const data = await appointmentService.getAvailability(formData.doctorId, formData.appointmentDate, formData.type);
            setSlots(data.slots || []);
        } catch {
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
            if (attachmentFile) {
                // Only use FormData when there's actually a file to upload
                const fd = new FormData();
                Object.entries(formData).forEach(([k, v]) => { if (v !== '' && v != null) fd.append(k, v); });
                fd.append('attachment', attachmentFile);
                await appointmentService.createAppointmentWithFile(fd);
            } else {
                // Plain JSON — avoids empty-string fields that fail backend validation
                const payload = {};
                Object.entries(formData).forEach(([k, v]) => { if (v !== '' && v != null) payload[k] = v; });
                await appointmentService.createAppointment(payload);
            }
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
            PaperProps={{ sx: { borderRadius: 4, m: { xs: 2, sm: 4 } } }}>
            <form onSubmit={handleSubmit}>
                <DialogTitle sx={{ borderBottom: '1px solid #f1f5f9', p: 3 }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                                <CalendarIcon size={20} />
                            </div>
                            <Typography variant="h6" fontWeight={700}>Book Appointment</Typography>
                        </div>
                        <IconButton onClick={onClose} size="small"><X size={20} /></IconButton>
                    </div>
                </DialogTitle>

                <DialogContent sx={{ p: 4 }}>
                    {fetchingData ? (
                        <div className="flex justify-center p-8"><CircularProgress size={24} /></div>
                    ) : (
                        <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
                            {/* Patient */}
                            {isStaff ? (
                                <Grid item xs={12}>
                                    <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Select Patient</Typography>
                                    <FormControl fullWidth required>
                                        <Select name="patientId" value={formData.patientId} displayEmpty onChange={handleInputChange}>
                                            <MenuItem value="" disabled>Choose Patient</MenuItem>
                                            {patients.map(p => (
                                                <MenuItem key={p.id} value={p.userId || p.id}>{p.fullName}{p.email ? ` (${p.email})` : ''}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            ) : (
                                <Grid item xs={12}>
                                    <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Patient</Typography>
                                    <TextField fullWidth disabled value={user?.fullName || ''} />
                                </Grid>
                            )}

                            {/* Doctor */}
                            <Grid item xs={12}>
                                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Select Doctor</Typography>
                                <FormControl fullWidth required>
                                    <Select name="doctorId" value={formData.doctorId} displayEmpty onChange={handleInputChange}>
                                        <MenuItem value="" disabled>Choose Doctor</MenuItem>
                                        {doctors.map(d => (
                                            <MenuItem key={d.id} value={d.userId || d.id}>{d.fullName} — {d.specialization}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Type */}
                            {formData.doctorId && (
                                <Grid item xs={12}>
                                    <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Consultation Type</Typography>
                                    <div className="flex gap-2">
                                        {[{ val: 'clinic', label: '🏥 Clinic Visit' }, { val: 'video', label: '📹 Video Call' }]
                                            .filter(({ val }) => availableTypes.includes(val))
                                            .map(({ val, label }) => (
                                                <button key={val} type="button"
                                                    onClick={() => setFormData(p => ({ ...p, type: val, appointmentTime: '' }))}
                                                    className={`flex-1 py-2.5 px-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                                                        formData.type === val
                                                            ? 'bg-teal-600 text-white border-teal-600'
                                                            : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                                                    }`}>
                                                    {label}
                                                </button>
                                            ))}
                                    </div>
                                </Grid>
                            )}

                            {/* Date + Time */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Date</Typography>
                                <TextField name="appointmentDate" type="date" fullWidth required
                                    inputProps={{ min: new Date().toISOString().split('T')[0] }}
                                    value={formData.appointmentDate} onChange={handleInputChange} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    {availableSlots.length > 0 ? 'Time Slot' : 'Time'}
                                </Typography>
                                {availableSlots.length > 0 ? (
                                    <FormControl fullWidth required>
                                        <Select name="appointmentTime" value={formData.appointmentTime} displayEmpty onChange={handleInputChange}>
                                            <MenuItem value="" disabled>Choose Slot</MenuItem>
                                            {availableSlots.map(s => (
                                                <MenuItem key={s.timeValue} value={s.timeValue}>
                                                    {s.time} ({s.remainingSpots} left)
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                ) : (
                                    <TextField name="appointmentTime" type="time" fullWidth required
                                        helperText={fetchingSlots ? 'Loading...' : ''}
                                        value={formData.appointmentTime} onChange={handleInputChange} />
                                )}
                            </Grid>

                            {/* Reason */}
                            <Grid item xs={12}>
                                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Reason for Visit</Typography>
                                <TextField name="reason" fullWidth required
                                    placeholder="e.g. Routine Checkup, Follow-up visit"
                                    value={formData.reason} onChange={handleInputChange} />
                            </Grid>

                            {/* File attachment — patient can upload history */}
                            <Grid item xs={12}>
                                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Attach Medical History (optional)
                                </Typography>
                                <label className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-all">
                                    <Paperclip size={16} className="text-slate-400 shrink-0" />
                                    <span className="text-sm text-slate-500 truncate">
                                        {attachmentFile ? attachmentFile.name : 'Upload image or PDF (max 10MB)'}
                                    </span>
                                    <input type="file" accept="image/*,.pdf" className="hidden"
                                        onChange={e => setAttachmentFile(e.target.files[0] || null)} />
                                </label>
                                {attachmentFile && (
                                    <button type="button" onClick={() => setAttachmentFile(null)}
                                        className="text-xs text-red-500 mt-1 hover:underline">
                                        Remove file
                                    </button>
                                )}
                            </Grid>

                            {/* Notes (staff only) */}
                            {isStaff && (
                                <Grid item xs={12}>
                                    <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Internal Notes</Typography>
                                    <TextField name="notes" fullWidth multiline rows={2}
                                        placeholder="Internal staff notes..."
                                        value={formData.notes} onChange={handleInputChange} />
                                </Grid>
                            )}
                        </Grid>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 3, borderTop: '1px solid #f1f5f9', gap: 1.5 }}>
                    <Button color="inherit" onClick={onClose} size="medium">Cancel</Button>
                    <Button type="submit" variant="contained" startIcon={<Save size={16} />}
                        disabled={loading || fetchingData} size="medium">
                        {loading ? 'Booking...' : 'Confirm Booking'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
