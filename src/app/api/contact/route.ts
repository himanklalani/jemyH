import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Contact from '@/models/Contact';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    if (!body.name || !body.email || !body.subject || !body.message) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const newContact = await Contact.create(body);

    return NextResponse.json({ success: true, contactId: newContact._id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
