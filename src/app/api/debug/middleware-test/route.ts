import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sid');
  
  return NextResponse.json({
    hasToken: !!accessToken,
    tokenLength: accessToken?.value?.length || 0,
    tokenPreview: accessToken?.value?.substring(0, 20) + '...',
    allCookies: Array.from(cookieStore.getAll()).map(c => ({
      name: c.name,
      hasValue: !!c.value,
      valueLength: c.value?.length || 0,
    })),
    headers: {
      cookie: request.headers.get('cookie')?.substring(0, 100) + '...',
    },
  });
}
