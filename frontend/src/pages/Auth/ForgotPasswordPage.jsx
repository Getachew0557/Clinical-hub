import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, ArrowLeft, Loader2, CheckCircle2, Stethoscope, X } from "lucide-react";
import authService from "../../api/auth.service";

export default function ForgotPasswordPage() {
    const { t } = useTranslation();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");

    const onSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            await authService.forgotPassword(email);
            setIsSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || t('common.error'));
        } finally {
            setIsLoading(false);
        }
    };

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
                        to="/login" 
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
                                {t('auth.forgot.title')}
                            </h2>
                            <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-widest">
                                {t('auth.login.systemName')}
                            </p>
                        </div>
                    </div>

                    {isSuccess ? (
                        <div className="text-center py-4">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-900/20 mx-auto mb-6 border border-teal-100 dark:border-teal-800">
                                <CheckCircle2 size={40} className="text-teal-600" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Check your email</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
                                We've sent a password reset link to <span className="text-teal-600 font-bold">{email}</span>. 
                                Please check your inbox and spam folder.
                            </p>
                            <Link to="/login" className="inline-flex items-center justify-center w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl text-sm transition-all shadow-xl shadow-teal-600/20 uppercase tracking-widest">
                                {t('auth.forgot.backToLogin')}
                            </Link>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8 text-center px-4">
                                {t('auth.forgot.instruction')}
                            </p>

                            {error && (
                                <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 text-red-600 dark:text-red-400 px-4 py-4 rounded-2xl text-xs font-bold mb-6">
                                    <X size={18} className="shrink-0 rotate-45" />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={onSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest pl-1">
                                        {t('auth.forgot.email')}
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600">
                                            <Mail size={18} />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            placeholder="email@example.com"
                                            className="w-full px-12 py-4 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500/50 transition-all font-bold"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl text-sm transition-all shadow-xl shadow-teal-600/20 disabled:opacity-60 disabled:cursor-not-allowed uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : t('auth.forgot.submit')}
                                </button>

                                <Link to="/login" className="flex items-center justify-center gap-2 text-slate-400 hover:text-teal-600 font-bold text-xs transition-colors uppercase tracking-widest">
                                    <ArrowLeft size={16} />
                                    {t('auth.forgot.backToLogin')}
                                </Link>
                            </form>
                        </>
                    )}
                </div>

                <p className="text-center text-[10px] font-black text-slate-300 dark:text-slate-600 mt-8 uppercase tracking-[0.4em]">
                    © {new Date().getFullYear()} Biruh Tena Clinical Hub
                </p>
            </div>
        </div>
    );
}
