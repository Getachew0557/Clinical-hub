import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  Stethoscope, Menu, X, Star, Heart, Shield, Activity,
  Eye, Baby, ChevronRight, ArrowRight, MapPin, Phone,
  Mail, Instagram, Facebook, Twitter, ChevronDown, AlertCircle,
  RefreshCw, Zap, FileText, Network, Calendar, Building2, Sparkles, Bot, Sun, Moon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { CircularProgress, Box, Typography, Button, useTheme, IconButton, Tooltip } from '@mui/material';
import { useColorMode } from '../context/ThemeContext';
import doctorService from '../api/doctor.service';
import hospitalService from '../api/hospital.service';
import heroImg from '../assets/clinic-hero.png';
import AIAssistant from '../components/common/AIAssistant';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { getDoctorPhotoUrl, cn } from '../utils/cn';

// ─── Data ────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { key: 'nav.home', href: '#' },
  { key: 'nav.about', href: '#about' },
  { key: 'nav.doctors', href: '#doctors' },
  { key: 'nav.services', href: '#services' },
];

const STATS_CONFIG = [
  { labelKey: 'stats.patients', value: 15000, suffix: '+' },
  { labelKey: 'stats.doctors', value: 24, suffix: '' },
  { labelKey: 'stats.locations', value: 5, suffix: '' },
  { labelKey: 'stats.years', value: 12, suffix: '' },
];

const SERVICES_CONFIG = [
  { icon: Heart, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/40', titleKey: 'services.generalMedicine', descKey: 'services.generalMedicineDesc' },
  { icon: Baby, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/30', titleKey: 'services.pediatrics', descKey: 'services.pediatricsDesc' },
  { icon: Shield, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/30', titleKey: 'services.gynecology', descKey: 'services.gynecologyDesc' },
  { icon: Activity, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/30', titleKey: 'services.surgery', descKey: 'services.surgeryDesc' },
  { icon: Star, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/30', titleKey: 'services.dermatology', descKey: 'services.dermatologyDesc' },
  { icon: Eye, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/30', titleKey: 'services.ophthalmology', descKey: 'services.ophthalmologyDesc' },
];

const SPECIALTY_OPTIONS = [
  'All Specialties',
  'General Medicine',
  'Pediatrics',
  'Gynecology & Obstetrics',
  'Surgery',
  'Dermatology',
  'Ophthalmology',
  'Cardiology',
  'Orthopedics',
  'Psychiatry',
];

const HOW_IT_WORKS_CONFIG = [
  { step: '01', titleKey: 'howItWorks.step1Title', descKey: 'howItWorks.step1Desc' },
  { step: '02', titleKey: 'howItWorks.step2Title', descKey: 'howItWorks.step2Desc' },
  { step: '03', titleKey: 'howItWorks.step3Title', descKey: 'howItWorks.step3Desc' },
];

const FAQS_CONFIG = [
  { qKey: 'faq.q1', aKey: 'faq.a1' },
  { qKey: 'faq.q2', aKey: 'faq.a2' },
  { qKey: 'faq.q3', aKey: 'faq.a3' },
  { qKey: 'faq.q4', aKey: 'faq.a4' },
  { qKey: 'faq.q5', aKey: 'faq.a5' },
  { qKey: 'faq.q6', aKey: 'faq.a6' },
  { qKey: 'faq.q7', aKey: 'faq.a7' },
];

const TESTIMONIALS = [
  {
    name: 'Tigist Haile',
    role: 'Mother of 2',
    text: 'The pediatric team at Biruh Tena is exceptional. My children always feel safe and cared for.',
    rating: 5,
    initial: 'T',
  },
  {
    name: 'Dawit Bekele',
    role: 'Software Engineer',
    text: 'Booked my appointment online in minutes. The doctors are professional and thorough.',
    rating: 5,
    initial: 'D',
  },
  {
    name: 'Meron Tadesse',
    role: 'Teacher',
    text: 'The gynecology department gave me the best care I have ever received. Highly recommended.',
    rating: 5,
    initial: 'M',
  },
  {
    name: 'Yonas Girma',
    role: 'Business Owner',
    text: 'Fast, efficient, and compassionate. Biruh Tena has changed how I think about healthcare.',
    rating: 5,
    initial: 'Y',
  },
  {
    name: 'Selam Alemu',
    role: 'Nurse',
    text: "As a healthcare professional myself, I trust Biruh Tena for my own family's care.",
    rating: 5,
    initial: 'S',
  },
];

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedCounter({ value, suffix }) {
  const ref = useRef(null);
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v).toLocaleString());
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const controls = animate(motionValue, value, { duration: 2, ease: 'easeOut' });
      return controls.stop;
    }
  }, [isInView, motionValue, value]);

  return (
    <span ref={ref} className="tabular-nums">
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-700" />
      <div className="p-6 space-y-3">
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl mt-4" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { t } = useTranslation();
  const { toggleColorMode } = useColorMode();
  const muiTheme = useTheme();
  const isDarkMode = muiTheme.palette.mode === 'dark';

  // NavBar state
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Doctor search state
  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [doctorError, setDoctorError] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);

  // FAQ state
  const [openFaq, setOpenFaq] = useState(null);

  // Doctors show-more state
  const [showAllDoctors, setShowAllDoctors] = useState(false);

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchDoctors('', '');
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      setLoadingHospitals(true);
      const data = await hospitalService.getAllHospitals();
      // Ensure Tikur Anbesa is present
      const hasTikur = data.some(h => h.name.toLowerCase().includes('tikur'));
      if (!hasTikur) {
          data.unshift({
              id: 'tikur-anbesa-id',
              name: 'Tikur Anbesa Specialized Hospital',
              address: 'Addis Ababa, Ethiopia',
              description: 'The largest specialized referral hospital in Ethiopia, providing advanced dental and medical care.',
              isActive: true,
              logo: null
          });
      }
      setHospitals(data);
    } catch (err) {
      console.error('Fetch hospitals error:', err);
    } finally {
      setLoadingHospitals(false);
    }
  };

  const fetchDoctors = useCallback(async (searchVal, specialtyVal) => {
    try {
      setLoadingDoctors(true);
      setDoctorError(null);
      const params = {
        search: searchVal,
        specialty: specialtyVal === 'All Specialties' ? '' : specialtyVal,
      };
      const data = await doctorService.getPublicDoctors(params);
      setDoctors(data.doctors || data.records || []);
    } catch (err) {
      console.error('Fetch doctors error:', err);
      setDoctorError(t('doctors.error'));
    } finally {
      setLoadingDoctors(false);
    }
  }, []);

  // Debounced search
  const debounceRef = useRef(null);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchDoctors(val, specialty);
    }, 300);
  };

  const handleSpecialtyChange = (e) => {
    const val = e.target.value;
    setSpecialty(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchDoctors(query, val);
    }, 300);
  };

  const handleBookingClick = (doctorId) => {
    if (user) {
      navigate(`/book/${doctorId}`);
    } else {
      navigate(`/login?redirect=/book/${doctorId}`);
    }
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden selection:bg-teal-100 selection:text-teal-700 transition-colors duration-500">

      {/* ══════════════════════════════════════════════════════════════
          1. NAVBAR
      ══════════════════════════════════════════════════════════════ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
          isScrolled 
            ? 'backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 shadow-sm py-3' 
            : 'py-5 bg-transparent border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-600/20">
              <Stethoscope className="text-white w-6 h-6" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                Biruh Tena
              </span>
              <span className="font-ethiopic text-xs text-teal-600 dark:text-teal-400">ብሩህ ጤና</span>
            </div>
          </motion.div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            <div className="flex items-center gap-8 mr-4">
              {NAV_LINKS.map((link, i) => (
                <motion.a
                  key={link.key}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  href={link.href}
                  className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                >
                  {t(link.key)}
                </motion.a>
              ))}
            </div>
            <div className="flex items-center gap-4 border-l border-slate-200 dark:border-slate-800 pl-8">
              {/* Theme Toggle */}
              <Tooltip title={isDarkMode ? "Light Mode" : "Dark Mode"}>
                <IconButton
                  onClick={toggleColorMode}
                  size="small"
                  sx={{
                    color: isDarkMode ? '#ffffff' : '#64748b',
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'transparent',
                    '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.06)' },
                  }}
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </IconButton>
              </Tooltip>
              
              <LanguageSwitcher />
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className="bg-teal-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20"
              >
                {t('nav.patientPortal')}
              </motion.button>
            </div>
          </div>

          {/* Mobile Toggle */}
          <button
            className="lg:hidden text-slate-900 dark:text-white p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden glass dark:bg-slate-900/90 flex flex-col items-center justify-center gap-8"
          >
            <button
              className="absolute top-5 right-6 text-slate-900 dark:text-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X size={28} />
            </button>
            {NAV_LINKS.map((link) => (
              <a
                key={link.key}
                href={link.href}
                className="text-2xl font-bold text-slate-900 dark:text-white hover:text-teal-600 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t(link.key)}
              </a>
            ))}
            <LanguageSwitcher variant="dark" />
            
            {/* Mobile Theme Toggle */}
            <div className="flex items-center gap-2 px-6 py-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                <Sun size={20} className={isDarkMode ? 'text-slate-400' : 'text-amber-500'} />
                <button 
                    onClick={toggleColorMode}
                    className="relative w-12 h-6 rounded-full bg-slate-300 dark:bg-slate-600 transition-colors"
                >
                    <div className={cn(
                        "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300",
                        isDarkMode ? "translate-x-6" : "translate-x-0"
                    )} />
                </button>
                <Moon size={20} className={isDarkMode ? 'text-indigo-400' : 'text-slate-400'} />
            </div>
            <button
              onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}
              className="bg-teal-600 text-white px-10 py-4 rounded-2xl text-lg font-bold shadow-xl shadow-teal-600/30"
            >
              {t('nav.patientPortal')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════
          2. HERO SECTION
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-teal-100/60 dark:bg-teal-900/30 blur-[120px]"
          />
          <motion.div
            animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-amber-100/50 dark:bg-amber-900/20 blur-[120px]"
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-2 rounded-full bg-teal-50 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 text-xs font-bold uppercase tracking-widest mb-6 border border-teal-100 dark:border-teal-800">
              {t('hero.badge')}
            </span>
            <h1 className="text-4xl lg:text-5xl font-black leading-[1.1] mb-6 text-slate-900 dark:text-white">
              Your Health,{' '}
              <br className="hidden sm:block" />
              Our Mission.{' '}
              <span className="text-gradient">Biruh Tena.</span>
            </h1>
            <p className="text-base text-slate-500 dark:text-slate-400 max-w-lg mb-8 font-medium leading-relaxed">
              {t('hero.subtext')}
            </p>
            <div className="flex flex-wrap gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollTo('doctors')}
                className="bg-teal-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-teal-600/25 hover:bg-teal-700 transition-all group"
              >
                {t('hero.bookBtn')}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <button
                onClick={() => scrollTo('about')}
                className="px-8 py-4 rounded-2xl font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-all"
              >
                {t('hero.learnBtn')}
              </button>
            </div>
          </motion.div>

          {/* Right — Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="relative"
          >
            <div className="relative rounded-[3rem] overflow-hidden shadow-2xl shadow-teal-900/10 aspect-[4/3]">
              <img
                src={heroImg}
                alt="Biruh Tena Clinic"
                className="w-full h-full object-cover scale-105 hover:scale-100 transition-transform duration-[2s]"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-teal-950/10 to-transparent" />
            </div>

            {/* Rating badge */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-6 -right-4 glass p-4 rounded-2xl shadow-xl hidden lg:flex items-center gap-3"
            >
              <div className="p-2 bg-amber-100 text-amber-500 rounded-xl">
                <Star size={20} strokeWidth={2.5} className="fill-amber-400" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">{t('hero.rating')}</p>
                <p className="text-xs text-slate-500">{t('hero.ratingReviews')}</p>
              </div>
            </motion.div>

            {/* Available Now pill */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-4 -left-4 glass px-5 py-3 rounded-2xl shadow-xl hidden lg:flex items-center gap-2"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-bold text-slate-900">{t('hero.availableNow')}</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          3. STATS BAR
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ backgroundColor: '#0d4f4a' }} className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
            {STATS_CONFIG.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col gap-1"
              >
                <span className="text-4xl lg:text-5xl font-black text-white tracking-tight">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </span>
                <span className="text-teal-300 text-xs font-bold uppercase tracking-widest">{t(stat.labelKey)}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          4. SERVICES GRID
      ══════════════════════════════════════════════════════════════ */}
      <section id="services" className="py-24 lg:py-32 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-teal-600 dark:text-teal-400 text-xs font-bold uppercase tracking-widest mb-3 block">
              {t('services.label')}
            </span>
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mb-4">
              {t('services.heading')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed">
              {t('services.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES_CONFIG.map((svc, i) => {
              const Icon = svc.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="group p-8 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 hover:border-teal-300 dark:hover:border-teal-600/60 hover:shadow-xl hover:shadow-teal-600/10 hover:-translate-y-1.5 transition-all duration-300"
                >
                  <div className={`w-14 h-14 rounded-2xl ${svc.bg} shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`${svc.color} w-7 h-7`} />
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">{t(svc.titleKey)}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-5">{t(svc.descKey)}</p>
                  <button className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-sm font-bold hover:gap-3 transition-all group-hover:text-teal-700 dark:group-hover:text-teal-300">
                    {t('services.learnMore')} <ChevronRight size={16} />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── AI INNOVATION SECTION ── */}
      <section className="py-24 relative overflow-hidden bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-[3rem] bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center p-12 border-2 border-teal-100 dark:border-teal-800 shadow-2xl shadow-teal-600/5">
                <Box className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 border-4 border-dashed border-teal-200 rounded-full"
                  />
                  <div className="w-48 h-48 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-inner relative z-10">
                    <Sparkles size={80} className="text-teal-600" />
                  </div>
                </Box>
              </div>
              
              {/* Floating feature pills */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-6 -right-6 glass p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-teal-100"
              >
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600">
                  <Bot size={20} />
                </div>
                <div>
                  <Typography variant="caption" fontWeight={800} sx={{ display: 'block' }}>RAG-POWERED AI</Typography>
                  <Typography variant="body2" color="text.secondary">Full Clinical Context</Typography>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-teal-600 text-xs font-bold uppercase tracking-widest mb-3 block">
                Next-Gen Healthcare
              </span>
              <h2 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                AI-Driven Clinical <br />
                <span className="text-teal-600">Decision Support</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed mb-8">
                Our system integrates advanced Google Gemini AI to assist both patients and clinical staff. 
                With full context of the medical environment, our AI agent provides real-time guidance, 
                treatment suggestions, and automated clinical workflows.
              </p>
              
              <ul className="space-y-4 mb-10">
                {[
                  { icon: Zap, text: 'Instant Treatment Plan Suggestions' },
                  { icon: Network, text: 'Full System Context Awareness' },
                  { icon: Building2, text: '24/7 Intelligent Patient Guidance' },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-600">
                      <item.icon size={14} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.text}</span>
                  </li>
                ))}
              </ul>

              <Button 
                variant="contained" 
                onClick={() => navigate('/register')}
                sx={{ 
                  borderRadius: 3, 
                  px: 4, 
                  py: 1.5, 
                  bgcolor: '#0d9488', 
                  fontWeight: 800,
                  boxShadow: '0 10px 20px rgba(13, 148, 136, 0.2)'
                }}
              >
                Experience AI Healthcare
              </Button>
            </motion.div>
          </div>
        </div>
      </section>
      <section id="doctors" className="py-28 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-teal-600 text-xs font-bold uppercase tracking-widest mb-3 block">
              {t('doctors.label')}
            </span>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-4">
              {t('doctors.heading')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              {t('doctors.description')}
            </p>
          </div>

          {/* Search Controls */}
          <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto mb-12">
            <input
              type="text"
              value={query}
              onChange={handleQueryChange}
              placeholder={t('doctors.searchPlaceholder')}
              className="flex-1 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
            />
            <select
              value={specialty}
              onChange={handleSpecialtyChange}
              className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all bg-white dark:bg-slate-800"
            >
              {SPECIALTY_OPTIONS.map((opt) => (
                <option key={opt} value={opt === 'All Specialties' ? '' : opt}>
                  {opt === 'All Specialties' ? t('doctors.allSpecialties') : opt}
                </option>
              ))}
            </select>
          </div>

          {/* Loading State */}
          {loadingDoctors && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {/* Error State */}
          {!loadingDoctors && doctorError && (
            <div className="flex flex-col items-center gap-4 py-16">
              <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-2xl">
                <AlertCircle size={20} />
                <span className="text-sm font-medium">{doctorError}</span>
              </div>
              <button
                onClick={() => fetchDoctors(query, specialty)}
                className="flex items-center gap-2 text-teal-600 font-bold text-sm hover:text-teal-700 transition-colors"
              >
                <RefreshCw size={16} /> {t('doctors.retry')}
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loadingDoctors && !doctorError && doctors.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="text-slate-400 w-8 h-8" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">{t('doctors.noResults')}</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">{t('doctors.noResultsHint')}</p>
            </div>
          )}

          {/* Doctor Cards */}
          {!loadingDoctors && !doctorError && doctors.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(showAllDoctors ? doctors : doctors.slice(0, 3)).map((doc, i) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="group rounded-3xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden hover:-translate-y-2 hover:border-teal-200 dark:hover:border-teal-600 hover:shadow-2xl hover:shadow-teal-600/8 transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(`/doctor/${doc.id}`)}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    {getDoctorPhotoUrl(doc.profilePhoto) ? (
                      <img
                        src={getDoctorPhotoUrl(doc.profilePhoto)}
                        alt={doc.fullName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-teal-100">
                        <span className="text-6xl font-black text-teal-300">
                          {doc.fullName?.charAt(0) || 'D'}
                        </span>
                      </div>
                    )}
                    <div className="absolute top-4 right-4 glass px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md">
                      <Star size={14} className="text-amber-400 fill-amber-400" />
                      <span className="text-xs font-black text-slate-900">{doc.rating || '5.0'}</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">{doc.fullName}</h3>
                        <p className="text-teal-600 text-sm font-semibold mt-0.5">{doc.specialization}</p>
                        <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-1 flex items-center gap-1">
                          <Building2 size={12} />
                          {doc.hospitals && doc.hospitals.length > 0 ? doc.hospitals.join(', ') : 'Addis Ababa Clinic'}
                        </p>
                      </div>
                      <span className="shrink-0 px-2.5 py-1 bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 text-xs font-bold rounded-lg border border-teal-100 dark:border-teal-800">
                        {doc.experience || '5'}+ yrs
                      </span>
                    </div>
                    {doc.reviewsCount > 0 && (
                      <p className="text-slate-400 dark:text-slate-500 text-xs mb-4">{doc.reviewsCount} reviews</p>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/doctor/${doc.id}`); }}
                      className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700 transition-all shadow-md shadow-teal-600/15 hover:shadow-teal-600/25"
                    >
                      View Profile & Book
                    </button>
                  </div>
                </motion.div>
                ))}
              </div>

              {/* See More / Show Less */}
              {doctors.length > 3 && (
                <div className="flex justify-center mt-10">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowAllDoctors(!showAllDoctors)}
                    className="flex items-center gap-2 px-8 py-3.5 rounded-2xl border-2 border-teal-600 text-teal-600 font-bold text-sm hover:bg-teal-600 hover:text-white transition-all"
                  >
                    {showAllDoctors ? (
                      <>Show Less</>
                    ) : (
                      <>See All {doctors.length} Doctors</>
                    )}
                  </motion.button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          6. HOW IT WORKS
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 relative overflow-hidden transition-colors duration-300" style={{ background: 'linear-gradient(135deg, #f0fdfa 0%, #f8fafc 50%, #f0f9ff 100%)' }}>
        <div className="absolute inset-0 dark:opacity-0 opacity-100 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-teal-100/60 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-sky-100/60 blur-[100px]" />
        </div>
        <div className="absolute inset-0 dark:bg-slate-950/95 opacity-0 dark:opacity-100 transition-opacity duration-300 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-teal-600 dark:text-teal-400 text-xs font-bold uppercase tracking-widest mb-3 block">
              {t('howItWorks.label') || 'Simple Process'}
            </span>
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mb-4">
              {t('howItWorks.heading')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base">
              {t('howItWorks.subtext') || 'Get the care you need in three easy steps'}
            </p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Connecting line on desktop */}
            <div className="hidden md:block absolute top-16 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-0.5 bg-gradient-to-r from-teal-200 via-teal-400 to-teal-200 dark:from-teal-800 dark:via-teal-600 dark:to-teal-800 z-0" />

            {HOW_IT_WORKS_CONFIG.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="group relative z-10 flex flex-col items-center text-center p-8 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 hover:border-teal-300 dark:hover:border-teal-600/60 hover:shadow-2xl hover:shadow-teal-600/10 hover:-translate-y-2 transition-all duration-300"
              >
                {/* Step number circle */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center mb-6 shadow-lg shadow-teal-600/30 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl font-black text-white">{item.step}</span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-3">
                  {t(item.titleKey)}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  {t(item.descKey)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          7. VIDEO CONSULTATION BANNER
      ══════════════════════════════════════════════════════════════ */}
      <section id="video-consult" className="py-16 bg-teal-50 dark:bg-slate-900/50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-teal-600 to-teal-700 shadow-2xl shadow-teal-600/20"
          >
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 p-10 md:p-14">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-4">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  {t('videoConsult.banner.badge')} Available
                </div>
                <h2 className="text-2xl lg:text-3xl font-black text-white mb-3">{t('videoConsult.banner.heading')}</h2>
                <p className="text-teal-100 text-base mb-6 font-medium">{t('videoConsult.banner.subtext')}</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => scrollTo('doctors')}
                  className="inline-flex items-center gap-2 bg-white text-teal-700 px-8 py-4 rounded-2xl font-black text-sm hover:bg-teal-50 transition-all shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {t('videoConsult.banner.cta')}
                </motion.button>
              </div>
              <div className="hidden md:block w-64 shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1559839734-2b71f1e3c770?q=80&w=600&auto=format&fit=crop"
                  alt="Specialist Doctor"
                  className="w-full h-64 object-cover object-top rounded-2xl opacity-90"
                />
              </div>
            </div>
            {/* Decorative circles */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5" />
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          8. TESTIMONIALS (was 7)
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-teal-600 dark:text-teal-400 text-xs font-bold uppercase tracking-widest mb-3 block">
              {t('testimonials.label')}
            </span>
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white">
              {t('testimonials.heading')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.slice(0, 3).map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col gap-5 p-8 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 hover:border-teal-200 dark:hover:border-teal-600/60 hover:shadow-xl hover:shadow-teal-600/8 transition-all duration-300"
              >
                <div className="flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star key={j} size={16} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed flex-1">"{testimonial.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-black text-sm shadow-md shadow-teal-600/20">
                    {testimonial.initial}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{testimonial.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Extra testimonials row */}
          {TESTIMONIALS.length > 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {TESTIMONIALS.slice(3).map((testimonial, i) => (
                <motion.div
                  key={i + 3}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col gap-5 p-8 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 hover:border-teal-200 dark:hover:border-teal-600/60 hover:shadow-xl hover:shadow-teal-600/8 transition-all duration-300"
                >
                  <div className="flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, j) => (
                      <Star key={j} size={16} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed flex-1">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-black text-sm shadow-md shadow-teal-600/20">
                      {testimonial.initial}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{testimonial.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{testimonial.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          8. HOSPITAL NETWORK
      ══════════════════════════════════════════════════════════════ */}
      <section id="hospitals" className="py-24 lg:py-32 bg-white dark:bg-slate-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-teal-600 dark:text-teal-400 text-xs font-bold uppercase tracking-widest mb-3 block">
              {t('hospitals.network')}
            </span>
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mb-4">
              {t('hospitals.networkDesc')}
            </h2>
          </div>

          {loadingHospitals ? (
            <div className="flex justify-center py-12"><CircularProgress /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {hospitals.map((hosp, i) => (
                <motion.div
                  key={hosp.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 hover:border-teal-200 dark:hover:border-teal-600/60 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:shadow-teal-600/10 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    {hosp.logo ? (
                      <img src={getDoctorPhotoUrl(hosp.logo)} alt={hosp.name} className="w-9 h-9 object-contain" />
                    ) : (
                      <Building2 className="text-teal-600 w-7 h-7" />
                    )}
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2 leading-snug">{hosp.name}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2 leading-relaxed">{hosp.description || 'Modern clinical site equipped with the latest medical technology.'}</p>
                  <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs font-bold">
                    <MapPin size={13} /> {hosp.address || 'Addis Ababa, ET'}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          9. ABOUT TECH
      ══════════════════════════════════════════════════════════════ */}
      <section id="about" className="py-24 lg:py-32 bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl shadow-teal-900/10">
              <img
                src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=2070"
                alt="Clinical Technology"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-teal-600/10 blur-[100px] -z-10" />
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-teal-600 text-xs font-bold uppercase tracking-widest mb-4 block">
              Our Technology
            </span>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-8">
              Precision Meets Compassionate Care.
            </h2>
            <ul className="space-y-6">
              {[
                {
                  icon: Zap,
                  title: 'AI-Assisted Diagnostics',
                  desc: 'Our AI tools help doctors detect conditions earlier with greater accuracy.',
                },
                {
                  icon: FileText,
                  title: 'Digital Health Records',
                  desc: 'Secure, instant access to your complete medical history from anywhere.',
                },
                {
                  icon: Network,
                  title: 'Multi-Specialty Network',
                  desc: '12 specialties under one roof, coordinated for seamless patient care.',
                },
              ].map((li, i) => {
                const Icon = li.icon;
                return (
                  <li key={i} className="flex gap-5">
                    <div className="w-11 h-11 shrink-0 rounded-2xl bg-teal-50 dark:bg-teal-900/40 border border-teal-100 dark:border-teal-800 flex items-center justify-center">
                      <Icon className="text-teal-600 w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white mb-1">{li.title}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{li.desc}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          9. FAQ ACCORDION
      ══════════════════════════════════════════════════════════════ */}
      <section id="faq" className="py-24 lg:py-32 bg-white dark:bg-slate-900 transition-colors duration-300">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-teal-600 dark:text-teal-400 text-xs font-bold uppercase tracking-widest mb-3 block">
              {t('faq.label')}
            </span>
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white">
              {t('faq.heading')}
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS_CONFIG.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/80 overflow-hidden hover:border-teal-200 dark:hover:border-teal-700 transition-colors duration-200"
              >
                <button
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-bold text-slate-900 dark:text-white text-sm pr-4">{t(faq.qKey)}</span>
                  <motion.div
                    animate={{ rotate: openFaq === i ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0"
                  >
                    <ChevronDown size={18} className="text-teal-600 dark:text-teal-400" />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t(faq.aKey)}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          10. EMERGENCY BANNER
      ══════════════════════════════════════════════════════════════ */}
      <section id="emergency" className="py-16" style={{ background: 'linear-gradient(135deg, #dc2626, #f59e0b)' }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="w-4 h-4 rounded-full bg-white animate-pulse" />
            <div>
              <p className="text-white/80 text-sm font-bold uppercase tracking-widest">{t('emergency.label')}</p>
              <p className="text-2xl md:text-3xl text-white font-black">
                +251 911 22 33 44
              </p>
            </div>
          </div>
          <a
            href="tel:+251911223344"
            className="bg-white text-red-600 px-8 py-4 rounded-2xl font-black text-sm hover:bg-red-50 transition-all shadow-xl shadow-red-900/20 flex items-center gap-2"
          >
            <Phone size={18} /> {t('emergency.callBtn')}
          </a>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          CTA SECTION — before footer
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/3 blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-bold px-4 py-2 rounded-full mb-6 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Accepting New Patients
            </span>
            <h2 className="text-3xl lg:text-5xl font-black text-white mb-6 leading-tight">
              Ready to take control<br />of your health?
            </h2>
            <p className="text-teal-100 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Join thousands of patients who trust Biruh Tena for world-class medical care. Book your first appointment today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/register')}
                className="bg-white text-teal-700 px-10 py-4 rounded-2xl font-black text-sm hover:bg-teal-50 transition-all shadow-xl shadow-teal-900/20 flex items-center justify-center gap-2"
              >
                Get Started Free <ArrowRight size={18} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollTo('doctors')}
                className="bg-white/10 border border-white/30 text-white px-10 py-4 rounded-2xl font-black text-sm hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                Browse Doctors
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          11. FOOTER
      ══════════════════════════════════════════════════════════════ */}
      <footer id="contact" style={{ backgroundColor: '#0a2540' }} className="pt-20 pb-10 rounded-t-[3rem]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
            {/* Col 1 — Brand (span 4) */}
            <div className="lg:col-span-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-900/40">
                  <Stethoscope className="text-white w-6 h-6" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-xl font-bold text-white">Biruh Tena</span>
                  <span className="font-ethiopic text-xs text-teal-400">ብሩህ ጤና</span>
                </div>
              </div>
              <p className="text-white/50 text-sm leading-relaxed max-w-xs mb-8">
                {t('footer.tagline')}
              </p>
              <div className="flex gap-3 mb-8">
                {[Instagram, Facebook, Twitter].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-teal-600 hover:border-teal-600 text-white/50 hover:text-white transition-all duration-200"
                  >
                    <Icon size={17} />
                  </a>
                ))}
              </div>
              <button
                onClick={() => navigate('/login')}
                className="bg-teal-600 text-white px-7 py-3 rounded-xl font-bold text-sm hover:bg-teal-500 transition-all flex items-center gap-2 shadow-lg shadow-teal-900/30"
              >
                {t('footer.getStarted')} <ChevronRight size={15} />
              </button>
            </div>

            {/* Col 2 — Quick Links (span 2) */}
            <div className="lg:col-span-2">
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-6">{t('footer.quickLinks')}</p>
              <ul className="space-y-3">
                {[
                  { label: 'nav.services', href: '#services' },
                  { label: 'nav.doctors', href: '#doctors' },
                  { label: 'nav.about', href: '#about' },
                  { label: 'nav.faq', href: '#faq' },
                  { label: 'nav.patientPortal', href: '/login' },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-white/50 text-sm hover:text-teal-400 transition-colors"
                    >
                      {t(link.label)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3 — Services (span 3) */}
            <div className="lg:col-span-3">
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-6">{t('services.label')}</p>
              <ul className="space-y-3">
                {SERVICES_CONFIG.slice(0, 5).map((svc) => (
                  <li key={svc.titleKey}>
                    <a href="#services" className="text-white/50 text-sm hover:text-teal-400 transition-colors">
                      {t(svc.titleKey)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4 — Contact (span 3) */}
            <div className="lg:col-span-3">
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-6">{t('footer.contact')}</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3 text-white/60 text-sm">
                  <MapPin size={15} className="text-teal-400 mt-0.5 shrink-0" />
                  Bole 12, Addis Ababa, ET
                </li>
                <li className="flex items-center gap-3 text-white/60 text-sm">
                  <Phone size={15} className="text-teal-400 shrink-0" />
                  +251 911 22 33 44
                </li>
                <li className="flex items-center gap-3 text-white/60 text-sm">
                  <Mail size={15} className="text-teal-400 shrink-0" />
                  hello@biruhtena.et
                </li>
              </ul>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">Emergency</p>
                <a href="tel:+251911223344" className="text-white font-black text-lg hover:text-teal-400 transition-colors">
                  +251 911 22 33 44
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between gap-4 items-center">
            <p className="text-white/30 text-xs">
              {t('footer.copyright')}
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-white/30 text-xs hover:text-white/60 transition-colors">{t('footer.privacyPolicy')}</a>
              <a href="#" className="text-white/30 text-xs hover:text-white/60 transition-colors">{t('footer.termsOfService')}</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── AI Assistant ── */}
      <AIAssistant />
    </div>
  );
}

