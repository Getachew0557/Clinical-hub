import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { register, reset } from "../../store/slices/authSlice";
import { 
    User, Mail, Phone, Lock, Eye, EyeOff, 
    Stethoscope, AlertCircle, Loader2, ArrowRight, CheckCircle2, X 
} from "lucide-react";

export default function RegisterPage() {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [passwordError, setPasswordError] = useState("");

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user, isLoading, isError, isSuccess, message } = useSelector(s => s.auth);

    useEffect(() => {
        if (isSuccess || user) {
            navigate("/dashboard");
        }
        dispatch(reset());
    }, [user, isSuccess, navigate, dispatch]);

    const onChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (e.target.name === 'confirmPassword' || e.target.name === 'password') {
            setPasswordError("");
        }
    };

    const onSubmit = (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setPasswordError("Passwords do not match");
            return;
        }
        dispatch(register(formData));
    };

    const inputClasses = "w-full px-5 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500/50 focus:bg-white transition-all font-bold";
    const labelClasses = "block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.15em]";

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="w-full max-w-[540px] relative">
                {/* Card */}
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/50 dark:border-slate-800 p-8 md:p-10 relative">
                    
                    {/* Close Button Inside Card */}
                    <Link 
                        to="/" 
                        className="absolute top-6 right-6 w-10 h-10 bg-slate-100/50 dark:bg-slate-800/50 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all hover:rotate-90 z-20"
                    >
                        <X size={20} />
                    </Link>

                    {/* Centered Side-by-Side Header */}
                    <div className="flex items-center justify-center gap-4 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg shadow-teal-500/30">
                            <Stethoscope size={28} className="text-white" />
                        </div>
                        <div className="text-left">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">
                                {t('auth.register.title')}
                            </h2>
                            <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-widest">
                                Biruh Tena Clinical Hub
                            </p>
                        </div>
                    </div>

                    {(isError || passwordError) && (
                        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 text-red-600 dark:text-red-400 px-4 py-4 rounded-2xl text-xs font-bold mb-6">
                            <AlertCircle size={18} className="shrink-0" />
                            {passwordError || message}
                        </div>
                    )}

                    <form onSubmit={onSubmit} className="space-y-4">
                        <div>
                            <label className={labelClasses}>{t('auth.register.fullName')}</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    name="fullName"
                                    required
                                    value={formData.fullName}
                                    onChange={onChange}
                                    placeholder="Enter your full name"
                                    className={`${inputClasses} pl-12`}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClasses}>{t('auth.register.email')}</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={onChange}
                                        placeholder="email@example.com"
                                        className={`${inputClasses} pl-12`}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelClasses}>{t('auth.register.phone')}</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600">
                                        <Phone size={18} />
                                    </div>
                                    <input
                                        type="tel"
                                        name="phone"
                                        required
                                        value={formData.phone}
                                        onChange={onChange}
                                        placeholder="+251 ..."
                                        className={`${inputClasses} pl-12`}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClasses}>{t('auth.register.password')}</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        required
                                        value={formData.password}
                                        onChange={onChange}
                                        placeholder="••••••••"
                                        className={`${inputClasses} pl-12`}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelClasses}>{t('auth.register.confirmPassword')}</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={onChange}
                                        placeholder="••••••••"
                                        className={`${inputClasses} pl-12`}
                                    />
                                    <button type="button" onClick={() => setShowPassword(p => !p)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-teal-600 transition-colors">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-teal-50/50 dark:bg-teal-900/10 rounded-2xl p-4 border border-teal-100/50 dark:border-teal-800/50">
                            <div className="flex gap-3">
                                <CheckCircle2 size={18} className="text-teal-600 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-teal-800 dark:text-teal-400 font-bold leading-relaxed uppercase tracking-tight">
                                    By registering, you agree to our Terms of Service and Privacy Policy.
                                </p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl text-sm transition-all shadow-xl shadow-teal-600/20 disabled:opacity-60 disabled:cursor-not-allowed mt-2 uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    {t('auth.register.submit')}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-xs font-bold text-slate-400 dark:text-slate-500 mt-8">
                        {t('auth.register.hasAccount')}{" "}
                        <Link to="/login" className="text-teal-600 hover:text-teal-700 underline underline-offset-4 decoration-2">
                            {t('auth.register.login')}
                        </Link>
                    </p>
                </div>

                <p className="text-center text-[10px] font-black text-slate-300 dark:text-slate-600 mt-8 uppercase tracking-[0.4em]">
                    © {new Date().getFullYear()} Biruh Tena Clinical Hub
                </p>
            </div>
        </div>
    );
}
