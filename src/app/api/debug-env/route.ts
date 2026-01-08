'use server'

import { NextResponse } from 'next/server'

// Temporary debug endpoint - DELETE after testing
export async function GET() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL

  return NextResponse.json({
    hasServiceKey: !!serviceKey,
    serviceKeyPrefix: serviceKey ? serviceKey.substring(0, 20) + '...' : 'MISSING',
    hasAnonKey: !!anonKey,
    anonKeyPrefix: anonKey ? anonKey.substring(0, 20) + '...' : 'MISSING',
    hasUrl: !!url,
    url: url || 'MISSING',
  })
}
