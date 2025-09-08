import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Add Document model for storing document metadata
import { Document } from '@/lib/models/Document';
import connectToMongoDB from '@/lib/db';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

// Define upload types
const UPLOAD_TYPES = {
  PROFILE: 'profile',
  DOCUMENT: 'document',
  PAYMENT_PROOF: 'payment_proof',
  ID_DOCUMENT: 'id_document',
  LICENSE: 'license'
} as const;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const bookingId = formData.get('bookingId') as string; // For payment proofs
    const description = formData.get('description') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate upload type
    if (!Object.values(UPLOAD_TYPES).includes(type as any)) {
      return NextResponse.json({
        error: 'Invalid upload type. Allowed types: profile, document, payment_proof, id_document, license'
      }, { status: 400 });
    }

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, and PDF files are allowed' }, { status: 400 });
    }

    // For payment proofs, require bookingId
    if (type === UPLOAD_TYPES.PAYMENT_PROOF && !bookingId) {
      return NextResponse.json({ error: 'Booking ID is required for payment proof uploads' }, { status: 400 });
    }

    // Create upload directory with type-based organization
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', type, userId);

    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);
    const publicUrl = `/uploads/${type}/${userId}/${fileName}`;

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save document metadata to database
    await connectToMongoDB();

    const document = new Document({
      userId,
      fileName: file.name,
      filePath: publicUrl,
      fileType: file.type,
      fileSize: file.size,
      uploadType: type,
      bookingId: type === UPLOAD_TYPES.PAYMENT_PROOF ? bookingId : undefined,
      description: description || undefined,
      uploadedAt: new Date()
    });

    await document.save();

    return NextResponse.json({
      success: true,
      document: {
        id: document._id,
        url: publicUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadType: type,
        bookingId,
        description,
        uploadedAt: document.uploadedAt
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
