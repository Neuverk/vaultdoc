'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface UpgradePromptProps {
  currentCount: number;
  limit: number;
}

export function UpgradePrompt({ currentCount, limit }: UpgradePromptProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpgrade = async (plan: 'starter' | 'enterprise') => {
    setLoading(true);
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
    setLoading(false);
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
      <p className="text-lg font-semibold text-amber-800">
        You've used {currentCount}/{limit} documents on the Free plan
      </p>
      <p className="mt-1 text-sm text-amber-700">
        Upgrade to create unlimited documents and remove watermarks.
      </p>
      <div className="mt-4 flex justify-center gap-3">
        <button
          onClick={() => handleUpgrade('starter')}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Starter — €49/mo
        </button>
        <button
          onClick={() => handleUpgrade('enterprise')}
          disabled={loading}
          className="rounded-lg bg-purple-600 px-5 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          Enterprise — €199/mo
        </button>
      </div>
    </div>
  );
}