// ── CSV Export Utility ───────────────────────────────────────────────────────────

export const exportToCSV = (data, filename, headers = null) => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Get headers from data or use provided headers
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    csvHeaders.join(','),
    ...data.map((row) =>
      csvHeaders
        .map((header) => {
          const value = row[header];
          // Handle null/undefined
          if (value === null || value === undefined) return '';
          // Handle objects/arrays
          if (typeof value === 'object') return JSON.stringify(value);
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(',')
    ),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

// ── Excel Export Utility (using xlsx library) ───────────────────────────────────────

import * as XLSX from 'xlsx';

export const exportToExcel = (data, filename, sheetName = 'Sheet1') => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Create workbook
  const workbook = XLSX.utils.book_new();
  
  // Convert data to worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Generate and download
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

// ── JSON Export Utility ───────────────────────────────────────────────────────────

export const exportToJSON = (data, filename) => {
  if (!data) {
    console.warn('No data to export');
    return;
  }

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

// ── PDF Export Utility (using jsPDF) ───────────────────────────────────────────────

import jsPDF from 'jspdf';

export const exportToPDF = (data, filename, title = 'Report', headers = null) => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
  
  // Prepare table data
  const tableHeaders = headers || Object.keys(data[0]);
  const tableData = data.map((row) => tableHeaders.map((header) => row[header] || ''));
  
  // Simple table layout without autoTable
  let y = 40;
  const cellHeight = 10;
  const cellWidth = 40;
  const fontSize = 8;
  
  doc.setFontSize(fontSize);
  
  // Draw headers
  doc.setFillColor(13, 148, 136);
  doc.setTextColor(255);
  tableHeaders.forEach((header, index) => {
    doc.rect(14 + index * cellWidth, y, cellWidth, cellHeight, 'F');
    doc.text(header, 16 + index * cellWidth, y + 7);
  });
  
  // Draw data rows
  doc.setTextColor(0);
  y += cellHeight;
  
  tableData.forEach((row, rowIndex) => {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    
    row.forEach((cell, cellIndex) => {
      if (rowIndex % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(14 + cellIndex * cellWidth, y, cellWidth, cellHeight, 'F');
      }
      doc.setTextColor(0);
      const text = String(cell).substring(0, 20);
      doc.text(text, 16 + cellIndex * cellWidth, y + 7);
    });
    
    y += cellHeight;
  });
  
  // Save
  doc.save(`${filename}.pdf`);
};

// ── Format data for export ─────────────────────────────────────────────────────────

export const formatDataForExport = (data, formatters = {}) => {
  return data.map((item) => {
    const formatted = { ...item };
    
    Object.keys(formatters).forEach((key) => {
      if (formatted[key] !== undefined) {
        formatted[key] = formatters[key](formatted[key]);
      }
    });
    
    return formatted;
  });
};

// ── Common formatters ─────────────────────────────────────────────────────────────

export const dateFormatters = {
  date: (value) => (value ? new Date(value).toLocaleDateString() : ''),
  dateTime: (value) => (value ? new Date(value).toLocaleString() : ''),
  time: (value) => (value ? new Date(value).toLocaleTimeString() : ''),
};

export const numberFormatters = {
  currency: (value) => (value ? `ETB ${parseFloat(value).toLocaleString()}` : ''),
  number: (value) => (value !== undefined ? parseFloat(value).toLocaleString() : ''),
  percentage: (value) => (value !== undefined ? `${parseFloat(value).toFixed(2)}%` : ''),
};

export const booleanFormatters = {
  yesNo: (value) => (value ? 'Yes' : 'No'),
  activeInactive: (value) => (value ? 'Active' : 'Inactive'),
  trueFalse: (value) => (value ? 'True' : 'False'),
};

export default {
  exportToCSV,
  exportToExcel,
  exportToJSON,
  exportToPDF,
  formatDataForExport,
  dateFormatters,
  numberFormatters,
  booleanFormatters,
};
