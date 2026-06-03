import { Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AlertsPage() {
  return (
    <div className="wrap" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <div className="mx-auto w-full max-w-3xl">
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
      </div>
    </div>
  );
}
