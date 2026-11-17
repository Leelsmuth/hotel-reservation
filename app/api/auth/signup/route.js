import repository from '@/lib/data/repository';
import { passwordSecurityCheck } from '@/lib/helpers/passwordSecurityCheck ';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const { fullName, email, password } = await request.json();

  if (!fullName || !email || !password) {
    return NextResponse.json(
      { message: 'All fields (fullName, email, and password) are required.' },
      { status: 400 }
    );
  }

  if (!passwordSecurityCheck(password)) {
    return NextResponse.json(
      {
        message:
          'Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, and a number.',
      },
      { status: 400 }
    );
  }

  try {
    const { uid, user } = await repository.signUpUser({
      fullName,
      email,
      password,
    });

    return NextResponse.json(
      { message: 'User signed up successfully!', uid, user },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: `Error during sign-up: ${error.message}` },
      { status: 500 }
    );
  }
}
