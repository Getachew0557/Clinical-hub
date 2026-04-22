import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login, reset } from "../../store/slices/authSlice";
import { Eye, EyeOff, Stethoscope, AlertCircle, Loader2, Mail, Lock } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user, isLoading, isError, isSuccess, message } = useSelector(s => s.auth);
    const location = useLocation();

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

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(login({ email, password }));
    };

    return (
        <div className="min-h-screen flex">
            {/* Left panel — branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 via-teal-700 to-teal-900 flex-col items-center justify-center p-12 relative overflow-hidden">
                {/* Background circles */}
                <div className="absolute top-[-80px] left-[-80px] w-80 h-80 rounded-full bg-white/5" />
                <div className="absolute bottom-[-60px] right-[-60px] w-64 h-64 rounded-full bg-white/5" />
                <div className="absolute top-1/2 right-[-40px] w-48 h-48 rounded-full bg-white/5" />

                <div className="relative z-10 text-center max-w-sm">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 backdrop-blur mx-auto mb-6 shadow-2xl">
                        <Stethoscope size={40} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">Biruh Tena</h1>
                    <p className="text-teal-200 text-lg font-ethiopic mb-6">ብሩህ ጤና</p>
                    <p className="text-teal-100/80 text-sm leading-relaxed">
                        A comprehensive clinical management system designed to streamline patient care, appointments, and medical records.
                    </p>

                    <div className="mt-10 grid grid-cols-3 gap-4 text-center">
                        {[
                            { label: "Patients", value: "2,400+" },
                            { label: "Doctors", value: "48" },
                            { label: "Uptime", value: "99.9%" },
                        ].map(stat => (
                            <div key={stat.label} className="bg-white/10 rounded-2xl p-3">
                                <div className="text-white font-bold text-lg">{stat.value}</div>
                                <div className="text-teal-200 text-xs mt-0.5">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel — form */}
            <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
                <div className="w-full max-w-md">

                    {/* Mobile brand */}
                    <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 shadow-lg">
                            <Stethoscope size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Biruh Tena</h1>
                            <p className="text-xs text-teal-600 font-ethiopic">ብሩህ ጤና</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/80 border border-slate-100 p-8">
                        <div className="mb-7">
                            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
                            <p className="text-sm text-slate-500 mt-1">Sign in to your account to continue</p>
                        </div>

                        {isError && (
                            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-5">
                                <AlertCircle size={16} className="shrink-0" />
                                {message || "Invalid email or password"}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="email"
                                        required
                                        autoComplete="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="name@clinic.com"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent focus:bg-white transition-all"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Password
                                    </label>
                                    <Link to="/forgot-password" className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline transition-colors">
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent focus:bg-white transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(p => !p)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-teal-600/25 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 size={16} className="animate-spin" />
                                        Signing in...
                                    </span>
                                ) : "Sign In"}
                            </button>
                        </form>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-100" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white px-3 text-xs text-slate-400">New to Biruh Tena?</span>
                            </div>
                        </div>

                        <Link
                            to="/register"
                            className="block w-full py-3 text-center text-sm font-semibold text-teal-600 border-2 border-teal-100 hover:border-teal-300 hover:bg-teal-50 rounded-xl transition-all"
                        >
                            Create an account
                        </Link>
                    </div>

                    <p className="text-center text-xs text-slate-400 mt-6">
                        © {new Date().getFullYear()} Biruh Tena Clinical System
                    </p>
                </div>
            </div>
        </div>
    );
}
