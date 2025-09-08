import { NextRequest, NextResponse } from 'next/server';
import { Review } from '@/lib/models/Review';
import { Field } from '@/lib/models/Field';
import connectToMongoDB from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToMongoDB();

    const fieldId = params.id;

    // Get all reviews for this field
    const reviews = await Review.find({ fieldId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      reviews: reviews.map(review => ({
        id: review._id,
        userId: review.userId,
        userName: review.userName,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToMongoDB();

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fieldId = params.id;
    const { rating, comment, userName } = await req.json();

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    if (!comment || comment.trim().length < 10) {
      return NextResponse.json({ error: 'Comment must be at least 10 characters' }, { status: 400 });
    }

    // Check if field exists
    const field = await Field.findById(fieldId);
    if (!field) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    // Check if user has already reviewed this field
    const existingReview = await Review.findOne({ fieldId, userId });
    if (existingReview) {
      return NextResponse.json({ error: 'You have already reviewed this field' }, { status: 400 });
    }

    // Create new review
    const review = new Review({
      fieldId,
      userId,
      userName: userName || 'Anonymous',
      rating,
      comment: comment.trim()
    });

    await review.save();

    // Update field rating
    const allReviews = await Review.find({ fieldId });
    const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await Field.findByIdAndUpdate(fieldId, {
      'rating.average': Math.round(averageRating * 10) / 10,
      'rating.count': allReviews.length
    });

    return NextResponse.json({
      success: true,
      review: {
        id: review._id,
        userId: review.userId,
        userName: review.userName,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
