import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { register, reset, googleLogin } from "../../store/slices/authSlice";
import { Eye, EyeOff, Stethoscope, AlertCircle, Loader2 } from "lucide-react";

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
    }, [clientId]);
    return ready;
}

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        firstName: "", lastName: "", email: "",
        phone: "", password: "", confirmPassword: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [localError, setLocalError] = useState("");
    const [googleLoading, setGoogleLoading] = useState(false);

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isLoading, isError, isSuccess, message, user } = useSelector(s => s.auth);

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const googleReady = useGoogleScript(clientId);

    useEffect(() => {
        if (isSuccess || user) navigate("/dashboard");
        if (isError || isSuccess) dispatch(reset());
    }, [isSuccess, user, navigate, isError, dispatch]);

    const handleGoogleResponse = useCallback(async (response) => {
        if (!response?.credential) {
            setLocalError("Google sign-up failed. Please try again.");
            return;
        }
        setGoogleLoading(true);
        setLocalError("");
        try {
            await dispatch(googleLogin(response.credential)).unwrap();
        } catch (err) {
            setLocalError(err || "Google sign-up failed. Please try again.");
        } finally {
            setGoogleLoading(false);
        }
    }, [dispatch]);

    useEffect(() => {
        if (!googleReady || !clientId) return;
        window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
        });
        const container = document.getElementById('google-signup-btn');
        if (container) {
            window.google.accounts.id.renderButton(container, {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                text: 'signup_with',
                shape: 'rectangular',
                logo_alignment: 'left',
                width: container.offsetWidth || 380,
            });
        }
    }, [googleReady, clientId, handleGoogleResponse]);

    const onChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setLocalError("");
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLocalError("");
        if (formData.password !== formData.confirmPassword) {
            setLocalError("Passwords do not match");
            return;
        }
        if (formData.password.length < 8) {
            setLocalError("Password must be at least 8 characters");
            return;
        }
        dispatch(register({
            fullName: `${formData.firstName} ${formData.lastName}`.trim(),
            email: formData.email,
            password: formData.password,
            role: "Patient"
        }));
    };

    const errorMsg = localError || (isError ? (message || "Registration failed") : "");

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[460px]">

                {/* Brand */}
                <div className="flex flex-col items-center gap-2 mb-8">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 shadow-lg shadow-teal-600/25">
                        <Stethoscope size={28} className="text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900">Create Account</h1>
                    <p className="text-sm text-slate-500">Register for Biruh Tena Clinical System</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-slate-900">Register</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Fill in your details to get started</p>
                    </div>

                    {errorMsg && (
                        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-5">
                            <AlertCircle size={16} className="shrink-0" />
                            {errorMsg}
                        </div>
                    )}

                    {/* Google Sign-Up */}
                    {clientId && (
                        <>
                            <div className="mb-4">
                                {googleLoading ? (
                                    <div className="w-full flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-xl text-sm text-slate-600 bg-slate-50">
                                        <Loader2 size={16} className="animate-spin text-teal-600" />
                                        Signing up with Google...
                                    </div>
                                ) : (
                                    <div id="google-signup-btn" className="w-full flex justify-center" />
                                )}
                            </div>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="flex-1 h-px bg-slate-200" />
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">or register manually</span>
                                <div className="flex-1 h-px bg-slate-200" />
                            </div>
                        </>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">First Name</label>
                                <input name="firstName" required autoComplete="given-name"
                                    value={formData.firstName} onChange={onChange} placeholder="Abebe"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Last Name</label>
                                <input name="lastName" required autoComplete="family-name"
                                    value={formData.lastName} onChange={onChange} placeholder="Kebede"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Email</label>
                            <input name="email" type="email" required autoComplete="email"
                                value={formData.email} onChange={onChange} placeholder="you@example.com"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all" />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Phone <span className="text-slate-300 normal-case font-normal">(optional)</span></label>
                            <input name="phone" type="tel" autoComplete="tel"
                                value={formData.phone} onChange={onChange} placeholder="+251 9XX XXX XXX"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all" />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Password</label>
                            <div className="relative">
                                <input name="password" type={showPassword ? "text" : "password"} required autoComplete="new-password"
                                    value={formData.password} onChange={onChange} placeholder="Min 8 characters"
                                    className="w-full px-4 py-3 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all" />
                                <button type="button" onClick={() => setShowPassword(p => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Confirm Password</label>
                            <div className="relative">
                                <input name="confirmPassword" type={showConfirm ? "text" : "password"} required autoComplete="new-password"
                                    value={formData.confirmPassword} onChange={onChange} placeholder="••••••••"
                                    className="w-full px-4 py-3 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all" />
                                <button type="button" onClick={() => setShowConfirm(p => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={isLoading || googleLoading}
                            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-teal-600/20 disabled:opacity-60 disabled:cursor-not-allowed mt-2">
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 size={16} className="animate-spin" />
                                    Creating account...
                                </span>
                            ) : "Create Account"}
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-500 mt-6">
                        Already have an account?{" "}
                        <Link to="/login" className="font-semibold text-teal-600 hover:text-teal-700 hover:underline">
                            Sign in
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
