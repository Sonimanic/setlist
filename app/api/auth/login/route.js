import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { password } = await request.json();
    
    // Replace this with your actual password validation
    const correctPassword = process.env.ADMIN_PASSWORD || 'your-default-password';
    
    if (password === correctPassword) {
      // Set a cookie or session token here if needed
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json(
      { message: 'Invalid password' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
