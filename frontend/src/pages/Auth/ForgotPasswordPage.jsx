import { useState } from "react";
import { Link } from "react-router-dom";
import {
    Button,
    TextField,
    Typography,
    Card,
    CardContent,
    Box
} from "@mui/material";
import { Stethoscope, ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setSent(true);
            setLoading(false);
        }, 800);
    };

    return (
        <div className="flex min-h-[60vh] items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo Section */}
                <div className="mb-8 flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                        <Stethoscope size={32} />
                    </div>
                </div>

                <Card className="shadow-xl rounded-2xl border-0">
                    <CardContent className="p-8">
                        <div className="text-center mb-6">
                            <Typography variant="h5" className="font-bold text-slate-800 mb-1">
                                {sent ? "Check Your Email" : "Forgot Password"}
                            </Typography>
                            <Typography variant="body2" className="text-slate-500">
                                {sent
                                    ? "We sent a reset link to your email"
                                    : "Enter your email to receive a reset link"}
                            </Typography>
                        </div>

                        {sent ? (
                            <div className="flex flex-col items-center gap-6">
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                                    <Mail size={40} className="text-blue-600" />
                                </div>
                                <Typography variant="body2" className="text-center text-slate-600">
                                    If an account exists for <strong className="text-slate-900">{email}</strong>, you will receive a password reset link shortly.
                                </Typography>
                                <Button
                                    component={Link}
                                    to="/login"
                                    variant="outlined"
                                    startIcon={<ArrowLeft size={18} />}
                                    className="rounded-xl py-2 px-6 normal-case font-bold"
                                >
                                    Back to Sign In
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                                <TextField
                                    fullWidth
                                    label="Email"
                                    type="email"
                                    placeholder="you@ras.dental"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    variant="outlined"
                                    className="bg-slate-50"
                                />

                                <Button
                                    type="submit"
                                    variant="contained"
                                    fullWidth
                                    disabled={loading}
                                    className="py-3 text-lg font-bold bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all normal-case"
                                >
                                    {loading ? "Sending..." : "Send Reset Link"}
                                </Button>

                                <Link
                                    to="/login"
                                    className="flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors"
                                >
                                    <ArrowLeft size={16} />
                                    Back to Sign In
                                </Link>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
