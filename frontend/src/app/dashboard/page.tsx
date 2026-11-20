'use client';

import React from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { DashboardShellSkeleton } from '@/src/components/dashboard/DashboardShellSkeleton';
import TenantDashboardView from '@/src/components/dashboard/TenantDashboardView';
import LandlordDashboardView from '@/src/components/dashboard/LandlordDashboardView';

/**
 * Main Unified Dashboard Entry Point
 * All authenticated users view clean '/dashboard' in their URL.
 * Automatically resolves and displays the appropriate tailored dashboard view:
 * - Property Lister / Landlord: LandlordDashboardView
 * - Tenant / Renter: TenantDashboardView
 */
export default function DashboardPage() {
  const { isLister, loading } = useAuth();

  if (loading) {
    return <DashboardShellSkeleton />;
  }

  if (isLister) {
    return <LandlordDashboardView />;
  }

  return <TenantDashboardView />;
}
