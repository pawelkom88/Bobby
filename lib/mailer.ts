import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import { logger } from '@/lib/logger';

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY!,
});

const sender = new Sender(process.env.MAILERSEND_DOMAIN!, 'Ready With Bobby');

export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<void> {
  try {
    const recipients = [new Recipient(email, name)];

    const emailParams = new EmailParams()
      .setFrom(sender)
      .setTo(recipients)
      .setSubject('Welcome to Our App! 🎉')
      .setHtml(welcomeEmailHtml)
      .setText(`Welcome, ${name}! Thanks for signing up.`);

    await mailerSend.email.send(emailParams);

    logger.info('Welcome email sent successfully', { email });
  } catch (error) {
    logger.error('Failed to send welcome email', { email, error });
    throw new Error('Failed to send welcome email');
  }
}

const welcomeEmailHtml = `
 <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Welcome to Bobby, Hero!</title>
    <!--[if !mso]><!-->
    <style type="text/css">
        @import url('https://fonts.googleapis.com/css2?family=Chewy&display=swap');
    </style>
    <!--<![endif]-->
    <style type="text/css">
        body {
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        img {
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
            -ms-interpolation-mode: bicubic;
        }
        table {
            border-collapse: collapse !important;
        }
        body, #bodyTable {
            height: 100% !important;
            margin: 0;
            padding: 0;
            width: 100% !important;
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" id="bodyTable" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" valign="top" style="padding: 40px 20px;">
                <!-- Main Container -->
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; max-width: 600px;">
                    <!-- Header Spacer -->
                    <tr>
                        <td align="center" style="padding: 50px 20px 30px 20px;">
                            <!-- Character Image Placeholder -->
                            <table border="0" cellpadding="0" cellspacing="0" width="200">
                                <tr>
                                    <td align="center">
                                        <img src="https://readywithbobby.online/login-bobby.png" alt="Bobby Character" width="180" style="display: block; max-width: 180px; height: auto;" />
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Welcome Title -->
                    <tr>
                        <td align="center" style="padding: 0 20px 20px 20px;">
                            <h1 style="color: #5BA8D4; font-family: 'Chewy', Arial, sans-serif; font-size: 48px; font-weight: bold; margin: 0; line-height: 1.2;">
                                Welcome to<br/>Bobby, Hero!
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Subtitle Text -->
                    <tr>
                        <td align="center" style="padding: 0 40px 40px 40px;">
                            <p style="color: #333333; font-family: Arial, sans-serif; font-size: 18px; line-height: 1.5; margin: 0;">
                                You're one step closer to becoming a safety superstar. We're so excited you're here!
                            </p>
                        </td>
                    </tr>
                    
                    <!-- CTA Button -->
                    <tr>
                        <td align="center" style="padding: 0 20px 50px 20px;">
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="background-color: #7C5CCC; border-radius: 50px; padding: 18px 60px;">
                                        <a href="https://readywithbobby.online/app/your-age" target="_blank" style="color: #ffffff; font-family: Arial, sans-serif; font-size: 22px; font-weight: bold; text-decoration: none; display: inline-block;">
                                            Start Your Adventure
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 30px 20px 40px 20px; border-top: 1px solid #eeeeee;">
                            <p style="color: #999999; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5; margin: 0;">
                                Happy Learning, Your friends at Bobby. | <a href="mailto:contact@readywithbobby.online" style="color: #7C5CCC; text-decoration: none;">Contact Us</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
