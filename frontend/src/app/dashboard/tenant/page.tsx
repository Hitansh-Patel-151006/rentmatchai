import { redirect } from 'next/navigation';

export default function TenantRedirectPage() {
  redirect('/dashboard');
}
