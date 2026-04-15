import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button, TextField, Typography, Card, CardContent, Alert, CircularProgress, IconButton, InputAdornment } from "@mui/material";
import { Stethoscope, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import authService from "../../api/auth.service";

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!token) setError("Invalid or missing reset token. Please request a new reset link.");
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            await authService.resetPassword(token, newPassword);
            setSuccess(true);
            setTimeout(() => navigate("/login"), 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to reset password. The link may have expired.");
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
                                {success ? "Password Reset!" : "Set New Password"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {success ? "Redirecting to login..." : "Enter your new password below"}
                            </Typography>
                        </div>

                        {success ? (
                            <div className="flex flex-col items-center gap-4">
                                <CheckCircle2 size={56} className="text-green-500" />
                                <Typography variant="body2" color="text.secondary" textAlign="center">
                                    Your password has been reset successfully. You will be redirected to login shortly.
                                </Typography>
                                <Button component={Link} to="/login" variant="contained" sx={{ borderRadius: 3, textTransform: 'none' }}>
                                    Go to Login
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                                {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
                                <TextField fullWidth label="New Password"
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                                    required disabled={!token}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setShowPassword(!showPassword)}>
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }} />
                                <TextField fullWidth label="Confirm New Password"
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                    required disabled={!token} />
                                <Button type="submit" variant="contained" fullWidth
                                    disabled={loading || !token}
                                    sx={{ borderRadius: 3, py: 1.5, textTransform: 'none', fontWeight: 700 }}>
                                    {loading ? <CircularProgress size={22} color="inherit" /> : "Reset Password"}
                                </Button>
                                <Link to="/forgot-password"
                                    className="text-center text-sm text-blue-600 hover:underline font-medium">
                                    Request a new reset link
                                </Link>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
