import { db } from '@/lib/firebase/firebase';
import { addDoc, collection, doc, setDoc } from 'firebase/firestore';

export async function POST(req) {
  const { content } = await req.json();

  try {
    // const docRef = await setDoc(doc(db, 'roomList', content.typeId), content);
    const docRef = await addDoc(collection(db, 'rooms'), content);

    return new Response(JSON.stringify({ id: docRef.id }), { status: 200 });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ error: 'Failed to add data' }), {
      status: 500,
    });
  }
}
