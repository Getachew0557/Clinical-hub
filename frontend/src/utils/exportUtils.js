import { jsPDF } from 'jspdf';
import { toPng, toJpeg } from 'html-to-image';
import html2canvas from 'html2canvas';

/**
 * Export a DOM element as an Image (PNG or JPEG)
 */
export const exportAsImage = async (elementId, fileName = 'chart', format = 'png') => {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
        const dataUrl = format === 'png'
            ? await toPng(element, { quality: 0.95, backgroundColor: '#ffffff' })
            : await toJpeg(element, { quality: 0.95, backgroundColor: '#ffffff' });

        const link = document.createElement('a');
        link.download = `${fileName}.${format}`;
        link.href = dataUrl;
        link.click();
    } catch (err) {
        console.error('Failed to export image:', err);
    }
};

/**
 * Export a DOM element as a PDF using html-to-image (Higher quality)
 */
export const exportAsPDF = async (elementId, fileName = 'report') => {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
        // Use html-to-image which is often more reliable for SVGs/Recharts
        const dataUrl = await toPng(element, {
            quality: 1.0,
            backgroundColor: '#ffffff',
            pixelRatio: 2 // Higher resolution
        });

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: 'a4'
        });

        const imgProps = pdf.getImageProperties(dataUrl);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${fileName}.pdf`);
    } catch (err) {
        console.error('Failed to export PDF:', err);
        // Fallback to html2canvas if html-to-image fails
        try {
            const canvas = await html2canvas(element, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF();
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${fileName}.pdf`);
        } catch (fallbackErr) {
            console.error('Fallback PDF export failed:', fallbackErr);
        }
    }
};
