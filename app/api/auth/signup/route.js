import { auth, db } from '@/lib/firebase/firebase';
import { passwordSecurityCheck } from '@/lib/helpers/passwordSecurityCheck ';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
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

  let user = null;

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    user = userCredential.user;

    const userDocRef = doc(db, 'users', user.uid);

    await setDoc(userDocRef, {
      fullName,
      email,
      createdAt: serverTimestamp(),
      isAdmin: false,
    });

    return NextResponse.json(
      { message: 'User signed up successfully!', uid: user.uid },
      { status: 201 }
    );
  } catch (error) {
    if (user) {
      await deleteUser(user);
    }

    return NextResponse.json(
      { message: `Error during sign-up: ${error.message}` },
      { status: 500 }
    );
  }
}
