'use client'
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavItem({ icon, label, href }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href}>
      <div className={`
        flex items-center gap-3 px-4 py-3 rounded-lg
        transition-all duration-200
        ${isActive 
          ? 'bg-blue-50 text-blue-600 shadow-sm' 
          : 'text-gray-600 hover:bg-white hover:shadow-sm'
        }
      `}>
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
    </Link>
  );
}