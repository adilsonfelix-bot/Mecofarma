import { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface BookCoverProps {
  src: string;
  title: string;
  author: string;
  className?: string;
}

export function BookCover({ src, title, author, className = '' }: BookCoverProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`relative flex flex-col justify-between bg-[#ECEAE4] border border-[#DDD9CE] p-5 text-[#18181B] select-none ${className}`}
      >
        <div className="flex items-center justify-between text-[11px] font-mono text-[#52525B] tracking-wide">
          <span>MERIDIANO</span>
          <BookOpen className="w-4 h-4 text-[#1E3A34]" />
        </div>
        <div className="my-auto py-4 border-y border-[#D4CFC3]">
          <p className="font-serif text-lg font-semibold leading-snug text-[#18181B] line-clamp-3">
            {title}
          </p>
        </div>
        <p className="text-xs text-[#52525B] truncate">{author}</p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`Capa do livro ${title} de ${author}`}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`object-cover bg-[#ECEAE4] ${className}`}
    />
  );
}
