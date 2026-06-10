"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCurrentUser, updateUserProfile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { user: clerkUser } = useUser();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  // Get current user data
  const { data: userData } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const token = await getToken();
      return fetchCurrentUser(token);
    },
    enabled: !!clerkUser,
  });

  useEffect(() => {
    if (!userData) return;
    setFirstName(userData.firstName || "");
    setLastName(userData.lastName || "");
    setEmail(userData.email || "");
  }, [userData]);

  // Update user mutation
  const updateUser = useMutation({
    mutationFn: async (data: any) => {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      return updateUserProfile(data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
        variant: 'default',
      });
    },
    onError: (err: any) => {
      const errorMsg = err?.response?.data?.message || 
                       err?.message || 
                       'Failed to update profile';
      console.error('Update user mutation error:', {
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        message: err?.message,
        responseMessage: err?.response?.data?.message,
      });
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();
    const profileData: any = {};

    if (trimmedFirstName.length >= 2) {
      profileData.firstName = trimmedFirstName;
    }
    if (trimmedLastName.length >= 2) {
      profileData.lastName = trimmedLastName;
    }
    if (trimmedEmail.length > 0) {
      profileData.email = trimmedEmail;
    }

    if (Object.keys(profileData).length > 0) {
      updateUser.mutate(profileData);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">Account Settings</h1>
        <p className="text-blue-600/80 mt-1">Manage your personal profile details.</p>
      </div>

      <Card className="border-blue-100 shadow-sm overflow-hidden rounded-2xl">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-100 flex items-center gap-3">
           <div className="bg-blue-600 text-white p-2 rounded-lg">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
           </div>
           <div>
             <CardTitle className="text-lg text-blue-900">Personal Profile</CardTitle>
             <p className="text-xs text-blue-600/70">Update your name and personal details</p>
           </div>
        </div>
        <CardContent className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-gray-700 font-medium">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={userData?.firstName || "e.g. John"}
                className="focus-visible:ring-blue-500 border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-gray-700 font-medium">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={userData?.lastName || "e.g. Doe"}
                className="focus-visible:ring-blue-500 border-gray-200"
              />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={userData?.email || "john.doe@example.com"}
                className="focus-visible:ring-blue-500 border-gray-200"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            disabled={updateUser.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-xl shadow-md transition-all hover:shadow-lg"
          >
            {updateUser.isPending ? "Saving..." : "Save All Changes"}
          </Button>
      </div>
    </div>
  );
}
