import { Bell } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AlertsPage() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-brand-amber" />
              Rate Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Alerts need Supabase and email delivery to be configured. This placeholder keeps the route live for the MVP.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
