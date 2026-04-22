import { useState, useCallback } from 'react';

/**
 * Lightweight Snackbar helper.
 * Returns { snack, showSnack, SnackbarProps }
 *
 * Usage:
 *   const { showSnack, snack, handleSnackClose } = useSnack();
 *   // then in JSX:
 *   <Snackbar open={snack.open} onClose={handleSnackClose} autoHideDuration={4000} ...>
 *     <Alert onClose={handleSnackClose} severity={snack.severity}>{snack.message}</Alert>
 *   </Snackbar>
 */
export default function useSnack() {
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

    const showSnack = useCallback((message, severity = 'success') => {
        setSnack({ open: true, message, severity });
    }, []);

    const handleSnackClose = useCallback((_, reason) => {
        if (reason === 'clickaway') return;
        setSnack(prev => ({ ...prev, open: false }));
    }, []);

    return { snack, showSnack, handleSnackClose };
}
