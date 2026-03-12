import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import billingService from '../services/billingService';

const BillingPage = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    const { user } = useSelector((state) => state.auth);
    const patientId = user?.id;


    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const data = await billingService.getInvoices(patientId);
            setInvoices(data);
            setError(null);
        } catch (err) {
            setError('Failed to load invoices. Please try again later.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async (invoiceId, amount) => {
        try {
            setProcessing(true);
            await billingService.payInvoice(invoiceId, amount, 'Simulated Credit Card');
            alert('Payment Successful!');
            fetchInvoices(); // Refresh list
        } catch (err) {
            alert('Payment failed. Please try again.');
            console.error(err);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-white">Loading Invoices...</div>;

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-white mb-6">Patient Billing Dashboard</h1>

            {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
                    {error}
                </div>
            )}

            <div className="grid gap-6">
                {invoices.length === 0 ? (
                    <div className="bg-white/5 p-8 rounded-xl text-center text-gray-400">
                        No invoices found.
                    </div>
                ) : (
                    invoices.map(invoice => (
                        <div key={invoice.id} className="bg-white/10 p-6 rounded-xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center">
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-1">
                                    Invoice: {invoice.description || 'Dental Service'}
                                </h3>
                                <p className="text-gray-400">Created: {new Date(invoice.createdAt).toLocaleDateString()}</p>
                                <p className={`mt-2 font-medium ${invoice.status === 'Paid' ? 'text-green-400' : 'text-yellow-400'}`}>
                                    Status: {invoice.status}
                                </p>
                            </div>

                            <div className="mt-4 md:mt-0 text-right">
                                <p className="text-2xl font-bold text-white mb-3">${invoice.amount}</p>
                                {invoice.status !== 'Paid' && (
                                    <button
                                        onClick={() => handlePayment(invoice.id, invoice.amount)}
                                        disabled={processing}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
                                    >
                                        {processing ? 'Processing...' : 'Pay Now'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default BillingPage;
