import repository from '@/lib/data/repository';

export async function POST(req) {
  const { content } = await req.json();

  try {
    const id = await repository.addRoom(content);

    return new Response(JSON.stringify({ id }), { status: 200 });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ error: 'Failed to add data' }), {
      status: 500,
    });
  }
}
