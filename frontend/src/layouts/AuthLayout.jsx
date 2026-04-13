import React from 'react';
import { Outlet } from 'react-router-dom';
import { Container } from '@mui/material';
import { motion } from 'framer-motion';

const AuthLayout = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Decorative background elements can stay or be simplified */}
            <div className="absolute top-[-10%] left-[-5%] w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

            <Container maxWidth="sm" className="relative z-10 flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full"
                >
                    <Outlet />
                </motion.div>

                <div className="mt-8 text-center">
                    <p className="text-slate-400 text-sm font-medium">
                        © {new Date().getFullYear()} Clinical Hub Clinic. Professional Management.
                    </p>
                </div>
            </Container>
        </div>
    );
};

export default AuthLayout;
