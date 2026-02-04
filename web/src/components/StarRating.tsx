import { Star, StarHalf } from 'lucide-react';
import { clsx } from 'clsx';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export default function StarRating({ 
  rating, 
  maxRating = 5,
  size = 'md',
  showValue = false,
  interactive = false,
  onChange,
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleClick = (index: number) => {
    if (interactive && onChange) {
      onChange(index + 1);
    }
  };

  const renderStar = (index: number) => {
    const filled = rating >= index + 1;
    const halfFilled = !filled && rating > index && rating < index + 1;

    return (
      <span
        key={index}
        className={clsx(
          'inline-flex',
          interactive && 'cursor-pointer hover:scale-110 transition-transform'
        )}
        onClick={() => handleClick(index)}
      >
        {halfFilled ? (
          <StarHalf 
            className={clsx(sizeClasses[size], 'text-yellow-400 fill-yellow-400')} 
          />
        ) : (
          <Star 
            className={clsx(
              sizeClasses[size],
              filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            )} 
          />
        )}
      </span>
    );
  };

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxRating }, (_, i) => renderStar(i))}
      {showValue && (
        <span className="ml-1 text-gray-600 font-medium">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
