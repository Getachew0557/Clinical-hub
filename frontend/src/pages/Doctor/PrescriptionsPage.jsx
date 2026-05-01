import React, { useState, useEffect } from 'react';
import {
    Typography, Card, CardContent, Box, Button, TextField,
    CircularProgress, Alert, Grid, Chip, Divider, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Pill, Plus, Trash2, Printer, Search, FileText, X } from 'lucide-react';
import emrService from '../../api/emr.service';
import patientService from '../../api/patient.service';
import appointmentService from '../../api/appointment.service';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';

export default function PrescriptionsPage() {
    const { user } = useSelector(s => s.auth);
    const [records, setRecords] = useState([]); // EMR records with prescriptions
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [printRecord, setPrintRecord] = useState(null);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Get doctor's patients from appointments
            const [apptData, allPatientsData] = await Promise.all([
                appointmentService.getMyAppointments().catch(() => ({ appointments: [] })),
                patientService.getAllPatients().catch(() => ({ patients: [] }))
            ]);
            const appointments = apptData.appointments || [];
            const allPatients = allPatientsData.patients || [];
            const patientIds = [...new Set(appointments.map(a => a.patientId))];
            const myPatients = allPatients.filter(p =>
                patientIds.includes(p.userId) || patientIds.includes(p.id)
            );
            setPatients(myPatients);

            // Fetch EMR records for each patient to get prescriptions
            const allRecords = [];
            for (const p of myPatients.slice(0, 20)) { // limit to 20 patients
                try {
                    const rData = await emrService.getPatientRecords(p.id);
                    const recs = (rData.records || []).filter(r => r.prescriptions && r.prescriptions.length > 0);
                    recs.forEach(r => allRecords.push({ ...r, patientName: p.fullName, patientId: p.id }));
                } catch { /* skip */ }
            }
            allRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setRecords(allRecords);
            setError(null);
        } catch (err) {
            setError('Failed to load prescriptions.');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = (record) => {
        setPrintRecord(record);
        setTimeout(() => window.print(), 300);
    };

    const filtered = records.filter(r =>
        !search ||
        r.patientName?.toLowerCase().includes(search.toLowerCase()) ||
        r.diagnosis?.toLowerCase().includes(search.toLowerCase()) ||
        r.prescriptions?.some(rx => rx.medication?.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <Box sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, lg: 4 }, pb: 8 }}>
            <div className="flex flex-col gap-6">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <Typography variant="h5" fontWeight={700} color="text.primary">Prescriptions</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                            All prescriptions you've issued to your patients
                        </Typography>
                    </div>
                    <Button variant="outlined" startIcon={<FileText size={16} />} onClick={() => window.print()} sx={{ borderRadius: 3 }}>
                        Print All
                    </Button>
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 border border-slate-200 max-w-sm">
                    <Search size={16} className="text-slate-400" />
                    <input
                        placeholder="Search by patient, drug, diagnosis..."
                        className="bg-transparent text-sm outline-none flex-1"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {error && <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>}

                {loading ? (
                    <div className="flex justify-center py-16"><CircularProgress size={32} /></div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
                        <Pill size={48} className="mb-3 opacity-30" />
                        <Typography variant="body1" fontWeight={600}>No prescriptions found</Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                            Prescriptions are created when you add EMR records with medications.
                        </Typography>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {filtered.map(record => (
                            <Card key={record.id} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                                {/* Header */}
                                <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center">
                                            <Pill size={18} className="text-teal-600" />
                                        </div>
                                        <div>
                                            <Typography variant="subtitle2" fontWeight={700}>{record.patientName}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {record.diagnosis} · {format(new Date(record.createdAt), 'dd MMM yyyy')}
                                            </Typography>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Chip label={`${record.prescriptions.length} med${record.prescriptions.length !== 1 ? 's' : ''}`}
                                            size="small" color="primary" variant="outlined" sx={{ fontWeight: 700, borderRadius: 2 }} />
                                        <IconButton size="small" onClick={() => handlePrint(record)} title="Print prescription">
                                            <Printer size={16} />
                                        </IconButton>
                                    </div>
                                </div>

                                {/* Medications */}
                                <div className="divide-y divide-slate-50">
                                    {record.prescriptions.map((rx, i) => (
                                        <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 py-3">
                                            <div>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>Medication</Typography>
                                                <Typography variant="body2" fontWeight={700} sx={{ mt: 0.25 }}>{rx.medication}</Typography>
                                            </div>
                                            <div>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>Dosage</Typography>
                                                <Typography variant="body2" sx={{ mt: 0.25 }}>{rx.dosage}</Typography>
                                            </div>
                                            <div>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>Frequency</Typography>
                                                <Typography variant="body2" sx={{ mt: 0.25 }}>{rx.frequency}</Typography>
                                            </div>
                                            <div>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>Duration</Typography>
                                                <Typography variant="body2" sx={{ mt: 0.25 }}>{rx.duration}</Typography>
                                            </div>
                                            {rx.instructions && (
                                                <div className="col-span-2 sm:col-span-4">
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                        📝 {rx.instructions}
                                                    </Typography>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Print styles */}
            <style>{`
                @media print {
                    body > *:not(.print-prescription) { display: none !important; }
                    .print-prescription { display: block !important; }
                }
            `}</style>
        </Box>
    );
}
