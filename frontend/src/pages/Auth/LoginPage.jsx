import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login, reset, googleLogin } from "../../store/slices/authSlice";
import { Eye, EyeOff, Stethoscope, AlertCircle, Loader2 } from "lucide-react";

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
            setGoogleError("Google sign-in failed. Please try again.");
            return;
        }
        setGoogleLoading(true);
        setGoogleError("");
        try {
            await dispatch(googleLogin(response.credential)).unwrap();
            // Navigation handled by the useEffect above
        } catch (err) {
            setGoogleError(err || "Google sign-in failed. Please try again.");
        } finally {
            setGoogleLoading(false);
        }
    }, [dispatch]);

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

    const errorMsg = googleError || (isError ? (message || "Invalid email or password") : "");

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[420px]">

                {/* Brand */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 shadow-lg shadow-teal-600/25">
                        <Stethoscope size={26} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 leading-tight">Biruh Tena</h1>
                        <p className="text-xs text-teal-600 font-ethiopic">ብሩህ ጤና</p>
                    </div>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-slate-900">Sign in to your account</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Enter your credentials to continue</p>
                    </div>

                    {errorMsg && (
                        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-5">
                            <AlertCircle size={16} className="shrink-0" />
                            {errorMsg}
                        </div>
                    )}

                    {/* Google Sign-In */}
                    {clientId && (
                        <>
                            <div className="mb-4">
                                {googleLoading ? (
                                    <div className="w-full flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-xl text-sm text-slate-600 bg-slate-50">
                                        <Loader2 size={16} className="animate-spin text-teal-600" />
                                        Signing in with Google...
                                    </div>
                                ) : (
                                    /* Google renders its own button here */
                                    <div id="google-signin-btn" className="w-full flex justify-center" />
                                )}
                            </div>

                            {/* Divider */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex-1 h-px bg-slate-200" />
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">or</span>
                                <div className="flex-1 h-px bg-slate-200" />
                            </div>
                        </>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                autoComplete="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="name@clinic.com"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Password
                                </label>
                                <Link to="/forgot-password" className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                                />
                                <button type="button" onClick={() => setShowPassword(p => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || googleLoading}
                            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-teal-600/20 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 size={16} className="animate-spin" />
                                    Signing in...
                                </span>
                            ) : "Sign In"}
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-500 mt-6">
                        Don't have an account?{" "}
                        <Link to="/register" className="font-semibold text-teal-600 hover:text-teal-700 hover:underline">
                            Create account
                        </Link>
                    </p>
                </div>

                <p className="text-center text-xs text-slate-400 mt-6">
                    © {new Date().getFullYear()} Biruh Tena Clinical System
                </p>
            </div>
        </div>
    );
}
