import React from 'react';
import { Check, X } from 'lucide-react';
import { Box, Typography, LinearProgress } from '@mui/material';

const PasswordStrengthMeter = ({ password }) => {
  const requirements = [
    { label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
    { label: 'One number', test: (p) => /[0-9]/.test(p) },
    { label: 'One special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
  ];

  const passedRequirements = requirements.filter((req) => req.test(password)).length;
  const strength = passedRequirements / requirements.length;
  const strengthColor = strength < 0.4 ? '#dc2626' : strength < 0.7 ? '#f59e0b' : '#059669';
  const strengthLabel = strength < 0.4 ? 'Weak' : strength < 0.7 ? 'Medium' : 'Strong';

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Password Strength
        </Typography>
        <Typography variant="caption" sx={{ color: strengthColor, fontWeight: 600 }}>
          {strengthLabel}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={strength * 100}
        sx={{
          height: 6,
          borderRadius: 3,
          backgroundColor: '#e2e8f0',
          '& .MuiLinearProgress-bar': {
            backgroundColor: strengthColor,
            borderRadius: 3,
          },
        }}
      />
      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {requirements.map((req) => {
          const passed = req.test(password);
          return (
            <Box key={req.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {passed ? (
                <Check size={14} color="#059669" />
              ) : (
                <X size={14} color="#94a3b8" />
              )}
              <Typography
                variant="caption"
                sx={{
                  color: passed ? '#059669' : '#94a3b8',
                  fontWeight: passed ? 500 : 400,
                }}
              >
                {req.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default PasswordStrengthMeter;
