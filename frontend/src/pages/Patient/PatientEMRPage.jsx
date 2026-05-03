import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    FileText, Plus, Search, ChevronLeft, MoreVertical,
    Calendar, User, Clock, Trash2, Edit, Save, ArrowLeft, Printer
} from 'lucide-react';
import {
    Typography, Button, Card, CardContent, Grid, Box,
    CircularProgress, Alert, IconButton, Menu, MenuItem,
    Avatar, Divider, Chip, Dialog, TextField, DialogTitle,
    DialogContent, DialogActions
} from '@mui/material';
import emrService from '../../api/emr.service';
import patientService from '../../api/patient.service';
import reportService from '../../api/report.service';
import aiService from '../../api/ai.service';
import appointmentService from '../../api/appointment.service';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';
import { Sparkles, Brain, Lightbulb } from 'lucide-react';

export default function PatientEMRPage() {
    const [searchParams] = useSearchParams();
    const patientId = searchParams.get('patientId');
    const navigate = useNavigate();
    const { user } = useSelector((s) => s.auth);
    const role = user?.role || 'Patient';
    const isDoctor = role === 'Doctor';
    const isAdmin = role === 'Admin';

    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState(null);
    const [records, setRecords] = useState([]);
    const [allPatients, setAllPatients] = useState([]); // For registry view
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState(null);

    // Form State
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [formData, setFormData] = useState({
        diagnosis: '',
        treatment: '',
        notes: '',
        prescriptions: []
    });

    // AI State
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState(null);

    useEffect(() => {
        if (patientId) {
            fetchData(patientId);
        } else if (role === 'Patient') {
            // Patient always sees their own records — never the registry
            fetchMyData();
        } else {
            fetchAllPatients();
        }
    }, [patientId, role]);

    const fetchAllPatients = async () => {
        try {
            setLoading(true);

            if (role === 'Doctor') {
                // Doctor: only show patients from their own appointments
                const [apptData, allPatientsData] = await Promise.all([
                    appointmentService.getMyAppointments().catch(() => ({ appointments: [] })),
                    patientService.getAllPatients().catch(() => ({ patients: [] }))
                ]);
                const appointments = apptData.appointments || [];
                const allPatients = allPatientsData.patients || [];

                // Unique patientIds from this doctor's appointments
                const patientIds = [...new Set(appointments.map(a => a.patientId))];

                let doctorPatients = allPatients.filter(p =>
                    patientIds.includes(p.userId) || patientIds.includes(p.id) ||
                    patientIds.includes(String(p.userId)) || patientIds.includes(String(p.id))
                );

                // Fallback: build from enriched appointment data if patient service didn't match
                if (doctorPatients.length === 0 && appointments.length > 0) {
                    const seen = new Set();
                    doctorPatients = appointments
                        .filter(a => {
                            if (seen.has(a.patientId)) return false;
                            seen.add(a.patientId);
                            return true;
                        })
                        .map(a => ({
                            id: a.patientId,
                            userId: a.patientId,
                            fullName: a.patientName || `Patient #${a.patientId?.slice(-6)}`,
                            phone: a.patientDetails?.phone,
                            bloodGroup: a.patientDetails?.bloodGroup,
                            profilePhoto: a.patientDetails?.profilePhoto,
                        }));
                }

                setAllPatients(doctorPatients);
            } else {
                const data = await patientService.getAllPatients();
                setAllPatients(data.patients || data.records || []);
            }

            setError(null);
        } catch (err) {
            console.error('Fetch All Patients Error:', err);
            setError('Failed to load patient registry.');
        } finally {
            setLoading(false);
        }
    };

    const fetchData = async (id) => {
        try {
            setLoading(true);
            // 1. Get Patient Details First (Resolves the Profile ID regardless of if userId or profileId was passed)
            const pData = await patientService.getPatientById(id);
            setPatient(pData);

            if (pData?.id) {
                // 2. Fetch EMR Records using the resolved Profile ID
                const rData = await emrService.getPatientRecords(pData.id);
                // Sort latest first
                const sorted = (rData.records || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setRecords(sorted);
            }
            setError(null);
        } catch (err) {
            console.error('Fetch EMR Error:', err);
            setError('Failed to load EMR records. Please ensure the services are running.');
        } finally {
            setLoading(false);
        }
    };

    const fetchMyData = async () => {
        try {
            setLoading(true);
            const pData = await patientService.getMyProfile();
            setPatient(pData);
            // Try profile id first, then userId
            const profileId = pData?.id;
            const authUserId = pData?.userId || user?.id;
            let fetched = false;
            if (profileId) {
                try {
                    const rData = await emrService.getPatientRecords(profileId);
                    // Sort latest first
                    const sorted = (rData.records || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    setRecords(sorted);
                    fetched = true;
                } catch { /* try next */ }
            }
            if (!fetched && authUserId) {
                try {
                    const rData = await emrService.getPatientRecords(authUserId);
                    const sorted = (rData.records || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    setRecords(sorted);
                } catch {
                    setRecords([]);
                }
            }
            setError(null);
        } catch (err) {
            console.error('Fetch My EMR Error:', err);
            if (err.response?.status === 404) {
                setPatient({ fullName: user?.fullName, id: user?.id });
                setRecords([]);
                setError(null);
            } else {
                setError('Failed to load your records.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (record = null) => {
        if (record) {
            setEditingRecord(record);
            setFormData({
                diagnosis: record.diagnosis,
                treatment: record.treatment,
                notes: record.notes,
                prescriptions: record.prescriptions || []
            });
        } else {
            setEditingRecord(null);
            setFormData({
                diagnosis: '',
                treatment: '',
                notes: '',
                prescriptions: []
            });
        }
        setAiResult(null);
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            if (editingRecord) {
                await emrService.updateRecord(editingRecord.id, { ...formData, patientId: patient?.id || patientId });
            } else {
                await emrService.createRecord({ ...formData, patientId: patient?.id || patientId });
            }
            setModalOpen(false);
            if (patient?.id || patientId) {
                fetchData(patient?.id || patientId);
            }
        } catch (err) {
            alert('Failed to save record');
        }
    };

    const handleAiAnalysis = async () => {
        if (!formData.diagnosis && !formData.notes) {
            alert('Please enter a diagnosis or notes first');
            return;
        }
        try {
            setAiLoading(true);
            const data = await aiService.analyzeDiagnosis({
                symptoms: formData.diagnosis,
                history: `Patient Age: ${patient?.age}, Blood: ${patient?.bloodGroup}`,
                clinicalNotes: formData.notes
            });
            setAiResult({ type: 'analysis', text: data.analysis });
        } catch (err) {
            alert('AI analysis failed');
        } finally {
            setAiLoading(false);
        }
    };

    const handleAiTreatment = async () => {
        if (!formData.diagnosis) {
            alert('Please enter a diagnosis first');
            return;
        }
        try {
            setAiLoading(true);
            const data = await aiService.suggestTreatment(
                formData.diagnosis,
                `Age: ${patient?.age}, Gender: ${patient?.gender}, Blood: ${patient?.bloodGroup}`
            );
            setAiResult({ type: 'treatment', text: data.suggestions });
        } catch (err) {
            alert('AI suggestion failed');
        } finally {
            setAiLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this record?')) return;
        try {
            await emrService.deleteRecord(id);
            fetchData(patient?.id || patientId);
        } catch (err) {
            alert('Failed to delete record');
        }
    };

    const handlePrint = (record = null) => {
        if (record) {
            // Add a temporary class to the body for targeted printing
            document.body.classList.add('printing-single');
            window.print();
            document.body.classList.remove('printing-single');
        } else {
            window.print();
        }
    };

    if (loading) return <Box className="flex h-screen items-center justify-center"><CircularProgress /></Box>;

    return (
        <Box sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, lg: 4 }, pb: 12 }}>
            <Box className="flex flex-col gap-6">
            <style>
                {`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; font-size: 11pt; }
                    .MuiCard-root { border: none !important; border-bottom: 2px solid #f1f5f9 !important; border-radius: 0 !important; margin-bottom: 30px !important; }
                    .MuiPaper-root { box-shadow: none !important; }
                    .MuiAvatar-root { border: 1px solid #eee !important; }
                    .MuiGrid-root { display: flex !important; flex-direction: row !important; }
                    .patient-sidebar { width: 30% !important; max-width: 30% !important; flex-basis: 30% !important; }
                    .timeline-grid { width: 68% !important; max-width: 68% !important; flex-basis: 68% !important; margin-left: 2% !important; }

                    /* Targeted printing logic (for single record) */
                    body.printing-single .timeline-card:not(.printing-this) { display: none !important; }
                    body.printing-single .patient-sidebar { display: block !important; width: 100% !important; }
                    body.printing-single .timeline-grid { width: 100% !important; margin-left: 0 !important; }
                }
                `}
            </style>
            {/* ── Header ── */}
            <Box className="flex items-center gap-4">
                <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: 'white', border: '1px solid #e2e8f0' }}>
                    <ArrowLeft size={20} />
                </IconButton>
                <div>
                    <Typography variant="h5" fontWeight={800} color="text.primary">
                        Medical Records
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Viewing health history for <span className="font-bold text-blue-600">{patient?.fullName}</span>
                    </Typography>
                </div>
                <Box className="flex gap-2 ml-auto no-print">
                    <Button
                        variant="soft"
                        startIcon={<Printer size={18} />}
                        onClick={handlePrint}
                        sx={{ borderRadius: 3 }}
                    >
                        Print History
                    </Button>
                    {(isDoctor || isAdmin) && patient && (
                        <Button
                            variant="contained"
                            startIcon={<Plus size={18} />}
                            onClick={() => handleOpenModal()}
                            sx={{ borderRadius: 3 }}
                        >
                            New Entry
                        </Button>
                    )}
                </Box>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            {!patient && !loading && (
                <Box className="space-y-6">
                    <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
                        <CardContent className="flex items-center gap-3 p-3 px-5">
                            <Search size={20} className="text-slate-400" />
                            <TextField
                                placeholder="Search patients by name or ID..."
                                variant="standard"
                                fullWidth
                                InputProps={{ disableUnderline: true }}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </CardContent>
                    </Card>

                    <Grid container spacing={3}>
                        {allPatients
                            .filter(p => p.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || p.id?.includes(searchQuery))
                            .map((p) => (
                                <Grid item xs={12} sm={6} md={4} key={p.id}>
                                    <Card
                                        elevation={0}
                                        sx={{
                                            border: '1px solid #e2e8f0',
                                            borderRadius: 5,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            '&:hover': { borderColor: '#3b82f6', transform: 'translateY(-2px)' }
                                        }}
                                        onClick={() => navigate(`/emr?patientId=${p.id}`)}
                                    >
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <Avatar src={p.profilePhoto} sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: '#eff6ff', color: '#3b82f6' }}>
                                                <User size={24} />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={800}>{p.fullName}</Typography>
                                                <Typography variant="caption" color="text.secondary">ID: #{p.id.slice(-6)}</Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        {allPatients.length === 0 && (
                            <Grid item xs={12}>
                                <Box className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400 border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                                    <User size={64} strokeWidth={1} />
                                    <Typography variant="h6" fontWeight={700}>No Patients Found</Typography>
                                    <Typography variant="body2">Try registering a new patient first.</Typography>
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </Box>
            )}

            {patient && (
                <>
                    {/* ── Main Layout ── */}
                    <Grid container spacing={3}>
                        {/* Patient Summary Card */}
                        <Grid item xs={12} md={4} className="patient-sidebar">
                            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 5 }}>
                                <CardContent className="flex flex-col items-center text-center p-6">
                                    <Avatar
                                        src={patient?.profilePhoto}
                                        sx={{ width: 100, height: 100, mb: 2, borderRadius: 4, bgcolor: '#eff6ff', color: '#3b82f6' }}
                                    >
                                        <User size={48} />
                                    </Avatar>
                                    <Typography variant="h6" fontWeight={800}>{patient?.fullName}</Typography>
                                    <Box className="flex gap-2 mt-2">
                                        <Chip label={`Age: ${patient?.age || 'N/A'}`} size="small" variant="outlined" />
                                        <Chip label={patient?.bloodGroup || 'No Blood Group'} size="small" color="error" variant="outlined" />
                                    </Box>

                                    <Divider sx={{ width: '100%', my: 3 }} />

                                    <Box className="w-full space-y-3">
                                        <Box className="flex justify-between text-sm">
                                            <span className="text-slate-400">Patient ID:</span>
                                            <span className="font-bold">#{patient?.id?.slice(-6) || 'N/A'}</span>
                                        </Box>
                                        <Box className="flex justify-between text-sm">
                                            <span className="text-slate-400">Total Visits:</span>
                                            <span className="font-bold">{records.length}</span>
                                        </Box>
                                        <Box className="flex justify-between text-sm">
                                            <span className="text-slate-400">Last Visit:</span>
                                            <span className="font-bold">{records[0] ? format(new Date(records[0].createdAt), 'MMM dd, yyyy') : 'Never'}</span>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Timeline of Records */}
                        <Grid item xs={12} md={8} className="timeline-grid">
                            <Box className="space-y-4">
                                {records.length > 0 ? (
                                    records.map((record) => (
                                        <Card
                                            key={record.id}
                                            elevation={0}
                                            sx={{ border: '1px solid #e2e8f0', borderRadius: 5 }}
                                            className={`timeline-card ${record.id === editingRecord?.id ? 'printing-this' : ''}`}
                                        >
                                            <CardContent className="p-0">
                                                <Box className="p-4 bg-slate-50 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                                            <FileText size={20} />
                                                        </div>
                                                        <div>
                                                            <Typography variant="subtitle2" fontWeight={800}>Consultation Entry</Typography>
                                                            <Typography variant="caption" className="flex items-center gap-4 text-slate-500">
                                                                <span className="flex items-center gap-1"><Plus size={12} className="text-emerald-500" /> Added: {format(new Date(record.createdAt), 'MMM dd, yyyy • p')}</span>
                                                                {record.updatedAt !== record.createdAt && (
                                                                    <span className="flex items-center gap-1"><Edit size={12} className="text-blue-500" /> Modified: {format(new Date(record.updatedAt), 'MMM dd, yyyy • p')}</span>
                                                                )}
                                                            </Typography>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1 no-print">
                                                        {(isAdmin || (isDoctor && record.doctorId === user.id)) && (
                                                            <IconButton size="small" onClick={() => handleOpenModal(record)}>
                                                                <Edit size={16} />
                                                            </IconButton>
                                                        )}
                                                        {isAdmin && (
                                                            <IconButton size="small" className="text-red-500" onClick={() => handleDelete(record.id)}>
                                                                <Trash2 size={16} />
                                                            </IconButton>
                                                        )}
                                                        <IconButton size="small" onClick={() => handlePrint(record)}>
                                                            <Printer size={16} />
                                                        </IconButton>
                                                    </div>
                                                </Box>
                                                <Box className="p-5 space-y-4">
                                                    <Box sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: 3, borderLeft: '4px solid #3b82f6' }}>
                                                        <Typography variant="caption" fontWeight={800} className="text-blue-600 uppercase tracking-widest">Diagnosis / Chief Complaint</Typography>
                                                        <Typography variant="h6" className="mt-1" fontWeight={800} sx={{ color: '#1e293b' }}>{record.diagnosis}</Typography>
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="caption" fontWeight={800} className="text-emerald-500 uppercase tracking-wider">Treatment Provided</Typography>
                                                        <Typography variant="body2" className="mt-1" fontWeight={500}>{record.treatment}</Typography>
                                                    </Box>
                                                    <Box className="flex justify-between items-end">
                                                        {record.notes && (
                                                            <Box sx={{ flex: 1 }}>
                                                                <Typography variant="caption" fontWeight={800} className="text-slate-400 uppercase tracking-wider">Clinical Notes</Typography>
                                                                <Typography variant="body2" className="mt-1 text-slate-600 italic">"{record.notes}"</Typography>
                                                            </Box>
                                                        )}
                                                        <Typography variant="caption" sx={{ color: 'slate.400', ml: 'auto', textAlign: 'right' }}>
                                                            Recorded by Physician ID:<br />
                                                            <span style={{ fontWeight: 700 }}>#{record.doctorId?.slice(-6) || 'Unknown'}</span>
                                                        </Typography>
                                                    </Box>

                                                    {/* Prescriptions */}
                                                    {record.prescriptions && record.prescriptions.length > 0 && (
                                                        <Box sx={{ p: 2, bgcolor: '#f0fdf4', borderRadius: 3, border: '1px solid #bbf7d0' }}>
                                                            <Typography variant="caption" fontWeight={800} sx={{ color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1.5 }}>
                                                                💊 Prescriptions ({record.prescriptions.length})
                                                            </Typography>
                                                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 1 }}>
                                                                {record.prescriptions.map((rx, i) => (
                                                                    <Box key={i} sx={{ p: 1.5, bgcolor: 'white', borderRadius: 2, border: '1px solid #d1fae5' }}>
                                                                        <Typography variant="body2" fontWeight={800} sx={{ color: '#065f46' }}>{rx.medication}</Typography>
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            {rx.dosage} · {rx.frequency} · {rx.duration}
                                                                        </Typography>
                                                                        {rx.instructions && (
                                                                            <Typography variant="caption" sx={{ display: 'block', color: '#6b7280', fontStyle: 'italic', mt: 0.5 }}>
                                                                                {rx.instructions}
                                                                            </Typography>
                                                                        )}
                                                                    </Box>
                                                                ))}
                                                            </Box>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <Box className="py-20 flex flex-col items-center justify-center gap-4 text-slate-300 border-2 border-dashed border-slate-200 rounded-[2.5rem]">
                                        <FileText size={64} strokeWidth={1} />
                                        <Typography variant="h6" fontWeight={700} sx={{ color: 'slate.500' }}>No records found</Typography>
                                        <Typography variant="body2" sx={{ color: 'slate.400' }}>Add a new record to start the health history.</Typography>
                                        {(isDoctor || isAdmin) && (
                                            <Button 
                                                variant="outlined" 
                                                startIcon={<Plus size={16}/>} 
                                                onClick={() => handleOpenModal()} 
                                                sx={{ mt: 2, borderRadius: 3, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                                            >
                                                Create First Record
                                            </Button>
                                        )}
                                    </Box>
                                )}
                            </Box>
                        </Grid>
                    </Grid>

                    {/* Entry Modal */}
                    <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 5 } }}>
                        <DialogTitle fontWeight={800}>{editingRecord ? 'Edit Entry' : 'New Medical Entry'}</DialogTitle>
                        <DialogContent>
                            <Box className="flex flex-col gap-4 mt-2">
                                <Box>
                                    <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                        Diagnosis / Chief Complaint
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        required
                                        placeholder="e.g. Chronic Periodontitis"
                                        value={formData.diagnosis}
                                        onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                        Treatment Provided
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        variant="outlined"
                                        placeholder="Describe the treatment..."
                                        value={formData.treatment}
                                        onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="overline" color="text.secondary" sx={{ ml: 0.5, display: 'block' }}>
                                        Clinical Notes
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={4}
                                        variant="outlined"
                                        placeholder="Internal clinical observations..."
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </Box>

                                {/* Gemini AI Tools */}
                                <Box sx={{ mt: 1, p: 2, borderRadius: 4, bgcolor: '#f0f9ff', border: '1px dashed #3b82f6' }}>
                                    <Box className="flex items-center gap-2 mb-3">
                                        <Sparkles size={18} className="text-blue-600" />
                                        <Typography variant="subtitle2" fontWeight={800} color="primary.main">Gemini Clinical Assistant</Typography>
                                    </Box>
                                    <Box className="flex gap-2">
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            startIcon={aiLoading ? <CircularProgress size={14} /> : <Brain size={14} />}
                                            onClick={handleAiAnalysis}
                                            disabled={aiLoading}
                                            sx={{ borderRadius: 2, textTransform: 'none' }}
                                        >
                                            Assess Case
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            startIcon={aiLoading ? <CircularProgress size={14} /> : <Lightbulb size={14} />}
                                            onClick={handleAiTreatment}
                                            disabled={aiLoading}
                                            sx={{ borderRadius: 2, textTransform: 'none' }}
                                        >
                                            Suggest Plan
                                        </Button>
                                    </Box>

                                    {aiResult && (
                                        <Box sx={{ mt: 2, p: 2, bgcolor: 'white', borderRadius: 3, border: '1px solid #e0f2fe' }}>
                                            <Typography variant="caption" fontWeight={800} color="primary" sx={{ display: 'block', mb: 1, textTransform: 'uppercase' }}>
                                                {aiResult.type === 'analysis' ? 'AI Assessment' : 'AI Treatment Suggestion'}
                                            </Typography>
                                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: '#334155' }}>
                                                {aiResult.text}
                                            </Typography>
                                            <Box className="flex justify-end mt-2">
                                                <Button
                                                    size="small"
                                                    variant="soft"
                                                    onClick={() => {
                                                        const key = aiResult.type === 'analysis' ? 'notes' : 'treatment';
                                                        setFormData(prev => ({ ...prev, [key]: prev[key] + '\n\n' + aiResult.text }));
                                                        setAiResult(null);
                                                    }}
                                                    sx={{ borderRadius: 2 }}
                                                >
                                                    Apply to {aiResult.type === 'analysis' ? 'Notes' : 'Treatment'}
                                                </Button>
                                            </Box>
                                        </Box>
                                    )}
                                </Box>

                                {/* ── Prescriptions ── */}
                                <Box>
                                    <Box className="flex items-center justify-between mb-2">
                                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>
                                            Prescriptions
                                        </Typography>
                                        <Button
                                            size="small"
                                            startIcon={<Plus size={14} />}
                                            onClick={() => setFormData(prev => ({
                                                ...prev,
                                                prescriptions: [...(prev.prescriptions || []), { medication: '', dosage: '', frequency: '', duration: '', instructions: '' }]
                                            }))}
                                            sx={{ borderRadius: 2, textTransform: 'none' }}
                                        >
                                            Add Medicine
                                        </Button>
                                    </Box>
                                    {(formData.prescriptions || []).length === 0 && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                            No prescriptions added yet.
                                        </Typography>
                                    )}
                                    {(formData.prescriptions || []).map((rx, idx) => (
                                        <Box key={idx} sx={{ p: 2, mb: 1.5, border: '1px solid #e2e8f0', borderRadius: 3, bgcolor: '#f8fafc' }}>
                                            <Box className="flex justify-between items-center mb-2">
                                                <Typography variant="caption" fontWeight={800} color="primary">Prescription #{idx + 1}</Typography>
                                                <IconButton size="small" onClick={() => setFormData(prev => ({
                                                    ...prev,
                                                    prescriptions: prev.prescriptions.filter((_, i) => i !== idx)
                                                }))}>
                                                    <Trash2 size={14} className="text-red-500" />
                                                </IconButton>
                                            </Box>
                                            <Grid container spacing={1.5}>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField size="small" fullWidth label="Medication" placeholder="e.g. Amoxicillin 500mg"
                                                        value={rx.medication}
                                                        onChange={e => {
                                                            const updated = [...formData.prescriptions];
                                                            updated[idx] = { ...updated[idx], medication: e.target.value };
                                                            setFormData(prev => ({ ...prev, prescriptions: updated }));
                                                        }} />
                                                </Grid>
                                                <Grid item xs={6} sm={3}>
                                                    <TextField size="small" fullWidth label="Dosage" placeholder="e.g. 1 tablet"
                                                        value={rx.dosage}
                                                        onChange={e => {
                                                            const updated = [...formData.prescriptions];
                                                            updated[idx] = { ...updated[idx], dosage: e.target.value };
                                                            setFormData(prev => ({ ...prev, prescriptions: updated }));
                                                        }} />
                                                </Grid>
                                                <Grid item xs={6} sm={3}>
                                                    <TextField size="small" fullWidth label="Frequency" placeholder="e.g. 3x daily"
                                                        value={rx.frequency}
                                                        onChange={e => {
                                                            const updated = [...formData.prescriptions];
                                                            updated[idx] = { ...updated[idx], frequency: e.target.value };
                                                            setFormData(prev => ({ ...prev, prescriptions: updated }));
                                                        }} />
                                                </Grid>
                                                <Grid item xs={6} sm={3}>
                                                    <TextField size="small" fullWidth label="Duration" placeholder="e.g. 7 days"
                                                        value={rx.duration}
                                                        onChange={e => {
                                                            const updated = [...formData.prescriptions];
                                                            updated[idx] = { ...updated[idx], duration: e.target.value };
                                                            setFormData(prev => ({ ...prev, prescriptions: updated }));
                                                        }} />
                                                </Grid>
                                                <Grid item xs={12} sm={9}>
                                                    <TextField size="small" fullWidth label="Instructions" placeholder="e.g. Take after meals"
                                                        value={rx.instructions}
                                                        onChange={e => {
                                                            const updated = [...formData.prescriptions];
                                                            updated[idx] = { ...updated[idx], instructions: e.target.value };
                                                            setFormData(prev => ({ ...prev, prescriptions: updated }));
                                                        }} />
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ p: 3 }}>
                            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
                            <Button variant="contained" onClick={handleSave} startIcon={<Save size={18} />}>
                                Save Record
                            </Button>
                        </DialogActions>
                    </Dialog>

                </>
            )}
        </Box>
    </Box>
    );
}
