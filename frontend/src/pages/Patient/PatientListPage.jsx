import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Users, Plus, Search, MoreHorizontal,
    UserPlus, Phone, FileText,
    Calendar, Trash2, Edit, AlertCircle,
    UserCircle
} from 'lucide-react';
import {
    Typography, Button, Card, CardContent, InputBase,
    Avatar, Chip, IconButton, Menu, MenuItem,
    CircularProgress, Alert, Box
} from '@mui/material';
import patientService from '../../api/patient.service';
import reportService from '../../api/report.service';
import appointmentService from '../../api/appointment.service';
import AddPatientModal from '../../components/patients/AddPatientModal';
import EditPatientModal from '../../components/patients/EditPatientModal';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getPatientPhotoUrl } from '../../utils/cn';

export default function PatientListPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useSelector((s) => s.auth);
    const role = user?.role || 'Patient';
    const isStaff = ['Admin', 'Receptionist'].includes(role);
    const isDoctor = role === 'Doctor';

    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);

    // Menu state
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedPatient, setSelectedPatient] = useState(null);

    useEffect(() => {
        if (!user) return; 
        if (role === 'Patient') {
            fetchMyProfile();
        } else {
            fetchPatients();
        }
    }, [role, user]);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            let patientData = [];

            if (role === 'Doctor') {
                const [apptData, allPatientsData] = await Promise.all([
                    appointmentService.getMyAppointments().catch(() => ({ appointments: [] })),
                    patientService.getAllPatients().catch(() => ({ patients: [] }))
                ]);
                const appointments = apptData.appointments || [];
                const allPatients = allPatientsData.patients || [];
                const patientIds = [...new Set(appointments.map(a => a.patientId))];
                patientData = allPatients.filter(p =>
                    patientIds.includes(p.userId) || patientIds.includes(p.id) ||
                    patientIds.includes(String(p.userId)) || patientIds.includes(String(p.id))
                );

                if (patientData.length === 0 && appointments.length > 0) {
                    const seen = new Set();
                    patientData = appointments
                        .filter(a => {
                            if (seen.has(a.patientId)) return false;
                            seen.add(a.patientId);
                            return true;
                        })
                        .map(a => ({
                            id: a.patientId,
                            userId: a.patientId,
                            fullName: a.patientName || `Patient #${a.patientId?.slice(-6)}`,
                            patientDetails: a.patientDetails
                        }));
                }
            } else {
                const data = await patientService.getAllPatients();
                patientData = data.patients || [];
            }

            const seenKeys = new Set();
            patientData = patientData.filter(p => {
                const key = String(p.userId || p.id).toLowerCase();
                const emailKey = p.email?.toLowerCase();
                if (seenKeys.has(key) || (emailKey && seenKeys.has(emailKey))) return false;
                seenKeys.add(key);
                if (emailKey) seenKeys.add(emailKey);
                return true;
            });

            if (isStaff) {
                try {
                    const authData = await import('../../api/auth.service.js').then(m => m.default.getAllUsers());
                    const authPatients = (Array.isArray(authData) ? authData : [])
                        .filter(u => u.role === 'Patient');
                    
                    const existingUserIds = new Set(patientData.map(p => String(p.userId || p.id).toLowerCase()));
                    const existingEmails  = new Set(patientData.map(p => p.email?.toLowerCase()).filter(Boolean));
                    
                    const missing = authPatients
                        .filter(u => {
                            const idMatch = existingUserIds.has(String(u.id).toLowerCase());
                            const emailMatch = u.email && existingEmails.has(u.email.toLowerCase());
                            return !idMatch && !emailMatch;
                        })
                        .map(u => ({ 
                            id: u.id, 
                            userId: u.id, 
                            fullName: u.fullName, 
                            email: u.email, 
                            phone: u.phone || '',
                            isActive: true 
                        }));
                    
                    patientData = [...patientData, ...missing];
                } catch (e) { 
                    console.warn('Auth merge failed:', e.message);
                }
            }

            setPatients(patientData);
            setError(null);
        } catch (err) {
            console.error('Fetch Patients Error:', err);
            setError(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const fetchMyProfile = async () => {
        try {
            setLoading(true);
            const data = await patientService.getMyProfile();
            if (data && data.id) {
                setPatients([data]);
            } else if (data && data.patient) {
                setPatients([data.patient]);
            } else {
                setPatients([]);
            }
            setError(null);
        } catch (err) {
            console.error('Fetch Profile Error:', err);
            if (err.response && err.response.status === 404) {
                setPatients([]); 
                setError(null);
            } else {
                setError(t('common.error'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleMenuOpen = (event, patient) => {
        setAnchorEl(event.currentTarget);
        setSelectedPatient(patient);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleDelete = async () => {
        if (!selectedPatient || !window.confirm(t('common.confirmDelete'))) return;
        try {
            await patientService.deletePatient(selectedPatient.id);
            setPatients(prev => prev.filter(p => p.id !== selectedPatient.id));
            handleMenuClose();
            alert(t('common.success'));
        } catch (err) {
            alert(t('common.error'));
        }
    };

    const filteredPatients = patients.filter(p =>
        p && (p.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.phone?.includes(searchQuery))
    );

    return (
        <Box sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, lg: 4 }, pb: 8 }}>
            <div className="flex flex-col gap-6">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Typography variant="h5" fontWeight={900} color="text.primary">
                        {role === 'Patient' ? t('portal.myProfile') : t('portal.patientMgmt')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
                        {isStaff ? t('portal.patientMgmtDescStaff') : isDoctor ? t('portal.patientMgmtDescDoctor') : t('portal.patientMgmtDescPatient')}
                    </Typography>
                </div>
                {isStaff && (
                    <Button
                        variant="contained"
                        startIcon={<Plus size={18} />}
                        sx={{ borderRadius: 3, bgcolor: '#0d9488', '&:hover': { bgcolor: '#0f766e' } }}
                        onClick={() => setAddModalOpen(true)}
                    >
                        {t('portal.registerPatient')}
                    </Button>
                )}
            </div>

            {/* ── Search & Filters ── */}
            {role !== 'Patient' && (
                <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
                    <CardContent className="flex items-center gap-3 p-3 px-5">
                        <Search size={20} className="text-slate-400" />
                        <InputBase
                            placeholder={t('common.searchPlaceholder')}
                            className="w-full text-sm font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </CardContent>
                </Card>
            )}

            {/* ── Patient List ── */}
            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <CircularProgress size={32} />
                </div>
            ) : error ? (
                <Alert severity="error" icon={<AlertCircle size={20} />} sx={{ borderRadius: 3 }}>
                    {error}
                </Alert>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPatients.length > 0 ? (
                        filteredPatients.map((pt) => (
                            <Card
                                key={pt.id}
                                elevation={0}
                                sx={{
                                    bgcolor: 'background.paper',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 5,
                                    overflow: 'hidden',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 12px 20px rgba(0,0,0,0.08)',
                                        borderColor: '#0d9488',
                                    }
                                }}
                            >
                                <CardContent className="p-0">
                                    <div className="p-6 flex items-start justify-between">
                                        <div className="flex items-center gap-5">
                                            <Avatar
                                                src={getPatientPhotoUrl(pt.profilePhoto)}
                                                sx={{ 
                                                    width: 64, 
                                                    height: 64, 
                                                    borderRadius: 4, 
                                                    bgcolor: '#f0fdfa', 
                                                    color: '#0d9488', 
                                                    fontWeight: 900,
                                                    fontSize: '1.25rem'
                                                }}
                                            >
                                                {pt.fullName?.charAt(0) || <UserCircle size={32} />}
                                            </Avatar>
                                            <div>
                                                <Typography variant="subtitle1" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.3 }}>
                                                    {pt.fullName}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, fontWeight: 600 }}>
                                                    ID: #{(pt.userId || pt.id)?.slice(-6)?.toUpperCase()}
                                                </Typography>
                                            </div>
                                        </div>
                                        {(role === 'Admin' || role === 'Receptionist' || role === 'Doctor' || (role === 'Patient' && pt.userId === user?.id)) && (
                                            <IconButton size="small" onClick={(e) => handleMenuOpen(e, pt)} 
                                                sx={{ border: '1px solid #f1f5f9' }}>
                                                <MoreHorizontal size={18} />
                                            </IconButton>
                                        )}
                                    </div>

                                    <div className="px-6 pb-6 grid grid-cols-1 gap-3">
                                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <Phone size={14} className="text-teal-600" />
                                                <Typography variant="caption" fontWeight={700} color="text.secondary">{t('common.phone')}</Typography>
                                            </div>
                                            <Typography variant="body2" fontWeight={600}>{pt.phone || '—'}</Typography>
                                        </div>
                                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <AlertCircle size={14} className="text-red-500" />
                                                <Typography variant="caption" fontWeight={700} color="text.secondary">{t('common.bloodGroup')}</Typography>
                                            </div>
                                            <Typography variant="body2" fontWeight={700} color="error.main">{pt.bloodGroup || '—'}</Typography>
                                        </div>
                                    </div>

                                    <div className="px-6 pb-6 flex gap-3">
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            startIcon={<FileText size={16} />}
                                            onClick={() => navigate(`/emr?patientId=${pt.userId || pt.id}`)}
                                            sx={{ borderRadius: 2, fontWeight: 700 }}
                                        >
                                            {t('common.records')}
                                        </Button>
                                        {isStaff && (
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                startIcon={<Calendar size={16} />}
                                                onClick={() => navigate(`/appointments?patientId=${pt.userId || pt.id}`)}
                                                sx={{ borderRadius: 2, bgcolor: '#0d9488', fontWeight: 700 }}
                                            >
                                                {t('nav.appointments')}
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
                            {role === 'Patient' ? (
                                <>
                                    <AlertCircle size={64} strokeWidth={1} className="text-teal-200" />
                                    <div className="text-center">
                                        <Typography variant="subtitle1" fontWeight={800} color="text.primary">{t('portal.profileNotFound')}</Typography>
                                        <Typography variant="body2" sx={{ maxWidth: 400, mt: 1 }}>
                                            {t('portal.profileNotFoundDesc')}
                                        </Typography>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Users size={64} strokeWidth={1} />
                                    <Typography variant="subtitle1" fontWeight={800} color="text.primary">{t('common.noRecords')}</Typography>
                                    <Typography variant="body2">{t('common.adjustSearch')}</Typography>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── Menus & Modals ── */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{ sx: { borderRadius: 3, width: 200, mt: 1, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' } }}
            >
                <MenuItem onClick={() => { setEditModalOpen(true); handleMenuClose(); }} sx={{ gap: 1.5, py: 1.2 }}>
                    <Edit size={16} className="text-teal-600" />
                    <span className="text-sm font-bold">{t('common.edit')}</span>
                </MenuItem>
                {role === 'Admin' && (
                    <MenuItem onClick={handleDelete} sx={{ gap: 1.5, py: 1.2, color: 'error.main' }}>
                        <Trash2 size={16} />
                        <span className="text-sm font-bold">{t('common.delete')}</span>
                    </MenuItem>
                )}
            </Menu>

            <AddPatientModal
                open={addModalOpen}
                onClose={() => setAddModalOpen(false)}
                onSuccess={fetchPatients}
            />

            <EditPatientModal
                open={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                patient={selectedPatient}
                onSuccess={role === 'Patient' ? fetchMyProfile : fetchPatients}
            />
        </div>
    </Box>
    );
}
