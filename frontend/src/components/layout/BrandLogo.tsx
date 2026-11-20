'use client';

import React from 'react';
import Image from 'next/image';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hideText?: boolean;
}

export default function BrandLogo({
  className = '',
  size = 'md',
  hideText = false,
}: BrandLogoProps) {
  const sizeMap = {
    sm: { icon: 'h-8 w-8', text: 'text-base', sub: 'text-[9px]' },
    md: { icon: 'h-10 w-10', text: 'text-lg', sub: 'text-[10px]' },
    lg: { icon: 'h-12 w-12', text: 'text-2xl', sub: 'text-xs' },
    xl: { icon: 'h-16 w-16', text: 'text-3xl', sub: 'text-sm' },
  };

  const { icon, text, sub } = sizeMap[size] || sizeMap.md;

  return (
    <div className={`h-10 flex items-center ${className}`}>
      {/* Brand Pixel Art Logo Emblem */}
      <div
        className={`${icon} relative flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105`}
      >
        <Image
          src="/rentmatch-logo.webp"
          alt="RentMatch AI"
          width={64}
          height={64}
          className="w-full h-full object-contain drop-shadow-sm select-none"
          priority
        />
      </div>

      <div
        className={`overflow-hidden transition-all duration-200 flex flex-col justify-center leading-none min-w-0 ${
          hideText
            ? 'opacity-0 max-w-0 ml-0 pointer-events-none'
            : 'opacity-100 max-w-[160px] ml-2.5'
        }`}
      >
        <span className={`font-black tracking-tight text-zinc-950 dark:text-white truncate whitespace-nowrap ${text}`}>
          RentMatch<span className="text-[#E8510E] dark:text-[#F06A32] font-semibold text-[0.85em]">.ai</span>
        </span>
        <span className={`font-bold uppercase tracking-[0.2em] text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate whitespace-nowrap ${sub}`}>
          Editorial Rentals
        </span>
      </div>
    </div>
  );
}
