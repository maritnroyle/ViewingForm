import express from 'express';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for base64 PDF
  app.use(express.json({ limit: '50mb' }));

  app.post('/api/send-email', async (req, res) => {
    try {
      const { email, pdfBase64, name } = req.body;

      if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.error('Missing Gmail credentials in environment variables.');
        return res.status(500).json({ error: 'Email service is not configured.' });
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      // Extract the raw base64 string from the data URI
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
      res.json({ success: true });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'Failed to send email' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
