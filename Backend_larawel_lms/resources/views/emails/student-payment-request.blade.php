<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Complete your SkillForge course fee payment</title>
</head>
<body style="margin:0;padding:0;background:#F6EFE6;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#3C2027;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6EFE6;padding:28px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:18px;overflow:hidden;box-shadow:0 12px 32px rgba(90,20,32,0.12);">

                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#7A1430 0%,#4B0B1E 100%);padding:26px 30px;">
                            <div style="font-size:12px;letter-spacing:3px;color:#E9A12B;font-weight:700;text-transform:uppercase;">SkillForge LMS</div>
                            <div style="font-size:22px;font-weight:800;color:#FFF6EC;margin-top:6px;">Your enquiry is approved 🎉</div>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:30px;">
                            <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">
                                Hello <strong>{{ $studentName }}</strong>,
                            </p>
                            <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#5B4A50;">
                                Great news — your enquiry for <strong style="color:#7A1430;">{{ $courseInterest }}</strong>
                                has been approved. To activate your student account, please pay the course fee shown below.
                            </p>

                            <!-- QR card -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:22px;">
                                <tr>
                                    <td align="center">
                                        <table role="presentation" cellpadding="0" cellspacing="0" style="background:#1B1B1B;border-radius:16px;padding:14px;">
                                            <tr>
                                                <td align="center">
                                                    @if(!empty($qrPng))
                                                        <img src="{{ $message->embedData($qrPng, 'payment-qr.png') }}"
                                                             alt="Scan to pay the course fee"
                                                             width="330"
                                                             style="display:block;width:330px;max-width:100%;border:0;border-radius:10px;">
                                                    @endif
                                                </td>
                                            </tr>
                                        </table>
                                        <div style="font-size:12px;color:#8A6B70;margin-top:10px;">
                                            Amount already filled in — just scan &amp; confirm ₹ {{ number_format($amount, 2) }}
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <!-- Amount -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                                <tr>
                                    <td style="background:#FBF3E7;border:1px solid #EADBC8;border-radius:12px;padding:16px 18px;" align="center">
                                        <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#9A6A12;font-weight:700;">Course fee</div>
                                        <div style="font-size:30px;font-weight:800;color:#B0154F;margin-top:4px;">₹ {{ number_format($amount, 2) }}</div>
                                    </td>
                                </tr>
                            </table>

                            <!-- CTA -->
                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:22px;">
                                <tr>
                                    <td>
                                        <a href="{{ $paymentUrl }}"
                                           style="display:inline-block;background:linear-gradient(135deg,#F6D083,#E0A93C);color:#4B0B1E;text-decoration:none;font-weight:700;font-size:14px;padding:13px 24px;border-radius:10px;">
                                            Pay ₹ {{ number_format($amount, 2) }} now
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Steps -->
                            <div style="background:#FBF3E7;border-radius:12px;padding:16px 18px;">
                                <div style="font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:#9A6A12;font-weight:700;margin-bottom:8px;">How it works</div>
                                <ol style="margin:0;padding-left:18px;font-size:13px;line-height:1.8;color:#5B4A50;">
                                    <li>Scan the QR code above (the amount is already filled in) or click <strong>Pay now</strong>.</li>
                                    <li>Complete the payment of <strong>₹ {{ number_format($amount, 2) }}</strong>.</li>
                                    <li>Your <strong>Student ID</strong> is created the moment the payment is received and sent to this same email.</li>
                                    <li>Sign in with that Student ID and this email address to start learning.</li>
                                </ol>
                            </div>

                            <p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:#8A6B70;">
                                <strong>Note:</strong> you cannot sign in until the fee is paid. Your Student ID does not exist before then.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background:#4B0B1E;padding:18px 30px;color:rgba(255,246,236,0.72);font-size:12px;line-height:1.6;">
                            SkillForge LMS — Learn • Practice • Grow<br>
                            If you did not request this, you can safely ignore this email.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
