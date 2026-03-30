import { Handler } from '@netlify/functions';
import nodemailer from 'nodemailer';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { email, pdfBase64, name, formData } = body;

    // 1. Send webhook to Home Assistant
    try {
      await fetch('https://petrelplace.duckdns.org/api/webhook/b1Awrf0abTu_DARg3uLUgrQ4', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
    } catch (webhookError) {
      console.error('Webhook failed:', webhookError);
    }

    // 2. Send Email
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('Missing Gmail credentials in environment variables.');
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: 'Email service is not configured.' }) 
      };
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const base64Data = pdfBase64.replace(/^data:.*;base64,/, '');

    const mailOptions = {
      from: `"WhiteCloud Homestay" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Your WhiteCloud Homestay Viewing Request & Terms',
      text: `Hi ${name},\n\nThank you for submitting your viewing request for WhiteCloud Homestay.\n\nPlease find attached a copy of your submitted details and the Room Viewing Terms and Conditions for your records.\n\nBest regards,\nWhiteCloud Homestay`,
      attachments: [
        {
          filename: 'WhiteCloud_Viewing_Request.pdf',
          content: base64Data,
          encoding: 'base64',
          contentType: 'application/pdf'
        }
      ]
    };

    await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Error in submit handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process submission' }),
    };
  }
};
