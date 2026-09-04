import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { verifyAccessToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(decoded.id).select('savedPrescriptions');
    
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, prescriptions: user.savedPrescriptions });
  } catch (error) {
    console.error('[prescriptions GET]', error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();
    
    await dbConnect();
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const newPrescription = {
      type: body.type || 'single-vision',
      od: body.od,
      os: body.os,
      pd: body.pd,
      doctorName: body.doctorName,
      clinicName: body.clinicName,
      prescriptionDate: body.prescriptionDate || new Date(),
      verificationStatus: 'pending',
      verificationMethod: 'manual-entry',
    };

    user.savedPrescriptions.push(newPrescription);
    await user.save();

    return NextResponse.json({ success: true, message: 'Prescription saved successfully', prescription: user.savedPrescriptions[user.savedPrescriptions.length - 1] });
  } catch (error) {
    console.error('[prescriptions POST]', error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
