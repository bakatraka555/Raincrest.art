/**
 * Netlify Function za slanje email-ova s generiranim slikama
 * 
 * Prima:
 * - userEmail: email adresa korisnika
 * - imageUrl: URL generirane slike (Bunny CDN)
 * - templateId: ID templatea
 * - userId: ID korisnika
 * 
 * Šalje:
 * - HTML email s slikom i download linkom
 * - Koristi Gmail SMTP preko nodemailer
 */

const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
  console.log('=== send-email function called ===');
  console.log('HTTP Method:', event.httpMethod);
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { userEmail, imageUrl, templateId, userId } = JSON.parse(event.body);

    console.log('Email request:', {
      userEmail: userEmail ? userEmail.substring(0, 3) + '***' : 'missing',
      hasImageUrl: !!imageUrl,
      imageUrl: imageUrl ? imageUrl.substring(0, 50) + '...' : 'missing',
      templateId,
      userId
    });

    // Validation
    if (!userEmail || !imageUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required parameters: userEmail, imageUrl' 
        })
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid email format' 
        })
      };
    }

    // Check environment variables
    const EMAIL_USER = process.env.EMAIL_USER;
    const EMAIL_PASS = process.env.EMAIL_PASS;

    if (!EMAIL_USER || !EMAIL_PASS) {
      console.error('Missing email configuration:', {
        hasEmailUser: !!EMAIL_USER,
        hasEmailPass: !!EMAIL_PASS
      });
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Email service not configured' 
        })
      };
    }

    console.log('Creating Gmail SMTP transporter...');

    // Gmail SMTP konfiguracija
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    });

    // Verify SMTP connection
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    // Email sadržaj
    const mailOptions = {
      from: `"🎨 Raincrest Art" <${EMAIL_USER}>`,
      to: userEmail,
      subject: '✨ Your AI Transformation is Ready!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your AI Transformation is Ready!</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 0;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎨 Raincrest Art</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your AI Transformation is Complete!</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <h2 style="color: #333; margin-bottom: 20px;">Hello! ✨</h2>
              
              <p style="color: #666; line-height: 1.6; font-size: 16px;">
                Your magical AI transformation is ready! We've created something truly special just for you.
              </p>
              
              <!-- Image Preview -->
              <div style="text-align: center; margin: 30px 0;">
                <img src="${imageUrl}" 
                     alt="Your AI Transformation" 
                     style="max-width: 100%; height: auto; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
              </div>
              
              <!-- Download Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${imageUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 25px; 
                          display: inline-block;
                          font-weight: bold;
                          font-size: 16px;
                          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);">
                  🖼️ Download Your Image
                </a>
              </div>
              
              <!-- Instructions -->
              <div style="background: #f8f9ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3 style="color: #667eea; margin-top: 0;">📱 How to Save:</h3>
                <ul style="color: #666; line-height: 1.6;">
                  <li><strong>Mobile:</strong> Tap and hold the image, then select "Save to Photos"</li>
                  <li><strong>Desktop:</strong> Right-click the image and select "Save image as..."</li>
                  <li><strong>Share:</strong> Tag us on social media @raincrest.art</li>
                </ul>
              </div>
              
              <!-- Important Info -->
              <div style="border-left: 4px solid #667eea; padding-left: 15px; margin: 20px 0;">
                <p style="color: #666; margin: 0; font-size: 14px;">
                  <strong>Important:</strong> This download link will be available for 30 days. 
                  Make sure to save your image to your device!
                </p>
              </div>
              
              <p style="color: #666; line-height: 1.6;">
                Thank you for choosing Raincrest Art! We hope you love your transformation. 💜
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8f9ff; padding: 20px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Order ID: ${userId || 'N/A'}<br>
                Template: ${templateId || 'N/A'}<br>
                Generated: ${new Date().toLocaleString()}
              </p>
              <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
                🎨 Raincrest Art - AI-Powered Transformations
              </p>
            </div>
            
          </div>
        </body>
        </html>
      `
    };

    console.log('Sending email...');
    console.log('To:', userEmail);
    console.log('Subject:', mailOptions.subject);

    // Pošalji email
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        messageId: result.messageId,
        recipient: userEmail
      })
    };

  } catch (error) {
    console.error('❌ Email error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });

    // Specific error handling
    let errorMessage = 'Failed to send email';
    let statusCode = 500;

    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed - check Gmail app password';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Failed to connect to email server';
    } else if (error.code === 'EMESSAGE') {
      errorMessage = 'Invalid email message format';
    } else if (error.message && error.message.includes('Invalid login')) {
      errorMessage = 'Gmail login failed - check email credentials';
    }

    return {
      statusCode: statusCode,
      headers,
      body: JSON.stringify({ 
        error: errorMessage, 
        details: error.message,
        code: error.code
      })
    };
  }
};
