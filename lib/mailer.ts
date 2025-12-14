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

export async function sendPasswordResetEmail(
  email: string,
  resetLink: string
): Promise<void> {
  try {
    const recipients = [new Recipient(email, '')];

    const emailParams = new EmailParams()
      .setFrom(sender)
      .setTo(recipients)
      .setSubject('Reset your Bobby password')
      .setHtml(passwordResetEmailHtml(resetLink))
      .setText(`Reset your password using this link: ${resetLink}`);

    await mailerSend.email.send(emailParams);

    logger.info('Password reset email sent successfully', { email });
  } catch (error) {
    logger.error('Failed to send password reset email', { email, error });
    throw new Error('Failed to send password reset email');
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

export async function sendGoodbyeEmail(
  email: string,
  name: string
): Promise<void> {
  try {
    const recipients = [new Recipient(email, name)];

    const emailParams = new EmailParams()
      .setFrom(sender)
      .setTo(recipients)
      .setSubject('Goodbye from Bobby 👋')
      .setHtml(goodbyeEmailHtml)
      .setText(`Goodbye, ${name}! We're sad to see you go. Your account has been deleted.`);

    await mailerSend.email.send(emailParams);

    logger.info('Goodbye email sent successfully', { email });
  } catch (error) {
    logger.error('Failed to send goodbye email', { email, error });
    throw new Error('Failed to send goodbye email');
  }
}

const goodbyeEmailHtml = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Goodbye from Bobby</title>
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
                    
                    <!-- Goodbye Title -->
                    <tr>
                        <td align="center" style="padding: 0 20px 20px 20px;">
                            <h1 style="color: #5BA8D4; font-family: 'Chewy', Arial, sans-serif; font-size: 48px; font-weight: bold; margin: 0; line-height: 1.2;">
                                Goodbye, Hero!
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Subtitle Text -->
                    <tr>
                        <td align="center" style="padding: 0 40px 30px 40px;">
                            <p style="color: #333333; font-family: Arial, sans-serif; font-size: 18px; line-height: 1.5; margin: 0;">
                                We're sad to see you go! Your account has been successfully deleted and all your data has been removed.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Message Text -->
                    <tr>
                        <td align="center" style="padding: 0 40px 40px 40px;">
                            <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5; margin: 0;">
                                Thank you for being part of our safety superhero community. If you ever want to come back, Bobby will be here waiting for you!
                            </p>
                        </td>
                    </tr>
                    
                    <!-- CTA Button -->
                    <tr>
                        <td align="center" style="padding: 0 20px 50px 20px;">
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="background-color: #7C5CCC; border-radius: 50px; padding: 18px 60px;">
                                        <a href="https://readywithbobby.online" target="_blank" style="color: #ffffff; font-family: Arial, sans-serif; font-size: 22px; font-weight: bold; text-decoration: none; display: inline-block;">
                                            Come Back Anytime
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
                                Stay safe out there! Your friends at Bobby. | <a href="mailto:contact@readywithbobby.online" style="color: #7C5CCC; text-decoration: none;">Contact Us</a>
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

const passwordResetEmailHtml = (resetLink: string) => `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Reset your Bobby password</title>
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
        table {
            border-spacing: 0;
        }
        table td {
            border-collapse: collapse;
        }
        .external-class {
            width: 100%;
        }
        .external-class {
            max-width: 600px;
        }
    </style>
</head>
<body style="margin: 0 !important; padding: 0 !important; background-color: #f4f4f4;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center" style="background-color: #f4f4f4;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <tr>
                        <td align="center" style="padding: 40px 20px 20px 20px;">
                            <!-- Email Container -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
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
                                
                                <!-- Reset Title -->
                                <tr>
                                    <td align="center" style="padding: 0 20px 20px 20px;">
                                        <h1 style="color: #5BA8D4; font-family: 'Chewy', Arial, sans-serif; font-size: 48px; font-weight: bold; margin: 0; line-height: 1.2;">
                                            Password Reset
                                        </h1>
                                    </td>
                                </tr>
                                
                                <!-- Instructions Text -->
                                <tr>
                                    <td align="center" style="padding: 0 40px 30px 40px;">
                                        <p style="color: #333333; font-family: Arial, sans-serif; font-size: 18px; line-height: 1.5; margin: 0;">
                                            We received a request to reset your password. Click the button below to create a new password.
                                        </p>
                                        <p style="color: #666666; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5; margin: 20px 0 0 0;">
                                            This link will expire in 1 hour for security reasons.
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- CTA Button -->
                                <tr>
                                    <td align="center" style="padding: 0 20px 40px 20px;">
                                        <table border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center" style="background-color: #7C5CCC; border-radius: 50px; padding: 18px 60px;">
                                                    <a href="${resetLink}" target="_blank" style="color: #ffffff; font-family: Arial, sans-serif; font-size: 22px; font-weight: bold; text-decoration: none; display: inline-block;">
                                                        Reset Password
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- Security Notice -->
                                <tr>
                                    <td align="center" style="padding: 0 40px 30px 40px;">
                                        <p style="color: #999999; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5; margin: 0;">
                                            If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td align="center" style="padding: 30px 20px 40px 20px; border-top: 1px solid #eeeeee;">
                                        <p style="color: #999999; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5; margin: 0;">
                                            Stay safe, Your friends at Bobby. | <a href="mailto:contact@readywithbobby.online" style="color: #7C5CCC; text-decoration: none;">Contact Us</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
