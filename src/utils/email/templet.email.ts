export const verifyEmail = ({otp,title}:{otp:number,title:string}):string =>{
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <!-- Main Container -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    
                    <!-- Header with Company Name -->
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center; background-color: #000000;">
                            <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: 2px; text-transform: uppercase;">
                                Black Cat
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content Section -->
                    <tr>
                        <td style="padding: 50px 40px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td>
                                        <!-- Title -->
                                        <h1 style="margin: 0 0 20px; font-size: 28px; font-weight: 600; color: #1a1a1a; line-height: 1.3; text-align: center;">
                                            ${title}
                                        </h1>
                                        
                                        <!-- Description -->
                                        <p style="margin: 0 0 30px; font-size: 16px; color: #666666; line-height: 1.6; text-align: center;">
                                            Please use the verification code below to complete your request. This code will expire in 2 minutes.
                                        </p>
                                        
                                        <!-- OTP Code Box with Cat Warning -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td align="center" style="padding: 0 0 30px;">
                                                    <!-- Cat covering eyes illustration -->
                                                    <div style="text-align: center; margin-bottom: 10px;">
                                                        <span style="font-size: 48px; display: inline-block; transform: rotate(-10deg);">🙈</span>
                                                        <p style="margin: 5px 0 15px; font-size: 11px; color: #999; font-style: italic;">
                                                            Psst! Keep this secret!
                                                        </p>
                                                    </div>
                                                    
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 25px 40px;">
                                                        <tr>
                                                            <td>
                                                                <p style="margin: 0 0 8px; font-size: 12px; color: #6c757d; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; text-align: center;">
                                                                    Verification Code
                                                                </p>
                                                                <p style="margin: 0; font-size: 36px; font-weight: 700; color: #000000; letter-spacing: 8px; font-family: 'Courier New', monospace; text-align: center;">
                                                                    ${otp}
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Additional Info -->
                                        <p style="margin: 0 0 20px; font-size: 14px; color: #666666; line-height: 1.6; text-align: center;">
                                            If you didn't request this code, you can safely ignore this email. Someone else might have typed your email address by mistake.
                                        </p>
                                        
                                        <!-- Security Notice -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; padding: 16px; margin-top: 20px;">
                                            <tr>
                                                <td>
                                                    <p style="margin: 0; font-size: 13px; color: #856404; line-height: 1.5;">
                                                        <strong>Security Reminder:</strong> Never share this verification code with anyone. Black Cat will never ask you to provide this code.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Divider -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="border-top: 1px solid #e9ecef;"></td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Social Links -->
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center;">
                            <p style="margin: 0 0 20px; font-size: 14px; font-weight: 600; color: #495057;">
                                Connect with us
                            </p>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="padding: 0 10px;">
                                        <a href="${process.env.facebookLink}" style="text-decoration: none; display: inline-block;">
                                            <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group35062_erj5dx.png" alt="Facebook" width="32" height="32" style="display: block;"/>
                                        </a>
                                    </td>
                                    <td style="padding: 0 10px;">
                                        <a href="${process.env.instegram}" style="text-decoration: none; display: inline-block;">
                                            <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group35063_zottpo.png" alt="Instagram" width="32" height="32" style="display: block;"/>
                                        </a>
                                    </td>
                                    <td style="padding: 0 10px;">
                                        <a href="${process.env.twitterLink}" style="text-decoration: none; display: inline-block;">
                                            <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group_35064_i8qtfd.png" alt="Twitter" width="32" height="32" style="display: block;"/>
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa;">
                            <p style="margin: 0 0 8px; font-size: 14px; color: #6c757d; line-height: 1.5;">
                                © ${new Date().getFullYear()} Black Cat. All rights reserved.
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #adb5bd; line-height: 1.5;">
                                This is an automated message, please do not reply to this email.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`
}

