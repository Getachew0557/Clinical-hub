import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { login, reset, googleLogin } from "../../store/slices/authSlice";
import { Eye, EyeOff, Stethoscope, AlertCircle, Loader2, X } from "lucide-react";

// Google Sign-In button SVG icon
function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
    );
}

// Load Google Identity Services script once
function useGoogleScript(clientId) {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (!clientId) return;
        if (window.google?.accounts?.id) { setReady(true); return; }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => setReady(true);
        document.head.appendChild(script);

        return () => {
            // Don't remove — other pages may need it
        };
    }, [clientId]);

    return ready;
}

export default function LoginPage() {
    const { t } = useTranslation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [googleError, setGoogleError] = useState("");

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user, isLoading, isError, isSuccess, message } = useSelector(s => s.auth);
    const location = useLocation();

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const googleReady = useGoogleScript(clientId);

    // Redirect after successful login
    useEffect(() => {
        if (isSuccess || user) {
            const params = new URLSearchParams(location.search);
            const redirect = params.get("redirect");
            const safeRedirect = redirect && redirect.startsWith('/') && !redirect.startsWith('//')
                ? redirect : '/dashboard';
            navigate(safeRedirect);
        }
        dispatch(reset());
    }, [user, isSuccess, navigate, dispatch, location]);

    // Handle Google credential response
    const handleGoogleResponse = useCallback(async (response) => {
        if (!response?.credential) {
            setGoogleError(t('common.error'));
            return;
        }
        setGoogleLoading(true);
        setGoogleError("");
        try {
            await dispatch(googleLogin(response.credential)).unwrap();
            // Navigation handled by the useEffect above
        } catch (err) {
            setGoogleError(err || t('common.error'));
        } finally {
            setGoogleLoading(false);
        }
    }, [dispatch, t]);

    // Initialize Google One Tap / button
    useEffect(() => {
        if (!googleReady || !clientId) return;

        window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
        });

        // Render the Google button into our container
        const container = document.getElementById('google-signin-btn');
        if (container) {
            window.google.accounts.id.renderButton(container, {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                text: 'signin_with',
                shape: 'rectangular',
                logo_alignment: 'left',
                width: container.offsetWidth || 340,
            });
        }
    }, [googleReady, clientId, handleGoogleResponse]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setGoogleError("");
        dispatch(login({ email, password }));
    };

    const errorMsg = googleError || (isError ? (message || t('auth.login.invalidCredentials')) : "");

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="w-full max-w-[440px] relative">
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
                                {t('auth.login.title')}
                            </h2>
                            <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-widest">
                                {t('auth.login.systemName')}
                            </p>
                        </div>
                    </div>

                    {errorMsg && (
                        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 text-red-600 dark:text-red-400 px-4 py-4 rounded-2xl text-xs font-bold mb-6">
                            <AlertCircle size={18} className="shrink-0" />
                            {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-widest pl-1">
                                {t('auth.login.email')}
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="name@clinic.com"
                                className="w-full px-5 py-4 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500/50 transition-all font-bold"
                            />
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-1.5 px-1">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                    {t('auth.login.password')}
                                </label>
                                <Link to="/forgot-password" title="Reset your password" className="text-[10px] font-black text-teal-600 hover:text-teal-700 uppercase tracking-wider">
                                    {t('auth.login.forgotPassword')}
                                </Link>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-5 py-4 pr-12 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500/50 transition-all font-bold"
                                />
                                <button type="button" onClick={() => setShowPassword(p => !p)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-teal-600 transition-colors">
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Google Sign-In (Repositioned) */}
                        {clientId && (
                            <div className="py-2">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                                    <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest whitespace-nowrap">social login</span>
                                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                                </div>
                                {googleLoading ? (
                                    <div className="w-full flex items-center justify-center gap-3 py-4 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-500 bg-slate-50/50 dark:bg-slate-800/50">
                                        <Loader2 size={18} className="animate-spin text-teal-600" />
                                        {t('common.loading')}
                                    </div>
                                ) : (
                                    <div id="google-signin-btn" className="w-full flex justify-center overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800" />
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || googleLoading}
                            className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl text-sm transition-all shadow-xl shadow-teal-600/20 disabled:opacity-60 disabled:cursor-not-allowed mt-2 uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                t('auth.login.submit')
                            )}
                        </button>
                    </form>

                    <p className="text-center text-xs font-bold text-slate-400 dark:text-slate-500 mt-8">
                        {t('auth.login.noAccount')}{" "}
                        <Link to="/register" className="text-teal-600 hover:text-teal-700 underline underline-offset-4 decoration-2">
                            {t('auth.login.register')}
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
