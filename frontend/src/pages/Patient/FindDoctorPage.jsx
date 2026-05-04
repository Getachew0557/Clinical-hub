/**
 * FindDoctorPage — Patient-facing doctor discovery
 * Shows all active doctors with their specialization, availability,
 * consultation types (clinic/video), fees, and a direct "Book" button.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Star, Clock, Video, Home, ChevronRight,
    Stethoscope, Calendar, Filter, X
} from 'lucide-react';
import {
    Typography, Card, CardContent, Box, CircularProgress,
    Alert, Chip, Avatar, Button
} from '@mui/material';
import doctorService from '../../api/doctor.service';
import { getDoctorPhotoUrl } from '../../utils/cn';

const VISIT_TYPES = [
    { val: 'all',    label: 'All Types' },
    { val: 'clinic', label: '🏥 Clinic Visit' },
    { val: 'video',  label: '📹 Video Call' },
];

export default function FindDoctorPage() {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [specFilter, setSpecFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('all');

    useEffect(() => { fetchDoctors(); }, []);

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            const data = await doctorService.getPublicDoctors();
            const list = data.doctors || data.records || (Array.isArray(data) ? data : []);
            setDoctors(list.filter(d => d.isActive !== false));
            setError(null);
        } catch (err) {
            setError('Unable to load doctors. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Build specialization list dynamically from actual doctors
    const specializations = ['All', ...new Set(doctors.map(d => d.specialization).filter(Boolean))].sort((a, b) => a === 'All' ? -1 : a.localeCompare(b));

    const parseTypes = (d) => {
        if (!d.serviceTypes) return ['clinic', 'video'];
        if (Array.isArray(d.serviceTypes)) return d.serviceTypes;
        try { return JSON.parse(d.serviceTypes); } catch { return ['clinic', 'video']; }
    };

    const parseWorkingDays = (d) => {
        if (!d.workingDays) return [];
        if (Array.isArray(d.workingDays)) return d.workingDays;
        try { return JSON.parse(d.workingDays); } catch { return []; }
    };

    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    const filtered = doctors.filter(d => {
        const q = search.toLowerCase();
        const matchSearch = !q ||
            d.fullName?.toLowerCase().includes(q) ||
            d.specialization?.toLowerCase().includes(q) ||
            d.bio?.toLowerCase().includes(q);
        const matchSpec = specFilter === 'All' || d.specialization === specFilter;
        const types = parseTypes(d);
        const matchType = typeFilter === 'all' || types.includes(typeFilter);
        return matchSearch && matchSpec && matchType;
    });

    return (
        <Box sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, lg: 4 }, pb: 8 }}>
            <div className="flex flex-col gap-6">

                {/* Header */}
                <div>
                    <Typography variant="h5" fontWeight={700} color="text.primary">Find a Doctor</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                        Browse available specialists and book your appointment instantly
                    </Typography>
                </div>

                {/* Search + Filters */}
                <div className="flex flex-col gap-3">
                    {/* Search bar */}
                    <div className="flex items-center gap-3 rounded-2xl bg-white border border-slate-200 px-4 py-3 shadow-sm focus-within:border-teal-400 focus-within:shadow-teal-100 transition-all">
                        <Search size={20} className="text-slate-400 shrink-0" />
                        <input
                            placeholder="Search by name, specialization..."
                            className="flex-1 bg-transparent text-sm outline-none text-slate-800 placeholder-slate-400"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Visit type filter */}
                    <div className="flex gap-2 flex-wrap">
                        {VISIT_TYPES.map(t => (
                            <button
                                key={t.val}
                                onClick={() => setTypeFilter(t.val)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                                    typeFilter === t.val
                                        ? 'bg-teal-600 text-white border-teal-600'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Specialization chips — built from actual doctors */}
                    {specializations.length > 1 && (
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter by Specialty</span>
                            <div className="flex gap-2 flex-wrap">
                                {specializations.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setSpecFilter(s)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                            specFilter === s
                                                ? 'bg-teal-600 text-white border-teal-600'
                                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-teal-300'
                                        }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Results count */}
                {!loading && (
                    <Typography variant="body2" color="text.secondary">
                        {filtered.length} doctor{filtered.length !== 1 ? 's' : ''} found
                        {specFilter !== 'All' && ` · ${specFilter}`}
                        {typeFilter !== 'all' && ` · ${typeFilter === 'clinic' ? 'Clinic visits' : 'Video calls'}`}
                    </Typography>
                )}

                {error && <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>}

                {loading ? (
                    <div className="flex justify-center py-16"><CircularProgress size={36} /></div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
                        <Stethoscope size={48} strokeWidth={1} className="mb-3" />
                        <Typography variant="subtitle1" color="text.primary">No doctors found</Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>Try adjusting your search or filters</Typography>
                        <Button sx={{ mt: 2 }} onClick={() => { setSearch(''); setSpecFilter('All'); setTypeFilter('all'); }}>
                            Clear filters
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {filtered.map(doctor => {
                            const types = parseTypes(doctor);
                            const workingDays = parseWorkingDays(doctor);
                            const availableToday = workingDays.length === 0 || workingDays.includes(todayName);

                            return (
                                <Card
                                    key={doctor.id}
                                    elevation={0}
                                    sx={{
                                        border: '1px solid #e2e8f0',
                                        borderRadius: 4,
                                        overflow: 'hidden',
                                        transition: 'all 0.25s',
                                        '&:hover': {
                                            borderColor: '#0d9488',
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 12px 24px -8px rgba(13,148,136,0.15)'
                                        }
                                    }}
                                >
                                    <CardContent sx={{ p: 0 }}>
                                        {/* Top section */}
                                        <div className="p-5 flex items-start gap-4">
                                            <Avatar
                                                src={getDoctorPhotoUrl(doctor.profilePhoto)}
                                                sx={{
                                                    width: 72, height: 72, borderRadius: 3,
                                                    bgcolor: '#f0fdf4', color: '#16a34a',
                                                    fontWeight: 900, fontSize: '1.5rem',
                                                    flexShrink: 0
                                                }}
                                            >
                                                {doctor.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <Typography variant="subtitle1" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.3 }}>
                                                    {doctor.fullName}
                                                </Typography>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <Stethoscope size={12} className="text-teal-600" />
                                                    <Typography variant="caption" color="primary.main" fontWeight={600}>
                                                        {doctor.specialization}
                                                    </Typography>
                                                </div>
                                                {doctor.qualification && (
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                                                        {doctor.qualification}
                                                        {doctor.experience ? ` · ${doctor.experience}+ yrs` : ''}
                                                    </Typography>
                                                )}
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Star size={12} className="text-amber-400 fill-amber-400" />
                                                    <Typography variant="caption" fontWeight={700}>
                                                        {doctor.rating || '5.0'}
                                                    </Typography>
                                                    {doctor.reviewsCount > 0 && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            ({doctor.reviewsCount} reviews)
                                                        </Typography>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Availability strip */}
                                        <div className="px-5 pb-3 flex flex-wrap gap-2">
                                            {/* Availability today */}
                                            <Chip
                                                size="small"
                                                label={availableToday ? '✓ Available today' : 'Not available today'}
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: '0.7rem',
                                                    bgcolor: availableToday ? '#f0fdf4' : '#f8fafc',
                                                    color: availableToday ? '#15803d' : '#94a3b8',
                                                    border: `1px solid ${availableToday ? '#bbf7d0' : '#e2e8f0'}`
                                                }}
                                            />
                                            {/* Working hours */}
                                            {doctor.workingHoursStart && (
                                                <Chip
                                                    size="small"
                                                    icon={<Clock size={11} />}
                                                    label={`${doctor.workingHoursStart?.slice(0,5)} – ${doctor.workingHoursEnd?.slice(0,5)}`}
                                                    sx={{ fontWeight: 600, fontSize: '0.7rem', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}
                                                />
                                            )}
                                        </div>

                                        {/* Service types + fees */}
                                        <div className="px-5 pb-4 flex gap-2">
                                            {types.includes('clinic') && (
                                                <div className="flex-1 flex flex-col items-center gap-1 py-2.5 px-3 bg-amber-50 rounded-xl border border-amber-100">
                                                    <Home size={16} className="text-amber-600" />
                                                    <Typography variant="caption" fontWeight={700} sx={{ color: '#92400e' }}>Clinic</Typography>
                                                    <Typography variant="caption" sx={{ color: '#d97706', fontWeight: 800, fontSize: '0.7rem' }}>
                                                        {doctor.consultationFee ? `ETB ${doctor.consultationFee}` : 'ETB 500'}
                                                    </Typography>
                                                </div>
                                            )}
                                            {types.includes('video') && (
                                                <div className="flex-1 flex flex-col items-center gap-1 py-2.5 px-3 bg-teal-50 rounded-xl border border-teal-100">
                                                    <Video size={16} className="text-teal-600" />
                                                    <Typography variant="caption" fontWeight={700} sx={{ color: '#0f766e' }}>Video</Typography>
                                                    <Typography variant="caption" sx={{ color: '#0d9488', fontWeight: 800, fontSize: '0.7rem' }}>
                                                        {doctor.videoFee ? `ETB ${doctor.videoFee}` : doctor.consultationFee ? `ETB ${doctor.consultationFee}` : 'ETB 500'}
                                                    </Typography>
                                                </div>
                                            )}
                                        </div>

                                        {/* Working days */}
                                        {workingDays.length > 0 && (
                                            <div className="px-5 pb-3 flex gap-1 flex-wrap">
                                                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(short => {
                                                    const full = { Mon:'Monday',Tue:'Tuesday',Wed:'Wednesday',Thu:'Thursday',Fri:'Friday',Sat:'Saturday',Sun:'Sunday' }[short];
                                                    const active = workingDays.includes(full);
                                                    return (
                                                        <span key={short} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                            active ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-400'
                                                        }`}>
                                                            {short}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Bio snippet */}
                                        {doctor.bio && (
                                            <div className="px-5 pb-3">
                                                <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {doctor.bio}
                                                </Typography>
                                            </div>
                                        )}

                                        {/* CTA buttons */}
                                        <div className="px-4 pb-4 flex gap-2">
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                sx={{ flex: 1, borderRadius: 3, borderColor: '#e2e8f0', color: '#64748b', fontSize: '0.75rem' }}
                                                onClick={() => navigate(`/doctor/${doctor.id}`)}
                                            >
                                                View Profile
                                            </Button>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                endIcon={<ChevronRight size={14} />}
                                                sx={{ flex: 1, borderRadius: 3, fontSize: '0.75rem' }}
                                                onClick={() => navigate(`/book/${doctor.id}`)}
                                            >
                                                Book Now
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </Box>
    );
}
