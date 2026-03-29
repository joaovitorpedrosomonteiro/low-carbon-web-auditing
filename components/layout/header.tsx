'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { logout } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

export function Header() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore logout errors
    }
    clearAuth();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">Low Carbon</span>
          <span className="text-sm text-muted-foreground">| Auditing</span>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span className="text-muted-foreground">{user.email}</span>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}
