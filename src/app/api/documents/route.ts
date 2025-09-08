import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { Document } from '@/lib/models/Document';
import connectToMongoDB from '@/lib/db';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToMongoDB();

    const documents = await Document.find({ userId }).sort({ uploadedAt: -1 });

    return NextResponse.json({
      documents: documents.map(doc => ({
        id: doc._id,
        fileName: doc.fileName,
        filePath: doc.filePath,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        documentType: doc.documentType,
        verified: doc.verified,
        uploadedAt: doc.uploadedAt,
        verifiedAt: doc.verifiedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    await connectToMongoDB();

    const document = await Document.findOneAndDelete({
      _id: documentId,
      userId
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
