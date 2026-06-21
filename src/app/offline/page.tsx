import React from 'react';
import Link from 'next/link';
import { WifiOff, Home, RefreshCw } from 'lucide-react';

export const metadata = {
  title: 'لا يوجد اتصال بالإنترنت',
};

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="bg-orange-50 dark:bg-orange-950/20 p-6 rounded-full mb-6">
        <WifiOff className="w-16 h-16 text-orange-500" />
      </div>
      
      <h1 className="text-3xl font-bold mb-4 text-foreground">لا يوجد اتصال بالإنترنت</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        يبدو أنك فقدت الاتصال بالإنترنت. يرجى التحقق من اتصالك والمحاولة مرة أخرى.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <a 
          href="/"
          className="flex items-center justify-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-full hover:bg-orange-600 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          <span>إعادة المحاولة</span>
        </a>
        
        <Link 
          href="/"
          className="flex items-center justify-center gap-2 bg-background text-foreground px-6 py-3 rounded-full hover:bg-muted transition-colors border border-border"
        >
          <Home className="w-5 h-5" />
          <span>الرئيسية</span>
        </Link>
      </div>
    </div>
  );
}
