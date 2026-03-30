import { Handler } from '@netlify/functions';
import nodemailer from 'nodemailer';

// Bypass SSL certificate errors for home servers (like duckdns)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    let bodyString = event.body || '{}';
    if (event.isBase64Encoded) {
      bodyString = Buffer.from(bodyString, 'base64').toString('utf-8');
    }
    const body = JSON.parse(bodyString);
    const { email, pdfBase64, name, formData } = body;

    // 1. Send webhook to Home Assistant
    try {
      await new Promise<void>((resolve, reject) => {
        const https = require('https');
        const dataString = JSON.stringify(formData);
        const req = https.request('https://petrelplace.duckdns.org/api/webhook/b1Awrf0abTu_DARg3uLUgrQ4', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(dataString),
            'User-Agent': 'Netlify-Function/1.0',
          },
          rejectUnauthorized: false // Bypass SSL errors for home servers
        }, (res: any) => {
          console.log('Webhook status:', res.statusCode);
          resolve();
        });
        
        req.on('error', (e: any) => {
          console.error('Webhook request error:', e);
          reject(e);
        });
        
        req.write(dataString);
        req.end();
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
