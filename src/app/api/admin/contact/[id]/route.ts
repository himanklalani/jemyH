import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Contact from '@/models/Contact';
import AdminActivityLog from '@/models/AdminActivityLog';
import { checkAdminAuth } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await checkAdminAuth(req);
    if (auth.error) return auth.error;

    await dbConnect();
    const resolvedParams = await params;
    const body = await req.json();
    const { status, adminNotes } = body;

    const contact = await Contact.findById(resolvedParams.id);
    if (!contact) return NextResponse.json({ success: false, message: 'Contact not found' }, { status: 404 });

    if (status) contact.status = status;
    if (adminNotes) contact.adminNotes = adminNotes;
    await contact.save();

    await AdminActivityLog.create({
      adminId: auth.adminId, action: 'resolved_contact_ticket', entityType: 'user', entityId: contact._id,
      details: { email: contact.email },
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1',
    });

    return NextResponse.json({ success: true, contact });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
