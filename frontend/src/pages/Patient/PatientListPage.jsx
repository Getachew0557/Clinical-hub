import React, { useState, useEffect } from 'react';
import {
    Users, Plus, Search, MoreHorizontal,
    UserPlus, Heart, Phone, FileText,
    Calendar, Trash2, Edit, AlertCircle,
    UserCircle
} from 'lucide-react';
import {
    Typography, Button, Card, CardContent, InputBase,
    Avatar, Chip, IconButton, Menu, MenuItem,
    CircularProgress, Alert, Box
} from '@mui/material';
import patientService from '../../api/patient.service';
import AddPatientModal from '../../components/patients/AddPatientModal';
import EditPatientModal from '../../components/patients/EditPatientModal';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export default function PatientListPage() {
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
        if (!user) return; // Wait for user to be loaded
        if (role === 'Patient') {
            fetchMyProfile();
        } else {
            fetchPatients();
        }
    }, [role, user]);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            const data = await patientService.getAllPatients();
            console.log('Fetched Patients:', data);
            setPatients(data.patients || []);
            setError(null);
        } catch (err) {
            console.error('Fetch Patients Error:', err);
            setError('Failed to load patients. Please ensure the patient-service is running.');
        } finally {
            setLoading(false);
        }
    };

    const fetchMyProfile = async () => {
        try {
            setLoading(true);
            const data = await patientService.getMyProfile();
            console.log('Fetched My Profile:', data);

            // Backend returns profile directly or wrapped? 
            // Based on backend/patient-service/src/controllers/patientController.js:75: res.status(200).json(profile);
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
                setPatients([]); // No profile found, show empty state
                setError(null);
            } else {
                setError('Failed to load your profile. Please ensure the patient-service is running.');
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
        if (!selectedPatient || !window.confirm('Are you sure you want to delete this patient profile?')) return;
        try {
            await patientService.deletePatient(selectedPatient.id);
            setPatients(prev => prev.filter(p => p.id !== selectedPatient.id));
            handleMenuClose();
            alert('Patient profile deleted successfully!');
        } catch (err) {
            alert('Failed to delete patient profile');
        }
    };

    const filteredPatients = patients.filter(p =>
        p && (p.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.phone?.includes(searchQuery))
    );

    return (
        <div className="flex flex-col gap-6">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Typography variant="h5" fontWeight={800} color="text.primary">
                        {role === 'Patient' ? 'My Medical Profile' : 'Patient Management'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {isStaff ? 'List of all registered clinic patients' : isDoctor ? 'Patients currently under your care' : 'View and update your personal health record'}
                    </Typography>
                </div>
                {isStaff && (
                    <Button
                        variant="contained"
                        startIcon={<Plus size={18} />}
                        sx={{ borderRadius: 3 }}
                        onClick={() => setAddModalOpen(true)}
                    >
                        Register New Patient
                    </Button>
                )}
            </div>

            {/* ── Search & Filters ── */}
            {role !== 'Patient' && (
                <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
                    <CardContent className="flex items-center gap-3 p-3 px-5">
                        <Search size={20} className="text-slate-400" />
                        <InputBase
                            placeholder="Search by name, phone or ID..."
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
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 5,
                                    overflow: 'hidden',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                                        borderColor: '#3b82f6'
                                    }
                                }}
                            >
                                <CardContent className="p-0">
                                    <div className="p-5 flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <Avatar
                                                src={pt.profilePhoto}
                                                sx={{ width: 60, height: 60, borderRadius: 3, bgcolor: '#eff6ff', color: '#3b82f6' }}
                                            >
                                                <UserCircle size={32} />
                                            </Avatar>
                                            <div>
                                                <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                                                    {pt.fullName}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Heart size={12} className="text-red-500" /> Last visit: 2 days ago
                                                </Typography>
                                            </div>
                                        </div>
                                        {(role === 'Admin' || role === 'Receptionist' || role === 'Doctor' || (role === 'Patient' && pt.userId === user?.id)) && (
                                            <IconButton size="small" onClick={(e) => handleMenuOpen(e, pt)}>
                                                <MoreHorizontal size={20} />
                                            </IconButton>
                                        )}
                                    </div>

                                    <div className="px-5 pb-5 grid grid-cols-2 gap-3">
                                        <div className="rounded-2xl bg-slate-50 p-2.5 px-3">
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                Phone
                                            </Typography>
                                            <Typography variant="body2" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Phone size={14} className="text-slate-400" /> {pt.phone || 'N/A'}
                                            </Typography>
                                        </div>
                                        <div className="rounded-2xl bg-slate-50 p-2.5 px-3">
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                Blood Group
                                            </Typography>
                                            <Typography variant="body2" fontWeight={700} color="error.main">
                                                {pt.bloodGroup || 'Not set'}
                                            </Typography>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex gap-2">
                                        <Button
                                            fullWidth
                                            size="small"
                                            variant="outlined"
                                            startIcon={<FileText size={14} />}
                                            sx={{ borderRadius: 2, textTransform: 'none', backgroundColor: 'white' }}
                                            onClick={() => navigate(`/emr?patientId=${pt.id}`)}
                                        >
                                            Medical Records
                                        </Button>
                                        <Button
                                            fullWidth
                                            size="small"
                                            variant="outlined"
                                            startIcon={<Calendar size={14} />}
                                            sx={{ borderRadius: 2, textTransform: 'none', backgroundColor: 'white' }}
                                            onClick={() => navigate(`/appointments?patientId=${pt.id}`)}
                                        >
                                            Book Visit
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
                            {role === 'Patient' ? (
                                <>
                                    <AlertCircle size={64} strokeWidth={1} className="text-blue-200" />
                                    <div className="text-center">
                                        <Typography variant="h6" fontWeight={700} color="text.primary">Profile Not Found</Typography>
                                        <Typography variant="body2" sx={{ maxWidth: 400, mt: 1 }}>
                                            It looks like your medical profile hasn't been set up yet.
                                            Please contact the clinic reception to complete your registration.
                                        </Typography>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Users size={64} strokeWidth={1} />
                                    <Typography variant="h6" fontWeight={700}>No Patients Found</Typography>
                                    <Typography variant="body2">Try adjusting your search criteria.</Typography>
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
                PaperProps={{ sx: { borderRadius: 3, width: 180, mt: 1, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' } }}
            >
                <MenuItem onClick={() => { setEditModalOpen(true); handleMenuClose(); }} sx={{ gap: 1.5, py: 1.2 }}>
                    <Edit size={16} className="text-blue-500" />
                    <span className="text-sm font-medium">Edit Profile</span>
                </MenuItem>
                {role === 'Admin' && (
                    <MenuItem onClick={handleDelete} sx={{ gap: 1.5, py: 1.2 }}>
                        <Trash2 size={16} className="text-red-500" />
                        <span className="text-sm font-medium text-red-500">Delete Profile</span>
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
    );
}
