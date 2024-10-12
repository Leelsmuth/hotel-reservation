import { sendReservationConfirmationEmail } from '@/lib/mailing/mailer';

export async function POST(req) {
  try {
    const { recipient, bookingDetails } = await req.json();

    await sendReservationConfirmationEmail(recipient, bookingDetails);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
