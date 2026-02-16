import { useState } from 'react';
import { useRegisterUser } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle } from 'lucide-react';

export default function UsernameSetup() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const registerUser = useRegisterUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    setError(null);
    try {
      await registerUser.mutateAsync(username.trim());
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error creating username');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <UserCircle className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Choose a username</CardTitle>
          <CardDescription>
            Choose a unique username. This cannot be changed later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="e.g. john_doe"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(null);
                }}
                className="h-12"
                autoFocus
                disabled={registerUser.isPending}
              />
              <p className="text-xs text-muted-foreground">
                At least 3 characters, no spaces
              </p>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full h-12"
              disabled={registerUser.isPending || username.trim().length < 3}
            >
              {registerUser.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Creating...
                </>
              ) : (
                'Create username'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
