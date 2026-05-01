import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "./formatCurrency";

export const generateInvoicePDF = (invoice) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(30, 64, 175); // Blue-600
  doc.text('INVOICE', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Invoice #: ${invoice.invoice_number}`, 14, 30);
  doc.text(`Status: ${invoice.status}`, 14, 35);

  // Client Details (Right side)
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Bill To:', 140, 22);
  doc.setFontSize(10);
  doc.text(invoice.client_name, 140, 28);
  doc.setTextColor(100);
  doc.text(invoice.client_email, 140, 33);
  if (invoice.client_address) {
    const addressLines = doc.splitTextToSize(invoice.client_address, 50);
    doc.text(addressLines, 140, 38);
  }

  // Dates
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.text(`Issue Date: ${invoice.issue_date}`, 14, 50);
  doc.text(`Due Date: ${invoice.due_date}`, 14, 55);

  // Line Items Table
  const tableColumn = ["Description", "Quantity", "Unit Price", "Total"];
  const tableRows = [];

  invoice.items.forEach(item => {
    const itemData = [
      item.description,
      item.quantity,
      formatCurrency(item.unit_price).replace('₹', 'Rs. '),
      formatCurrency(item.total_price).replace('₹', 'Rs. ')
    ];
    tableRows.push(itemData);
  });

  // Using autoTable correctly as a function
  autoTable(doc, {
    startY: 65,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 64, 175] },
    margin: { top: 10 },
  });

  // Totals
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text(`Grand Total: ${formatCurrency(invoice.total).replace('₹', 'Rs. ')}`, 140, finalY);

  // Footer
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150);
  doc.text('Thank you for your business!', 105, finalY + 20, null, null, 'center');

  // Save the PDF safely
  doc.save(`${invoice.invoice_number || "invoice"}.pdf`);
};
