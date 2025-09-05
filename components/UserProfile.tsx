'use client';

import { useUser } from '@clerk/nextjs';
import { useState } from 'react';
import { UserIcon, EnvelopeIcon, CalendarIcon, CogIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useUserSync } from '@/hooks/useUserSync';

export function UserProfile() {
  const { user, isLoaded } = useUser();
  const { userProfile } = useUserSync();
  const [activeSection, setActiveSection] = useState<'profile' | 'settings' | 'activity'>('profile');

  if (!isLoaded) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          No user information available
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'profile' as const, label: 'Profile Info', icon: UserIcon },
    { id: 'settings' as const, label: 'Settings', icon: CogIcon },
    { id: 'activity' as const, label: 'Activity', icon: CalendarIcon },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Management</h2>
        <p className="text-gray-600">Manage your profile and account settings</p>
      </div>

      {/* Section Navigation */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeSection === section.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Profile Info Section */}
      {activeSection === 'profile' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {user.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt="Profile"
                    className="h-20 w-20 rounded-full border-4 border-white"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                    <UserIcon className="h-10 w-10 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-2xl font-bold">
                  {user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'}
                </h3>
                <p className="text-blue-100">
                  @{user.username || user.id.slice(0, 8)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <UserIcon className="h-5 w-5 text-gray-500 mr-2" />
                <h4 className="text-lg font-semibold text-gray-800">Basic Information</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">First Name</label>
                  <p className="text-gray-800">{user.firstName || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Last Name</label>
                  <p className="text-gray-800">{user.lastName || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Username</label>
                  <p className="text-gray-800">{user.username || 'Not set'}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <EnvelopeIcon className="h-5 w-5 text-gray-500 mr-2" />
                <h4 className="text-lg font-semibold text-gray-800">Contact Information</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Primary Email</label>
                  <p className="text-gray-800">{user.primaryEmailAddress?.emailAddress || 'No email'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email Verified</label>
                  <p className="text-gray-800">
                    {user.primaryEmailAddress?.verification?.status === 'verified' ? (
                      <span className="text-green-600">✓ Verified</span>
                    ) : (
                      <span className="text-yellow-600">⚠ Not verified</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone Number</label>
                  <p className="text-gray-800">{user.primaryPhoneNumber?.phoneNumber || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <CalendarIcon className="h-5 w-5 text-gray-500 mr-2" />
              <h4 className="text-lg font-semibold text-gray-800">Account Information</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">User ID</label>
                <p className="text-gray-800 font-mono text-sm">{user.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Created</label>
                <p className="text-gray-800">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Last Sign In</label>
                <p className="text-gray-800">{user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : 'Unknown'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Two-Factor Auth</label>
                <p className="text-gray-800">
                  {user.twoFactorEnabled ? (
                    <span className="text-green-600">✓ Enabled</span>
                  ) : (
                    <span className="text-gray-500">Disabled</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Section */}
      {activeSection === 'settings' && (
        <div className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Account Settings</h3>
            <p className="text-yellow-700 mb-4">
              To modify your account settings, profile information, or security settings, 
              please use the Clerk user management interface.
            </p>
            <button
              onClick={() => window.open('https://accounts.clerk.dev/user', '_blank')}
              className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <CogIcon className="h-5 w-5 mr-2" />
              Open Profile Settings
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Security</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Two-Factor Authentication</span>
                  <span className={user.twoFactorEnabled ? 'text-green-600' : 'text-gray-500'}>
                    {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Email Verification</span>
                  <span className={user.primaryEmailAddress?.verification?.status === 'verified' ? 'text-green-600' : 'text-yellow-600'}>
                    {user.primaryEmailAddress?.verification?.status === 'verified' ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Preferences</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Theme</span>
                  <span className="text-gray-800">Light</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Language</span>
                  <span className="text-gray-800">English</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Section */}
      {activeSection === 'activity' && (
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <div>
                  <p className="font-medium text-gray-800">Account Created</p>
                  <p className="text-sm text-gray-600">Welcome to Personal Playground!</p>
                </div>
                <span className="text-sm text-gray-500">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <div>
                  <p className="font-medium text-gray-800">Last Sign In</p>
                  <p className="text-sm text-gray-600">Most recent login</p>
                </div>
                <span className="text-sm text-gray-500">
                  {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <ChartBarIcon className="h-5 w-5 text-blue-500 mr-2" />
              <h4 className="text-lg font-semibold text-blue-800">Usage Statistics</h4>
            </div>
            {userProfile ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{userProfile.totalDataItems}</div>
                  <div className="text-sm text-blue-700">Data Items</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{userProfile.totalFilesUploaded}</div>
                  <div className="text-sm text-blue-700">Files Uploaded</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {(userProfile.storageUsed / 1024 / 1024).toFixed(1)} MB
                  </div>
                  <div className="text-sm text-blue-700">Storage Used</div>
                </div>
              </div>
            ) : (
              <p className="text-blue-700">
                Loading usage statistics...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
