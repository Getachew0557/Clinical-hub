import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  Stethoscope, Menu, X, Star, Heart, Shield, Activity,
  Eye, Baby, ChevronRight, ArrowRight, MapPin, Phone,
  Mail, Instagram, Facebook, Twitter, ChevronDown, AlertCircle,
  RefreshCw, Zap, FileText, Network, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import doctorService from '../api/doctor.service';
import heroImg from '../assets/clinic-hero.png';
import GeminiChatbot from '../components/common/GeminiChatbot';

// ─── Data ────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { name: 'Services', href: '#services' },
  { name: 'Doctors', href: '#doctors' },
  { name: 'About', href: '#about' },
  { name: 'FAQ', href: '#faq' },
  { name: 'Emergency', href: '#emergency' },
];

const STATS = [
  { label: 'Patients Served', value: 15000, suffix: '+' },
  { label: 'Expert Doctors', value: 24, suffix: '' },
  { label: 'Clinic Locations', value: 5, suffix: '' },
  { label: 'Years of Excellence', value: 12, suffix: '' },
];

const SERVICES = [
  {
    icon: Heart,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    title: 'General Medicine',
    desc: 'Comprehensive primary care and preventive medicine for patients of all ages.',
  },
  {
    icon: Baby,
    color: 'text-pink-500',
    bg: 'bg-pink-50',
    title: 'Pediatrics',
    desc: 'Specialized care for infants, children, and adolescents by expert pediatricians.',
  },
  {
    icon: Shield,
    color: 'text-purple-500',
    bg: 'bg-purple-50',
    title: 'Gynecology & Obstetrics',
    desc: "Complete women's health services from routine exams to maternity care.",
  },
  {
    icon: Activity,
    color: 'text-red-500',
    bg: 'bg-red-50',
    title: 'Surgery',
    desc: 'Advanced surgical procedures performed by board-certified surgeons.',
  },
  {
    icon: Star,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    title: 'Dermatology',
    desc: 'Expert diagnosis and treatment of skin, hair, and nail conditions.',
  },
  {
    icon: Eye,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    title: 'Ophthalmology',
    desc: 'Full-spectrum eye care from routine exams to complex surgical interventions.',
  },
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

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Register & Search',
    desc: 'Create your account and find the right specialist for your needs.',
  },
  {
    step: '02',
    title: 'Book Appointment',
    desc: 'Choose a convenient date and time slot that fits your schedule.',
  },
  {
    step: '03',
    title: 'Receive Care',
    desc: 'Visit our clinic and receive world-class clinical care.',
  },
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

const FAQS = [
  {
    q: 'How do I book an appointment?',
    a: 'You can book online through our Patient Portal or call our emergency line. Select your preferred doctor, choose a date and time, and confirm your booking.',
  },
  {
    q: 'Do you accept insurance?',
    a: 'Yes, we work with major Ethiopian insurance providers including CBE Birr, Awash Insurance, and Nyala Insurance. Contact us to verify your coverage.',
  },
  {
    q: 'What should I bring to my first visit?',
    a: 'Please bring a valid ID, your insurance card if applicable, and any previous medical records or test results relevant to your visit.',
  },
  {
    q: 'Is there emergency care available?',
    a: 'Yes, our emergency line (+251 911 22 33 44) is available 24/7. For life-threatening emergencies, please call immediately.',
  },
  {
    q: 'How can I access my medical records?',
    a: "Registered patients can access their complete medical records through the Patient Portal under 'My Records'.",
  },
  {
    q: 'What are your clinic hours?',
    a: 'Our clinics are open Monday–Friday 8AM–6PM and Saturday 9AM–2PM. Emergency services are available 24/7.',
  },
  {
    q: 'Can I reschedule or cancel my appointment?',
    a: 'Yes, you can reschedule or cancel up to 24 hours before your appointment through the Patient Portal or by calling us.',
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
    <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-slate-200" />
      <div className="p-6 space-y-3">
        <div className="h-5 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-200 rounded w-1/2" />
        <div className="h-4 bg-slate-200 rounded w-1/3" />
        <div className="h-10 bg-slate-200 rounded-xl mt-4" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // NavBar state
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Doctor search state
  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [doctorError, setDoctorError] = useState(null);

  // FAQ state
  const [openFaq, setOpenFaq] = useState(null);

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initial doctor fetch
  useEffect(() => {
    fetchDoctors('', '');
  }, []);

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
      setDoctorError('Unable to load doctors. Please try again.');
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
    <div className="min-h-screen bg-slate-50 overflow-x-hidden selection:bg-teal-100 selection:text-teal-700">

      {/* ══════════════════════════════════════════════════════════════
          1. NAVBAR
      ══════════════════════════════════════════════════════════════ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled ? 'backdrop-blur-md bg-white/70 shadow-sm py-3' : 'py-5 bg-transparent'
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
              <span
                className="text-xl text-slate-900"
                style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}
              >
                Biruh Tena
              </span>
              <span className="font-ethiopic text-xs text-teal-600">ብሩህ ጤና</span>
            </div>
          </motion.div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link, i) => (
              <motion.a
                key={link.name}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                href={link.href}
                className="text-sm font-semibold text-slate-600 hover:text-teal-600 transition-colors"
              >
                {link.name}
              </motion.a>
            ))}
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
              className="bg-teal-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20"
            >
              Patient Portal
            </motion.button>
          </div>

          {/* Mobile Toggle */}
          <button
            className="lg:hidden text-slate-900 p-2"
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
            className="fixed inset-0 z-40 lg:hidden glass flex flex-col items-center justify-center gap-8"
          >
            <button
              className="absolute top-5 right-6 text-slate-900"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X size={28} />
            </button>
            {NAV_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-2xl font-bold text-slate-900 hover:text-teal-600 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <button
              onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}
              className="bg-teal-600 text-white px-10 py-4 rounded-2xl text-lg font-bold shadow-xl shadow-teal-600/30"
            >
              Patient Portal
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
            className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-teal-100/60 blur-[120px]"
          />
          <motion.div
            animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-amber-100/50 blur-[120px]"
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-2 rounded-full bg-teal-50 text-teal-700 text-xs font-bold uppercase tracking-widest mb-6 border border-teal-100">
              Ethiopian Clinical Excellence
            </span>
            <h1
              className="leading-[1.1] mb-6 text-slate-900"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 900,
                fontSize: 'clamp(3rem, 7vw, 5.5rem)',
              }}
            >
              Your Health,{' '}
              <br className="hidden sm:block" />
              Our Mission.{' '}
              <span className="text-gradient">Biruh Tena.</span>
            </h1>
            <p className="text-base text-slate-500 max-w-lg mb-8 font-medium leading-relaxed">
              World-class multi-specialty clinical care, rooted in Ethiopian values. Book your appointment today.
            </p>
            <div className="flex flex-wrap gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollTo('doctors')}
                className="bg-teal-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-teal-600/25 hover:bg-teal-700 transition-all group"
              >
                Book Appointment
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <button
                onClick={() => scrollTo('about')}
                className="px-8 py-4 rounded-2xl font-bold text-slate-700 border border-slate-200 hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50 transition-all"
              >
                Learn More
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
                <p className="text-sm font-black text-slate-900">4.9 / 5 Rating</p>
                <p className="text-xs text-slate-500">From 2,000+ Reviews</p>
              </div>
            </motion.div>

            {/* Available Now pill */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-4 -left-4 glass px-5 py-3 rounded-2xl shadow-xl hidden lg:flex items-center gap-2"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-bold text-slate-900">Available Now</span>
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
            {STATS.map((stat, i) => (
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
                <span className="text-teal-300 text-xs font-bold uppercase tracking-widest">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          4. SERVICES GRID
      ══════════════════════════════════════════════════════════════ */}
      <section id="services" className="py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-teal-600 text-xs font-bold uppercase tracking-widest mb-3 block">
              Our Specialties
            </span>
            <h2
              className="text-slate-900 mb-4"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 700,
                fontSize: 'clamp(2rem, 4vw, 3.5rem)',
              }}
            >
              Specialized care for every patient.
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              From routine checkups to complex procedures, our specialists deliver excellence across every discipline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SERVICES.map((svc, i) => {
              const Icon = svc.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="group p-8 rounded-3xl bg-white border border-slate-100 hover:border-teal-400 hover:shadow-2xl hover:shadow-teal-600/8 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className={`w-14 h-14 rounded-2xl ${svc.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`${svc.color} w-7 h-7`} />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 mb-3">{svc.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-5">{svc.desc}</p>
                  <button className="flex items-center gap-2 text-teal-600 text-sm font-bold hover:gap-3 transition-all">
                    Learn More <ChevronRight size={16} />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          5. DOCTOR SEARCH SECTION
      ══════════════════════════════════════════════════════════════ */}
      <section id="doctors" className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-teal-600 text-xs font-bold uppercase tracking-widest mb-3 block">
              Meet Our Clinicians
            </span>
            <h2
              className="text-slate-900 mb-4"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 700,
                fontSize: 'clamp(2rem, 4vw, 3.5rem)',
              }}
            >
              Find the right specialist for you.
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Search by name or specialty to find the perfect doctor for your needs.
            </p>
          </div>

          {/* Search Controls */}
          <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto mb-12">
            <input
              type="text"
              value={query}
              onChange={handleQueryChange}
              placeholder="Search by name or specialty..."
              className="flex-1 px-5 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
            />
            <select
              value={specialty}
              onChange={handleSpecialtyChange}
              className="px-5 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all bg-white"
            >
              {SPECIALTY_OPTIONS.map((opt) => (
                <option key={opt} value={opt === 'All Specialties' ? '' : opt}>
                  {opt}
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
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl">
                <AlertCircle size={20} />
                <span className="text-sm font-medium">{doctorError}</span>
              </div>
              <button
                onClick={() => fetchDoctors(query, specialty)}
                className="flex items-center gap-2 text-teal-600 font-bold text-sm hover:text-teal-700 transition-colors"
              >
                <RefreshCw size={16} /> Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loadingDoctors && !doctorError && doctors.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="text-slate-400 w-8 h-8" />
              </div>
              <p className="text-slate-500 font-medium">No doctors found for your search.</p>
              <p className="text-slate-400 text-sm mt-1">Try a different name or specialty.</p>
            </div>
          )}

          {/* Doctor Cards */}
          {!loadingDoctors && !doctorError && doctors.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {doctors.slice(0, 6).map((doc, i) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="group rounded-3xl border border-slate-100 bg-white overflow-hidden hover:-translate-y-2 hover:border-teal-200 hover:shadow-2xl hover:shadow-teal-600/8 transition-all duration-300"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    {doc.profilePhoto ? (
                      <img
                        src={doc.profilePhoto}
                        alt={doc.fullName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-teal-100">
                        <span
                          className="text-6xl font-black text-teal-300"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
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
                        <h3 className="text-lg font-extrabold text-slate-900 leading-tight">{doc.fullName}</h3>
                        <p className="text-teal-600 text-sm font-semibold mt-0.5">{doc.specialization}</p>
                      </div>
                      <span className="shrink-0 px-2.5 py-1 bg-teal-50 text-teal-700 text-xs font-bold rounded-lg border border-teal-100">
                        {doc.experience || '5'}+ yrs
                      </span>
                    </div>
                    {doc.reviewsCount > 0 && (
                      <p className="text-slate-400 text-xs mb-4">{doc.reviewsCount} reviews</p>
                    )}
                    <button
                      onClick={() => handleBookingClick(doc.id)}
                      className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700 transition-all shadow-md shadow-teal-600/15 hover:shadow-teal-600/25"
                    >
                      Book Consultation
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          6. HOW IT WORKS
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2
              className="text-slate-900"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 700,
                fontSize: 'clamp(2rem, 4vw, 3.5rem)',
              }}
            >
              How Biruh Tena Works
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative p-8 rounded-3xl bg-white border border-slate-100 hover:bg-teal-600 transition-all duration-300 cursor-default"
              >
                <span className="block text-5xl font-black text-slate-100 group-hover:text-white/20 mb-6 transition-colors">
                  {item.step}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-white mb-3 transition-colors">
                  {item.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed group-hover:text-white/80 transition-colors">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          7. TESTIMONIALS
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-teal-600 text-xs font-bold uppercase tracking-widest mb-3 block">
              Patient Stories
            </span>
            <h2
              className="text-slate-900"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 700,
                fontSize: 'clamp(2rem, 4vw, 3.5rem)',
              }}
            >
              What Our Patients Say
            </h2>
          </div>

          <Swiper
            modules={[Autoplay, Pagination]}
            spaceBetween={24}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            loop
            pagination={{ clickable: true }}
            className="pb-12"
          >
            {TESTIMONIALS.map((t, i) => (
              <SwiperSlide key={i}>
                <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 h-full flex flex-col gap-4">
                  <div className="flex gap-1">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} size={16} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed flex-1">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-black text-sm">
                      {t.initial}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{t.name}</p>
                      <p className="text-xs text-slate-400">{t.role}</p>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          8. ABOUT TECH
      ══════════════════════════════════════════════════════════════ */}
      <section id="about" className="py-28 bg-slate-50 overflow-hidden">
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
            <h2
              className="text-slate-900 mb-8"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 700,
                fontSize: 'clamp(2rem, 4vw, 3.5rem)',
              }}
            >
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
                    <div className="w-11 h-11 shrink-0 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center">
                      <Icon className="text-teal-600 w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 mb-1">{li.title}</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">{li.desc}</p>
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
      <section id="faq" className="py-28 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-teal-600 text-xs font-bold uppercase tracking-widest mb-3 block">
              Got Questions?
            </span>
            <h2
              className="text-slate-900"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 700,
                fontSize: 'clamp(2rem, 4vw, 3.5rem)',
              }}
            >
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-bold text-slate-900 text-sm pr-4">{faq.q}</span>
                  <motion.div
                    animate={{ rotate: openFaq === i ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0"
                  >
                    <ChevronDown size={18} className="text-teal-600" />
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
                      <p className="px-6 pb-5 text-sm text-slate-500 leading-relaxed">{faq.a}</p>
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
              <p className="text-white/80 text-sm font-bold uppercase tracking-widest">24/7 Emergency Line</p>
              <p
                className="text-white font-black"
                style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}
              >
                +251 911 22 33 44
              </p>
            </div>
          </div>
          <a
            href="tel:+251911223344"
            className="bg-white text-red-600 px-8 py-4 rounded-2xl font-black text-sm hover:bg-red-50 transition-all shadow-xl shadow-red-900/20 flex items-center gap-2"
          >
            <Phone size={18} /> Call Now
          </a>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          11. FOOTER
      ══════════════════════════════════════════════════════════════ */}
      <footer id="contact" style={{ backgroundColor: '#0a2540' }} className="pt-20 pb-10 rounded-t-[4rem]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mb-16">
            {/* Col 1 — Brand (span 2) */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center">
                  <Stethoscope className="text-white w-6 h-6" />
                </div>
                <div className="flex flex-col leading-none">
                  <span
                    className="text-xl text-white"
                    style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}
                  >
                    Biruh Tena
                  </span>
                  <span className="font-ethiopic text-xs text-teal-400">ብሩህ ጤና</span>
                </div>
              </div>
              <p className="text-white/50 text-sm leading-relaxed max-w-xs mb-8">
                World-class multi-specialty clinical care, rooted in Ethiopian values. Your health is our mission.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="bg-teal-600 text-white px-8 py-3.5 rounded-2xl font-bold text-sm hover:bg-teal-500 transition-all flex items-center gap-2 shadow-lg shadow-teal-900/30"
              >
                Get Started <ChevronRight size={16} />
              </button>
            </div>

            {/* Col 2 — Contact */}
            <div>
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-6">Contact</p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-white/60 text-sm">
                  <MapPin size={16} className="text-teal-400 mt-0.5 shrink-0" />
                  Bole 12, Addis Ababa, ET
                </li>
                <li className="flex items-center gap-3 text-white/60 text-sm">
                  <Phone size={16} className="text-teal-400 shrink-0" />
                  +251 911 22 33 44
                </li>
                <li className="flex items-center gap-3 text-white/60 text-sm">
                  <Mail size={16} className="text-teal-400 shrink-0" />
                  hello@biruhtena.et
                </li>
              </ul>
            </div>

            {/* Col 3 — Quick Links + Social */}
            <div>
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-6">Quick Links</p>
              <ul className="space-y-3 mb-8">
                {[
                  { label: 'Services', href: '#services' },
                  { label: 'Doctors', href: '#doctors' },
                  { label: 'About', href: '#about' },
                  { label: 'FAQ', href: '#faq' },
                  { label: 'Patient Portal', href: '/login' },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-white/50 text-sm hover:text-teal-400 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Social</p>
              <div className="flex gap-3">
                {[Instagram, Facebook, Twitter].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-teal-600 text-white/50 hover:text-white transition-all"
                  >
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between gap-4">
            <p className="text-white/30 text-xs">
              © 2025 Biruh Tena Specialty Center. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-white/30 text-xs hover:text-white/60 transition-colors">Privacy Policy</a>
              <a href="#" className="text-white/30 text-xs hover:text-white/60 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── AI Assistant ── */}
      <GeminiChatbot />
    </div>
  );
}
