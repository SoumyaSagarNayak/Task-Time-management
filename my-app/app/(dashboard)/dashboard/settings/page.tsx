'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your application preferences and account settings</p>
      </div>

      <Card className="border-blue-100 shadow-sm overflow-hidden rounded-2xl">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-100 flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div>
            <CardTitle className="text-lg text-blue-900">Personal Account</CardTitle>
            <CardDescription className="text-xs text-blue-600/70">Manage your profile information and contact details</CardDescription>
          </div>
        </div>
        <CardContent className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            You can configure your name, email address, and avatar under your personal profile settings page.
          </p>
          <div>
            <Link href="/dashboard/profile">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all">
                Go to Profile Settings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
