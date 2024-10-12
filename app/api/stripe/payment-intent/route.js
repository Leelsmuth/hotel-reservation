import stripe from '@/lib/payment-gateway/stripe';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { amount } = await req.json();
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'cad',
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
