import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, TextField, Typography, Card, CardContent, Alert, CircularProgress, Box } from "@mui/material";
import { Stethoscope, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import authService from "../../api/auth.service";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await authService.forgotPassword(email);
            setSent(true);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to send reset email. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[60vh] items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="mb-8 flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                        <Stethoscope size={32} />
                    </div>
                </div>

                <Card className="shadow-xl rounded-2xl border-0">
                    <CardContent className="p-8">
                        <div className="text-center mb-6">
                            <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
                                {sent ? "Check Your Email" : "Forgot Password"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {sent
                                    ? "We sent a reset link to your email"
                                    : "Enter your email to receive a reset link"}
                            </Typography>
                        </div>

                        {sent ? (
                            <div className="flex flex-col items-center gap-6">
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
                                    <CheckCircle2 size={40} className="text-green-600" />
                                </div>
                                <Typography variant="body2" className="text-center text-slate-600">
                                    If an account exists for <strong>{email}</strong>, you will receive a password reset link shortly. Check your inbox and spam folder.
                                </Typography>
                                <Button component={Link} to="/login" variant="outlined"
                                    startIcon={<ArrowLeft size={18} />}
                                    sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700 }}>
                                    Back to Sign In
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                                {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
                                <Box>
                                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ ml: 0.5, mb: 0.75, display: 'block', textTransform: 'uppercase' }}>
                                        Email Address
                                    </Typography>
                                    <TextField 
                                        fullWidth 
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email} 
                                        onChange={(e) => setEmail(e.target.value)}
                                        required 
                                        variant="outlined" 
                                    />
                                </Box>
                                <Button type="submit" variant="contained" fullWidth disabled={loading}
                                    sx={{ borderRadius: 3, py: 1.5, textTransform: 'none', fontWeight: 700 }}>
                                    {loading ? <CircularProgress size={22} color="inherit" /> : "Send Reset Link"}
                                </Button>
                                <Link to="/login"
                                    className="flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">
                                    <ArrowLeft size={16} /> Back to Sign In
                                </Link>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
