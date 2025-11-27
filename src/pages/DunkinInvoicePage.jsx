import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, RotateCcw } from 'lucide-react';
import FloatingLabelInput from '../components/FloatingLabelInput';
import dunkinLogo from '../assets/dunkin-logo.png';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const DunkinInvoicePage = () => {
  const navigate = useNavigate();
  const invoiceRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const initialState = {
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    billTo: '',
    items: [
      { name: 'Assorted Brownies (600g each box – 18 pieces)', qty: 3, rate: 900, amount: 2700 },
      { name: 'Toppings: Cashews/Almonds/Hazelnuts/Chocochips/etc', qty: 0, rate: 0, amount: 0 },
      { name: 'Cookies (350g – 10 pieces)', qty: 2, rate: 400, amount: 800 },
      { name: 'Packaging & Transport', qty: 1, rate: 300, amount: 300 },
    ],
    taxPercentage: 5,
    discount: 190,
    notes: 'Ready to sweeten the deal? Kindly pay via UPI: ashwarya99a@okhdfc.com',
  };

  const [formData, setFormData] = useState(initialState);

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateTax = () => {
    return (calculateSubtotal() * formData.taxPercentage) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() - formData.discount;
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = field === 'name' ? value : parseFloat(value) || 0;
    if (field === 'qty' || field === 'rate') {
      newItems[index].amount = newItems[index].qty * newItems[index].rate;
    }
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: '', qty: 0, rate: 0, amount: 0 }],
    });
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    }
  };

  const handleReset = () => {
    setFormData({
      ...initialState,
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
  };

  const handleDownloadPDF = async () => {
    if (isDownloading || !invoiceRef.current) return;

    setIsDownloading(true);
    try {
      const element = invoiceRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Scale image to fit within A4 while preserving aspect ratio
      const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
      const imgWidth = canvas.width * ratio;
      const imgHeight = canvas.height * ratio;

      // Center the image on the page
      const x = (pdfWidth - imgWidth) / 2;
      const y = (pdfHeight - imgHeight) / 2;

      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      pdf.save(`${formData.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header with buttons */}
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
            <Button onClick={handleDownloadPDF} disabled={isDownloading} className="gap-2">
              <Download className="h-4 w-4" />
              {isDownloading ? 'Downloading...' : 'Download PDF'}
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Form Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Invoice Details</h2>

            {/* Invoice Info */}
            <div className="space-y-4">
              <FloatingLabelInput
                id="invoiceNumber"
                label="Invoice Number"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <FloatingLabelInput
                  id="invoiceDate"
                  label="Invoice Date"
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                />
                <FloatingLabelInput
                  id="dueDate"
                  label="Due Date"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
              <FloatingLabelInput
                id="billTo"
                label="Bill To (Customer Name)"
                value={formData.billTo}
                onChange={(e) => setFormData({ ...formData, billTo: e.target.value })}
              />
            </div>

            {/* Items Table */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Items</h3>
              <div className="space-y-2">
                {formData.items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-2">
                    <FloatingLabelInput
                      id={`itemName${index}`}
                      label="Item Name"
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <FloatingLabelInput
                        id={`itemQty${index}`}
                        label="Qty"
                        type="number"
                        value={item.qty}
                        onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                      />
                      <FloatingLabelInput
                        id={`itemRate${index}`}
                        label="Rate (₹)"
                        type="number"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                      />
                      <FloatingLabelInput
                        id={`itemAmount${index}`}
                        label="Amount (₹)"
                        value={item.amount.toFixed(2)}
                        disabled
                      />
                    </div>
                    {formData.items.length > 1 && (
                      <button
                        onClick={() => removeItem(index)}
                        className="text-red-500 text-sm hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <Button onClick={addItem} variant="outline" className="mt-3 w-full">
                + Add Item
              </Button>
            </div>

            {/* Tax and Discount */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <FloatingLabelInput
                  id="taxPercentage"
                  label="Tax (%)"
                  type="number"
                  value={formData.taxPercentage}
                  onChange={(e) => setFormData({ ...formData, taxPercentage: parseFloat(e.target.value) || 0 })}
                />
                <FloatingLabelInput
                  id="discount"
                  label="Discount (₹)"
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          {/* Preview Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 overflow-auto max-h-[800px]">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Preview</h2>
            <div ref={invoiceRef} className="bg-white p-8 min-h-[600px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              {/* Header */}
              <div className="flex justify-between items-start mb-8 pb-4 border-b-2 border-pink-200">
                <div>
                  <img src={dunkinLogo} alt="Dunkin Delicacies Logo" className="h-16 w-auto mb-2" />
                  <h1 className="text-2xl font-bold text-gray-800">Dunkin Delicacies — By AISH</h1>
                </div>
                <div className="text-right">
                  <h2 className="text-3xl font-bold text-gray-800">INVOICE</h2>
                  <p className="text-gray-600 mt-1">#{formData.invoiceNumber}</p>
                </div>
              </div>

              {/* Invoice Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Bill To:</p>
                  <p className="font-semibold text-gray-800">{formData.billTo || 'Customer Name'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Invoice Date: <span className="font-medium text-gray-800">{formData.invoiceDate}</span></p>
                  <p className="text-sm text-gray-500">Due Date: <span className="font-medium text-gray-800">{formData.dueDate}</span></p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full mb-6">
                <thead>
                  <tr className="bg-gradient-to-r from-pink-100 to-purple-100">
                    <th className="text-left p-2 text-sm font-semibold text-gray-700">Item</th>
                    <th className="text-center p-2 text-sm font-semibold text-gray-700">Qty</th>
                    <th className="text-right p-2 text-sm font-semibold text-gray-700">Rate (₹)</th>
                    <th className="text-right p-2 text-sm font-semibold text-gray-700">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="p-2 text-sm text-gray-700">{item.name || '-'}</td>
                      <td className="text-center p-2 text-sm text-gray-700">{item.qty}</td>
                      <td className="text-right p-2 text-sm text-gray-700">{item.rate.toFixed(2)}</td>
                      <td className="text-right p-2 text-sm text-gray-700">{item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end mb-6">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium text-gray-800">₹{calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax ({formData.taxPercentage}%):</span>
                    <span className="font-medium text-gray-800">₹{calculateTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-medium text-gray-800">-₹{formData.discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t-2 border-pink-200 pt-2">
                    <span className="text-gray-800">Total:</span>
                    <span className="text-pink-600">₹{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {formData.notes && (
                <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DunkinInvoicePage;
