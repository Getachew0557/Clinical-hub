import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { register, reset } from "../../store/slices/authSlice";
import {
    Eye, EyeOff, Stethoscope, AlertCircle,
    Loader2, Mail, Lock, User, Phone, CheckCircle2
} from "lucide-react";

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [localError, setLocalError] = useState("");

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isLoading, isError, isSuccess, message, user } = useSelector(s => s.auth);

    useEffect(() => {
        if (isSuccess || user) navigate("/dashboard");
        if (isError || isSuccess) dispatch(reset());
    }, [isSuccess, user, navigate, isError, dispatch]);

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

    const passwordMatch = formData.confirmPassword && formData.password === formData.confirmPassword;

    return (
        <div className="min-h-screen flex">
            {/* Left panel — branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 via-teal-700 to-teal-900 flex-col items-center justify-center p-12 relative overflow-hidden">
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
                        Join thousands of patients who trust Biruh Tena for their healthcare management needs.
                    </p>

                    <div className="mt-10 space-y-3 text-left">
                        {[
                            "Book appointments online",
                            "Access your medical records",
                            "Receive appointment reminders",
                            "Consult with doctors virtually",
                        ].map(item => (
                            <div key={item} className="flex items-center gap-3 text-teal-100 text-sm">
                                <CheckCircle2 size={16} className="text-teal-300 shrink-0" />
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel — form */}
            <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 overflow-y-auto">
                <div className="w-full max-w-md py-6">

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
                            <h2 className="text-2xl font-bold text-slate-900">Create account</h2>
                            <p className="text-sm text-slate-500 mt-1">Fill in your details to get started</p>
                        </div>

                        {(isError || localError) && (
                            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-5">
                                <AlertCircle size={16} className="shrink-0" />
                                {localError || message || "Registration failed. Please try again."}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                        First Name
                                    </label>
                                    <div className="relative">
                                        <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            name="firstName"
                                            required
                                            autoComplete="given-name"
                                            value={formData.firstName}
                                            onChange={onChange}
                                            placeholder="John"
                                            className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                        Last Name
                                    </label>
                                    <input
                                        name="lastName"
                                        required
                                        autoComplete="family-name"
                                        value={formData.lastName}
                                        onChange={onChange}
                                        placeholder="Doe"
                                        className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent focus:bg-white transition-all"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        name="email"
                                        type="email"
                                        required
                                        autoComplete="email"
                                        value={formData.email}
                                        onChange={onChange}
                                        placeholder="you@example.com"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent focus:bg-white transition-all"
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        name="phone"
                                        type="tel"
                                        autoComplete="tel"
                                        value={formData.phone}
                                        onChange={onChange}
                                        placeholder="+251 911 000 000"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent focus:bg-white transition-all"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        autoComplete="new-password"
                                        value={formData.password}
                                        onChange={onChange}
                                        placeholder="Min 8 characters"
                                        className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent focus:bg-white transition-all"
                                    />
                                    <button type="button" onClick={() => setShowPassword(p => !p)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        name="confirmPassword"
                                        type={showConfirm ? "text" : "password"}
                                        required
                                        autoComplete="new-password"
                                        value={formData.confirmPassword}
                                        onChange={onChange}
                                        placeholder="••••••••"
                                        className={`w-full pl-10 pr-11 py-3 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent focus:bg-white transition-all ${
                                            formData.confirmPassword
                                                ? passwordMatch
                                                    ? "border-teal-300 focus:ring-teal-400"
                                                    : "border-red-300 focus:ring-red-400"
                                                : "border-slate-200 focus:ring-teal-400"
                                        }`}
                                    />
                                    <button type="button" onClick={() => setShowConfirm(p => !p)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                    {passwordMatch && (
                                        <CheckCircle2 size={15} className="absolute right-10 top-1/2 -translate-y-1/2 text-teal-500" />
                                    )}
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
                                        Creating account...
                                    </span>
                                ) : "Create Account"}
                            </button>
                        </form>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-100" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white px-3 text-xs text-slate-400">Already have an account?</span>
                            </div>
                        </div>

                        <Link
                            to="/login"
                            className="block w-full py-3 text-center text-sm font-semibold text-teal-600 border-2 border-teal-100 hover:border-teal-300 hover:bg-teal-50 rounded-xl transition-all"
                        >
                            Sign in instead
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
