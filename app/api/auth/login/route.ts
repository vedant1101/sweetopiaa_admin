import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Get credentials from environment variables
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Check if environment variables are set
    if (!adminUsername || !adminPassword) {
      console.error('Admin credentials not set in environment variables');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Server configuration error' 
        },
        { status: 500 }
      );
    }

    // Validate credentials against environment variables
    if (username === adminUsername && password === adminPassword) {
      const user = {
        id: 1,
        username: adminUsername,
        name: 'Administrator',
        email: 'admin@example.com',
        role: 'admin'
      };

      return NextResponse.json({
        success: true,
        user
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid username or password' 
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}