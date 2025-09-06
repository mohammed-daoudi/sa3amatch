'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Download, CheckCircle, XCircle, FileText, Image } from 'lucide-react';

interface PaymentProof {
  filename: string;
  url: string;
  uploadedAt: string;
}

interface PaymentProofDisplayProps {
  paymentProof: PaymentProof;
  paymentMethod: string;
  paymentStatus: string;
  bookingId: string;
  onStatusUpdate?: (bookingId: string, status: 'approved' | 'rejected') => void;
  showActions?: boolean;
}

export default function PaymentProofDisplay({
  paymentProof,
  paymentMethod,
  paymentStatus,
  bookingId,
  onStatusUpdate,
  showActions = false
}: PaymentProofDisplayProps) {
  const [isImageLoading, setIsImageLoading] = useState(true);

  const isImage = paymentProof.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPDF = paymentProof.filename.match(/\.pdf$/i);

  const handleApprove = () => {
    if (onStatusUpdate) {
      onStatusUpdate(bookingId, 'approved');
    }
  };

  const handleReject = () => {
    if (onStatusUpdate) {
      onStatusUpdate(bookingId, 'rejected');
    }
  };

  const downloadFile = () => {
    const link = document.createElement('a');
    link.href = paymentProof.url;
    link.download = paymentProof.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>Payment Proof</span>
          <Badge variant={paymentStatus === 'paid' ? 'default' : 'secondary'}>
            {paymentStatus}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Method: {paymentMethod.replace('_', ' ').toUpperCase()}</span>
          <span>Uploaded: {new Date(paymentProof.uploadedAt).toLocaleDateString()}</span>
        </div>

        <div className="flex items-center space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Eye className="w-4 h-4 mr-2" />
                View Proof
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Payment Proof</h3>
                  <Button variant="outline" size="sm" onClick={downloadFile}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  {isImage ? (
                    <div className="relative">
                      {isImageLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        </div>
                      )}
                      <img
                        src={paymentProof.url}
                        alt="Payment proof"
                        className="w-full h-auto max-h-[70vh] object-contain"
                        onLoad={() => setIsImageLoading(false)}
                        onError={() => setIsImageLoading(false)}
                      />
                    </div>
                  ) : isPDF ? (
                    <div className="p-8 text-center">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">PDF Document</p>
                      <p className="text-sm text-gray-500 mb-4">{paymentProof.filename}</p>
                      <Button onClick={downloadFile}>
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Unsupported file type</p>
                      <Button onClick={downloadFile}>
                        <Download className="w-4 h-4 mr-2" />
                        Download File
                      </Button>
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-600">
                  <p><strong>Filename:</strong> {paymentProof.filename}</p>
                  <p><strong>Uploaded:</strong> {new Date(paymentProof.uploadedAt).toLocaleString()}</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={downloadFile}>
            <Download className="w-4 h-4" />
          </Button>
        </div>

        {showActions && paymentStatus === 'pending' && (
          <div className="flex space-x-2 pt-2 border-t">
            <Button
              onClick={handleApprove}
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
            <Button
              onClick={handleReject}
              variant="destructive"
              size="sm"
              className="flex-1"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
          </div>
        )}

        {paymentStatus === 'paid' && (
          <div className="flex items-center text-green-600 text-sm font-medium pt-2 border-t">
            <CheckCircle className="w-4 h-4 mr-2" />
            Payment Verified & Approved
          </div>
        )}
      </CardContent>
    </Card>
  );
}
