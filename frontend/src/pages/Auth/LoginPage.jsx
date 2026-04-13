import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { login, reset } from "../../store/slices/authSlice";
import {
    Button,
    TextField,
    Typography,
    Card,
    CardContent,
    IconButton,
    InputAdornment,
    Box,
    Alert,
    CircularProgress
} from "@mui/material";
import { Stethoscope, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const { t } = useTranslation();

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { user, isLoading, isError, isSuccess, message } = useSelector(
        (state) => state.auth
    );

    const location = useLocation();

    useEffect(() => {
        if (isSuccess || user) {
            const params = new URLSearchParams(location.search);
            const redirect = params.get("redirect");
            // Validate: only allow relative paths, prevent open redirect
            const safeRedirect = redirect && redirect.startsWith('/') && !redirect.startsWith('//')
                ? redirect
                : '/dashboard';
            navigate(safeRedirect);
        }
        dispatch(reset());
    }, [user, isSuccess, navigate, dispatch, location]);

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(login({ email, password }));
    };

    return (
        <div className="flex min-h-[60vh] items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo Section */}
                <div className="mb-8 flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                        <Stethoscope size={32} />
                    </div>
                    <div className="text-center">
                        <Typography variant="h5" color="text.primary">
                            {t('auth.login.systemName')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                            {t('auth.login.systemSubtitle')}
                        </Typography>
                    </div>
                </div>

                <Card className="shadow-xl rounded-2xl border-0">
                    <CardContent className="p-8">
                        <div className="text-center mb-6">
                            <Typography variant="subtitle1" color="text.primary" sx={{ mb: 0.5 }}>
                                {t('auth.login.title')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {t('auth.login.subtitle')}
                            </Typography>
                        </div>

                        {isError && (
                            <Alert severity="error" className="mb-6 rounded-xl text-sm">
                                {message || t('auth.login.invalidCredentials')}
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            <TextField
                                fullWidth
                                label={t('auth.login.email')}
                                type="email"
                                placeholder="name@clinic.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                variant="outlined"
                            />

                            <TextField
                                fullWidth
                                label={t('auth.login.password')}
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                variant="outlined"
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <div className="flex justify-end -mt-2">
                                <Link
                                    to="/forgot-password"
                                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                                >
                                    {t('auth.login.forgotPassword')}
                                </Link>
                            </div>

                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                disabled={isLoading}
                                className="py-3 text-lg font-bold bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all normal-case"
                            >
                                {isLoading ? (
                                    <CircularProgress size={24} color="inherit" />
                                ) : (
                                    t('auth.login.submit')
                                )}
                            </Button>
                        </form>

                        <Typography variant="body2" sx={{ mt: 4, textAlign: 'center', color: 'text.secondary' }}>
                            {t('auth.login.noAccount')}{" "}
                            <Link to="/register" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
                                {t('auth.login.register')}
                            </Link>
                        </Typography>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
