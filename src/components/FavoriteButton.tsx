"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Heart, Loader2 } from "lucide-react";
import { useAuth } from '@clerk/nextjs';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  fieldId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  showText?: boolean;
}

export default function FavoriteButton({
  fieldId,
  variant = "outline",
  size = "sm",
  className,
  showText = false
}: FavoriteButtonProps) {
  const { isSignedIn, userId } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (isSignedIn && userId) {
      checkFavoriteStatus();
    }
  }, [isSignedIn, userId, fieldId]);

  const checkFavoriteStatus = async () => {
    try {
      const response = await fetch(`/api/favorites/${fieldId}`);
      if (response.ok) {
        const data = await response.json();
        setIsFavorited(data.isFavorited);
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    } finally {
      setInitialLoad(false);
    }
  };

  const toggleFavorite = async () => {
    if (!isSignedIn) {
      // Redirect to sign in or show modal
      window.location.href = '/sign-in';
      return;
    }

    setLoading(true);
    try {
      const method = isFavorited ? 'DELETE' : 'POST';
      const url = isFavorited
        ? `/api/favorites?fieldId=${fieldId}`
        : '/api/favorites';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: method === 'POST' ? JSON.stringify({ fieldId }) : undefined,
      });

      if (response.ok) {
        const data = await response.json();
        setIsFavorited(data.isFavorited);
      } else {
        console.error('Failed to toggle favorite');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoad && isSignedIn) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Loader2 className="w-4 h-4 animate-spin" />
        {showText && <span className="ml-2">Loading...</span>}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleFavorite}
      disabled={loading}
      className={cn(
        isFavorited && variant === "outline" && "border-red-500 text-red-500 hover:bg-red-50",
        isFavorited && variant === "ghost" && "text-red-500 hover:text-red-700 hover:bg-red-50",
        className
      )}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Heart
          className={cn(
            "w-4 h-4",
            isFavorited && "fill-current"
          )}
        />
      )}
      {showText && (
        <span className="ml-2">
          {isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
        </span>
      )}
    </Button>
  );
}
