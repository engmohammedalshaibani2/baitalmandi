import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email, period } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Example SMTP configuration for sending emails.
    // Real credentials should be placed in .env variables.
    // const transporter = nodemailer.createTransport({
    //   host: process.env.SMTP_HOST || "smtp.ethereal.email",
    //   port: parseInt(process.env.SMTP_PORT || '587'),
    //   secure: false,
    //   auth: {
    //     user: process.env.SMTP_USER,
    //     pass: process.env.SMTP_PASS,
    //   },
    // });
    
    // const info = await transporter.sendMail({
    //   from: '"مطعم بيت المندي" <no-reply@baitalmandi.com>',
    //   to: email,
    //   subject: `تقرير مطعم بيت المندي - ${period === 'daily' ? 'يومي' : period === 'monthly' ? 'شهري' : 'سنوي'}`,
    //   text: "تم جدولة وإرسال التقرير بنجاح. ستجد البيانات التفصيلية في المرفقات.",
    //   // attachments: [ ... ]
    // });

    // For now we just return success simulating that the scheduling job was created/sent
    return NextResponse.json({ success: true, message: `Report scheduled to ${email}` });
  } catch (error) {
    console.error('Error scheduling report:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
