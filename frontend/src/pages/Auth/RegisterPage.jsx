import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { register, reset } from "../../store/slices/authSlice";
import {
    Button,
    TextField,
    Typography,
    Card,
    CardContent,
    Box,
    Alert,
    CircularProgress,
    MenuItem,
    Grid
} from "@mui/material";
import { Stethoscope } from "lucide-react";

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: "patient",
        password: "",
        confirmPassword: ""
    });

    const [localError, setLocalError] = useState("");

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { isLoading, isError, isSuccess, message, user } = useSelector(
        (state) => state.auth
    );

    useEffect(() => {
        if (isSuccess || user) {
            navigate("/");
        }
        // Reset auth state on unmount or if error/success changes
        if (isError || isSuccess) {
            dispatch(reset());
        }
    }, [isSuccess, user, navigate, isError, dispatch]);

    const onChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLocalError("");

        if (formData.password !== formData.confirmPassword) {
            setLocalError("Passwords do not match");
            return;
        }

        // Map to backend fields
        const registrationData = {
            fullName: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            password: formData.password,
            role: formData.role.charAt(0).toUpperCase() + formData.role.slice(1) // Capitalize role
        };

        dispatch(register(registrationData));
    };

    return (
        <div className="flex min-h-[80vh] items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo Section */}
                <div className="mb-8 flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                        <Stethoscope size={32} />
                    </div>
                    <div className="text-center">
                        <Typography variant="h4" className="font-bold text-slate-900">
                            Create Account
                        </Typography>
                        <Typography variant="body2" className="text-slate-500 font-medium">
                            Register for Ras Dental Clinic System
                        </Typography>
                    </div>
                </div>

                <Card className="shadow-xl rounded-2xl border-0">
                    <CardContent className="p-8">
                        <div className="text-center mb-6">
                            <Typography variant="h5" className="font-bold text-slate-800 mb-1">
                                Register
                            </Typography>
                            <Typography variant="body2" className="text-slate-500 text-sm">
                                Fill in your details to get started
                            </Typography>
                        </div>

                        {(isError || localError) && (
                            <Alert severity="error" className="mb-6 rounded-xl text-sm">
                                {localError || message || "Registration failed"}
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="First Name"
                                        name="firstName"
                                        placeholder="John"
                                        value={formData.firstName}
                                        onChange={onChange}
                                        required
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Last Name"
                                        name="lastName"
                                        placeholder="Doe"
                                        value={formData.lastName}
                                        onChange={onChange}
                                        required
                                        variant="outlined"
                                    />
                                </Grid>
                            </Grid>

                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={onChange}
                                required
                                variant="outlined"
                            />

                            <TextField
                                fullWidth
                                label="Phone"
                                name="phone"
                                type="tel"
                                placeholder="+1 555-0100"
                                value={formData.phone}
                                onChange={onChange}
                                required
                                variant="outlined"
                            />

                            <TextField
                                fullWidth
                                select
                                label="Role"
                                name="role"
                                value={formData.role}
                                onChange={onChange}
                                variant="outlined"
                            >
                                <MenuItem value="patient">Patient</MenuItem>
                                <MenuItem value="doctor">Doctor</MenuItem>
                                <MenuItem value="receptionist">Receptionist</MenuItem>
                            </TextField>

                            <TextField
                                fullWidth
                                label="Password"
                                name="password"
                                type="password"
                                placeholder="Min 8 characters"
                                value={formData.password}
                                onChange={onChange}
                                required
                                variant="outlined"
                            />

                            <TextField
                                fullWidth
                                label="Confirm Password"
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={onChange}
                                required
                                variant="outlined"
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                disabled={isLoading}
                                className="mt-2 py-3 text-lg font-bold bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all normal-case"
                            >
                                {isLoading ? (
                                    <CircularProgress size={24} color="inherit" />
                                ) : (
                                    "Create Account"
                                )}
                            </Button>
                        </form>

                        <Typography variant="body2" className="mt-8 text-center text-slate-600 text-sm">
                            Already have an account?{" "}
                            <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
                                Sign In
                            </Link>
                        </Typography>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
