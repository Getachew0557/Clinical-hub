import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Stethoscope, Shield, Clock, Phone, Mail, Instagram,
    Facebook, Twitter, ChevronRight, Menu, X, Star,
    Heart, Calendar, MapPin, ArrowRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import doctorService from '../api/doctor.service';
import heroImg from '../assets/clinic-hero.png';
export default function LandingPage() {
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [doctors, setDoctors] = useState([]);
    const [loadingDoctors, setLoadingDoctors] = useState(true);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        fetchDoctors();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fetchDoctors = async () => {
        try {
            setLoadingDoctors(true);
            const data = await doctorService.getPublicDoctors();
            setDoctors(data.doctors || data.records || []);
        } catch (err) {
            console.error('Fetch Doctors error:', err);
        } finally {
            setLoadingDoctors(false);
        }
    };

    const handleBookingClick = (doctorId) => {
        if (user) {
            navigate(`/book/${doctorId}`);
        } else {
            navigate(`/login?redirect=/book/${doctorId}`);
        }
    };

    const services = [
        { icon: <Heart className="text-pink-500" />, title: "General Dentistry", desc: "Routine checkups and preventive care for a healthy smile." },
        { icon: <Shield className="text-blue-500" />, title: "Oral Surgery", desc: "Expert surgical procedures with advanced technology and care." },
        { icon: <Star className="text-yellow-500" />, title: "Cosmetic Design", desc: "Transform your smile with veneers, whitening, and more." },
        { icon: <Calendar className="text-emerald-500" />, title: "Orthodontics", desc: "Perfect alignment for children and adults using modern braces." }
    ];

    const stats = [
        { label: "Happy Patients", value: "15k+" },
        { label: "Expert Doctors", value: "24" },
        { label: "Clinic Locations", value: "5" },
        { label: "Years Experience", value: "12" }
    ];

    const navLinks = [
        { name: 'Services', href: '#services' },
        { name: 'Experts', href: '#experts' },
        { name: 'About', href: '#about' },
        { name: 'Contact', href: '#contact' },
    ];

    const mockDoctors = [
        { id: 1, fullName: "Dr. Sarah Mitchell", specialization: "Orthodontist", rating: 4.9, reviewsCount: 124, experience: 8, profilePhoto: "https://images.unsplash.com/photo-1559839734-2b71f1e3c770?q=80&w=2070&auto=format&fit=crop" },
        { id: 2, fullName: "Dr. James Wilson", specialization: "Oral Surgeon", rating: 5.0, reviewsCount: 89, experience: 12, profilePhoto: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=1964&auto=format&fit=crop" },
        { id: 3, fullName: "Dr. Elena Rodriguez", specialization: "Cosmetic Dentist", rating: 4.8, reviewsCount: 210, experience: 10, profilePhoto: "https://images.unsplash.com/photo-1594824813573-c102021c5ab4?q=80&w=1974&auto=format&fit=crop" }
    ];

    const displayDoctors = doctors.length > 0 ? doctors.slice(0, 3) : mockDoctors;

    return (
        <div className="min-h-screen bg-slate-50 overflow-x-hidden selection:bg-blue-100 selection:text-blue-600">
            {/* ── Navigation ── */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'glass py-3 shadow-sm' : 'py-6 bg-transparent'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <Stethoscope className="text-white w-6 h-6" />
                        </div>
                        <span className={`text-xl font-black uppercase tracking-tighter ${isScrolled ? 'text-slate-900' : 'text-slate-900'}`}>Ras Dental</span>
                    </motion.div>

                    {/* Desktop Nav */}
                    <div className="hidden lg:flex items-center gap-10">
                        {navLinks.map((link, i) => (
                            <motion.a
                                key={link.name}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                href={link.href}
                                className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors uppercase tracking-wider"
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
                            className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-sm font-bold hover:bg-black transition-all shadow-xl shadow-slate-900/20 active:shadow-none"
                        >
                            Patient Portal
                        </motion.button>
                    </div>

                    {/* Mobile Toggle */}
                    <button className="lg:hidden text-slate-900" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-40 lg:hidden glass pt-24 px-6"
                    >
                        <div className="flex flex-col gap-8 text-center">
                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    className="text-2xl font-black text-slate-900"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {link.name}
                                </a>
                            ))}
                            <button
                                onClick={() => navigate('/login')}
                                className="bg-blue-600 text-white py-4 rounded-3xl text-xl font-bold shadow-2xl shadow-blue-600/40"
                            >
                                Sign In
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Hero Section ── */}
            <section className="relative pt-32 lg:pt-48 pb-20 lg:pb-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="inline-block px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-xs font-black uppercase tracking-widest mb-6">
                            Dental Excellence & Technology
                        </span>
                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight">
                            A Radiant Smile, <br />
                            <span className="text-gradient">Redefined.</span>
                        </h1>
                        <p className="text-base text-slate-500 max-w-lg mb-8 font-medium leading-relaxed">
                            Experience the future of dentistry with state-of-the-art technology and personalized care. We don't just fix smiles; we design them with clinical precision.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => document.getElementById('experts').scrollIntoView({ behavior: 'smooth' })}
                                className="bg-blue-600 text-white px-10 py-5 rounded-3xl font-black flex items-center gap-3 shadow-2xl shadow-blue-600/30 group transition-all"
                            >
                                Book Appointment <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </motion.button>
                            <button className="px-10 py-5 rounded-3xl font-bold text-slate-600 hover:bg-white transition-all">
                                See Our Work
                            </button>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, x: 50 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="relative"
                    >
                        <div className="relative aspect-square lg:aspect-video rounded-[3rem] overflow-hidden shadow-2xl shadow-blue-900/10">
                            <img src={heroImg} alt="Modern Clinic" className="w-full h-full object-cover scale-110 hover:scale-100 transition-transform duration-[2s]" />
                            <div className="absolute inset-0 bg-linear-to-tr from-blue-950/20 to-transparent" />
                        </div>

                        {/* Floating elements */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="absolute -top-10 -right-10 glass p-6 rounded-[2rem] shadow-2xl hidden lg:block"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                                    <Star size={24} strokeWidth={3} />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-900">4.9/5 Rating</p>
                                    <p className="text-xs text-slate-500">From 2,000+ Reviews</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ── Stats ── */}
            <section className="bg-slate-900 py-16">
                <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-between gap-10">
                    {stats.map((stat, i) => (
                        <div key={i} className="flex flex-col gap-1">
                            <span className="text-4xl lg:text-5xl font-black text-white tracking-tighter">{stat.value}</span>
                            <span className="text-blue-400 text-xs font-black uppercase tracking-widest">{stat.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Services ── */}
            <section id="services" className="py-32 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-20">
                        <div className="max-w-xl">
                            <span className="text-blue-600 text-[10px] font-black uppercase tracking-[0.3em] mb-3 block">Specialties</span>
                            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                                Specialized care for <br />
                                <span className="text-gradient">every smile.</span>
                            </h2>
                        </div>
                        <p className="text-slate-500 max-w-xs text-sm font-medium">
                            From minor adjustments to complete structural redesigns, our clinical team delivers perfection.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {services.map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="group p-8 rounded-[2.5rem] bg-white border border-slate-100 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-600/5 transition-all duration-500"
                            >
                                <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500">
                                    {item.icon}
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{item.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed mb-8">{item.desc}</p>
                                <button className="flex items-center gap-2 text-slate-900 text-sm font-black uppercase tracking-widest hover:gap-4 transition-all">
                                    Learn More <ChevronRight size={16} />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Experts Section ── */}
            <section id="experts" className="py-32 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16 text-balance">
                        <span className="text-blue-600 text-[10px] font-black uppercase tracking-[0.3em] mb-3 block">Meet Our Clinicians</span>
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
                            Expertise that <br />
                            <span className="text-gradient">inspires trust.</span>
                        </h2>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed">Our board-certified specialists are leaders in modern operative dentistry.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {displayDoctors.map((doc, i) => (
                            <motion.div
                                key={doc.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="group relative"
                            >
                                <div className="absolute inset-0 bg-blue-600/5 blur-[100px] rounded-full -z-1 group-hover:bg-blue-600/10 transition-colors" />
                                <div
                                    className="rounded-[2.5rem] border border-slate-100 bg-white overflow-hidden transition-all duration-500 hover:-translate-y-3 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-600/10"
                                >
                                    <div className="relative aspect-[4/5] overflow-hidden">
                                        <img
                                            src={doc.profilePhoto || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop"}
                                            alt={doc.fullName}
                                            className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110"
                                        />
                                        <div className="absolute top-6 right-6 glass p-2 px-3 rounded-2xl flex items-center gap-2 shadow-xl">
                                            <Star className="text-yellow-500 fill-yellow-500 w-4 h-4" />
                                            <span className="text-sm font-black text-slate-900">{doc.rating || '5.0'}</span>
                                        </div>
                                        <div className="absolute bottom-6 left-6 right-6 glass p-4 rounded-3xl translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                            <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">Availability</p>
                                            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                Available Mon - Fri
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-8 pb-10">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h3 className="text-2xl font-black text-slate-900 mb-1 leading-none">{doc.fullName}</h3>
                                                <p className="text-blue-600 text-sm font-bold">{doc.specialization}</p>
                                            </div>
                                            <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black uppercase text-slate-400">
                                                {doc.experience || '5'}+ Years Exp
                                            </div>
                                        </div>
                                        <p className="text-slate-500 text-sm leading-relaxed mb-8 line-clamp-2 font-medium">
                                            {doc.bio || "Leading expert in modern dentistry with a focus on patient-centered surgical excellence."}
                                        </p>
                                        <button
                                            onClick={() => handleBookingClick(doc.id)}
                                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10 hover:shadow-blue-600/20"
                                        >
                                            Book Consultation
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── About / Tech ── */}
            <section id="about" className="py-32 bg-slate-50 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div className="relative">
                        <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl">
                            <img src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=2070&auto=format&fit=crop" alt="Advanced Tech" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-blue-600/10 blur-[100px] -z-1" />
                    </div>
                    <div>
                        <span className="text-blue-600 text-xs font-black uppercase tracking-widest mb-4 block">Our Technology</span>
                        <h2 className="text-5xl font-black text-slate-900 mb-8 tracking-tighter leading-tight">Precision Meets Passionate Dental Care.</h2>
                        <ul className="space-y-6">
                            {[
                                { t: "Pain-Free Procedures", d: "Utilizing advanced sedation and numbing techniques." },
                                { t: "Digital Impressions", d: "No more messy molds. We use 3D laser scanners for 100% accuracy." },
                                { t: "AI Analysis", d: "Proprietary AI helps our doctors detect issues 6 months earlier." }
                            ].map((li, i) => (
                                <li key={i} className="flex gap-6">
                                    <div className="w-10 h-10 shrink-0 rounded-2xl bg-white border border-slate-100 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 mb-1">{li.t}</h4>
                                        <p className="text-sm text-slate-500 font-medium">{li.d}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* ── Process ── */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            { step: "01", title: "Free Consultation", desc: "Speak with our specialists and discuss your dental goals." },
                            { step: "02", title: "Clinical Checkup", desc: "Advanced 3D imaging and comprehensive oral examination." },
                            { step: "03", title: "Painless Treatment", desc: "State-of-the-art procedure with zero-discomfort guarantee." }
                        ].map((item, i) => (
                            <div key={i} className="relative p-8 rounded-[2rem] bg-slate-50 border border-slate-100 group hover:bg-blue-600 transition-all duration-500">
                                <span className="block text-4xl font-black text-slate-200 group-hover:text-white/20 mb-6 transition-colors">{item.step}</span>
                                <h4 className="text-xl font-black text-slate-900 group-hover:text-white mb-2 transition-colors">{item.title}</h4>
                                <p className="text-slate-500 text-sm font-medium group-hover:text-white/80 transition-colors leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer id="contact" className="bg-slate-900 pt-32 pb-12 rounded-t-[4rem]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-16 mb-24">
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-3 mb-10">
                                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                                    <Stethoscope className="text-white w-6 h-6" />
                                </div>
                                <span className="text-2xl font-black text-white tracking-tighter uppercase">Ras Dental</span>
                            </div>
                            <h3 className="text-4xl font-black text-white/90 mb-10 leading-none">Ready to start your <br /> dental journey?</h3>
                            <button
                                onClick={() => navigate('/login')}
                                className="bg-white text-slate-900 px-10 py-5 rounded-3xl font-black hover:bg-blue-50 transition-all flex items-center gap-3"
                            >
                                Get Started <ChevronRight size={20} />
                            </button>
                        </div>

                        <div>
                            <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-8">Contact Information</p>
                            <ul className="space-y-4">
                                <li className="flex gap-4 text-white/60 text-sm font-medium"><MapPin size={18} className="text-blue-400" /> Bole 12, Addis Ababa, ET</li>
                                <li className="flex gap-4 text-white/60 text-sm font-medium"><Phone size={18} className="text-blue-400" /> +251 911 22 33 44</li>
                                <li className="flex gap-4 text-white/60 text-sm font-medium"><Mail size={18} className="text-blue-400" /> hello@rasdental.com</li>
                            </ul>
                        </div>

                        <div>
                            <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-8">Social Connect</p>
                            <div className="flex gap-4">
                                {[Instagram, Facebook, Twitter].map((Icon, i) => (
                                    <a key={i} href="#" className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all text-white/50">
                                        <Icon size={20} />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-white/5 pt-12 flex flex-col md:flex-row justify-between gap-6">
                        <p className="text-white/30 text-xs font-medium">© {new Date().getFullYear()} Ras Dental Specialty Center. All rights reserved.</p>
                        <div className="flex gap-8">
                            <a href="#" className="text-white/30 text-xs hover:text-white transition-colors">Privacy Policy</a>
                            <a href="#" className="text-white/30 text-xs hover:text-white transition-colors">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
