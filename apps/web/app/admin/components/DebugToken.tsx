// app/admin/components/DebugToken.tsx
// Component để debug token - thêm vào page.tsx tạm thời
'use client';
import React from 'react';

interface DebugTokenProps {
  token: string;
}

export default function DebugToken({ token }: DebugTokenProps) {
  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 border-2 border-yellow-400 p-4 rounded-lg shadow-lg max-w-md z-50">
      <h3 className="font-bold text-yellow-800 mb-2">🔍 Debug Token</h3>
      <div className="text-sm space-y-2">
        <div>
          <strong>Token exists:</strong> {token ? '✅ Yes' : '❌ No'}
        </div>
        {token && (
          <>
            <div>
              <strong>Token length:</strong> {token.length} chars
            </div>
            <div>
              <strong>Token preview:</strong>
              <div className="bg-white p-2 mt-1 rounded border font-mono text-xs break-all">
                {token.substring(0, 50)}...
              </div>
            </div>
            <div>
              <strong>Full token:</strong>
              <textarea 
                readOnly 
                value={token}
                className="w-full p-2 mt-1 rounded border font-mono text-xs"
                rows={3}
              />
            </div>
          </>
        )}
      </div>
      <button
        onClick={() => {
          console.log('=== TOKEN DEBUG ===');
          console.log('Token:', token);
          console.log('Token length:', token?.length);
          console.log('Authorization header:', `Bearer ${token}`);
        }}
        className="mt-3 w-full bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600"
      >
        Log to Console
      </button>
    </div>
  );
}