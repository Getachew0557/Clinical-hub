import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
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
            navigate(redirect || "/dashboard");
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
                        <Typography variant="h4" className="font-bold text-slate-900">
                            Ras Dental Clinic
                        </Typography>
                        <Typography variant="body2" className="text-slate-500 font-medium">
                            Specialty Center Management
                        </Typography>
                    </div>
                </div>

                <Card className="shadow-xl rounded-2xl border-0">
                    <CardContent className="p-8">
                        <div className="text-center mb-6">
                            <Typography variant="h5" className="font-bold text-slate-800 mb-1">
                                Sign In
                            </Typography>
                            <Typography variant="body2" className="text-slate-500 text-sm">
                                Enter your credentials to access the system
                            </Typography>
                        </div>

                        {isError && (
                            <Alert severity="error" className="mb-6 rounded-xl text-sm">
                                {message || "Invalid credentials"}
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                placeholder="name@clinic.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                variant="outlined"
                            />

                            <TextField
                                fullWidth
                                label="Password"
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
                                    Forgot password?
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
                                    "Sign In"
                                )}
                            </Button>
                        </form>

                        <Typography variant="body2" className="mt-8 text-center text-slate-600 text-sm">
                            Don't have an account yet?{" "}
                            <Link to="/register" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
                                Create Account
                            </Link>
                        </Typography>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
