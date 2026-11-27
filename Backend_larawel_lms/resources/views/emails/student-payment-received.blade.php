<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Payment received — your Student ID</title>
</head>
<body style="margin:0;padding:0;background:#F6EFE6;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#3C2027;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6EFE6;padding:28px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:18px;overflow:hidden;box-shadow:0 12px 32px rgba(90,20,32,0.12);">

                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#1F7A4D 0%,#0E4B2E 100%);padding:26px 30px;">
                            <div style="font-size:12px;letter-spacing:3px;color:#C8F0D8;font-weight:700;text-transform:uppercase;">SkillForge LMS</div>
                            <div style="font-size:22px;font-weight:800;color:#F4FFF8;margin-top:6px;">Payment received ✅</div>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:30px;">
                            <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">
                                Hello <strong>{{ $studentName }}</strong>,
                            </p>
                            <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#5B4A50;">
                                We have received your course fee of
                                <strong style="color:#7A1430;">₹ {{ number_format($amount, 2) }}</strong>
                                for <strong style="color:#7A1430;">{{ $courseInterest }}</strong>.
                                Your student account has now been created.
                            </p>

                            <!-- Student ID -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18px;">
                                <tr>
                                    <td style="background:#FBF3E7;border:1px solid #EADBC8;border-radius:12px;padding:18px;" align="center">
                                        <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#9A6A12;font-weight:700;">Your Student ID</div>
                                        <div style="font-size:30px;font-weight:800;color:#7A1430;letter-spacing:2px;margin-top:6px;">{{ $accountId }}</div>
                                    </td>
                                </tr>
                            </table>

                            <!-- Receipt -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:22px;font-size:13px;color:#5B4A50;border:1px solid #EADBC8;border-radius:12px;overflow:hidden;">
                                <tr>
                                    <td style="padding:10px 16px;background:#FAF6F0;width:45%;color:#8A6B70;">Amount paid</td>
                                    <td style="padding:10px 16px;background:#FAF6F0;font-weight:700;color:#7A1430;">₹ {{ number_format($amount, 2) }}</td>
                                </tr>
                                @if(!empty($paymentReference))
                                <tr>
                                    <td style="padding:10px 16px;border-top:1px solid #F0E6D8;color:#8A6B70;">Reference</td>
                                    <td style="padding:10px 16px;border-top:1px solid #F0E6D8;">{{ $paymentReference }}</td>
                                </tr>
                                @endif
                                <tr>
                                    <td style="padding:10px 16px;border-top:1px solid #F0E6D8;color:#8A6B70;">Course</td>
                                    <td style="padding:10px 16px;border-top:1px solid #F0E6D8;">{{ $courseInterest }}</td>
                                </tr>
                            </table>

                            <!-- CTA -->
                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                                <tr>
                                    <td>
                                        <a href="{{ $loginUrl }}"
                                           style="display:inline-block;background:#7A1430;color:#FFF6EC;text-decoration:none;font-weight:700;font-size:14px;padding:13px 24px;border-radius:10px;">
                                            Sign in to your student portal
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <div style="background:#FBF3E7;border-radius:12px;padding:16px 18px;">
                                <div style="font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:#9A6A12;font-weight:700;margin-bottom:8px;">Sign in with</div>
                                <div style="font-size:13px;line-height:1.9;color:#5B4A50;">
                                    Student ID: <strong style="color:#7A1430;">{{ $accountId }}</strong><br>
                                    Email: <strong>{{ $studentEmail }}</strong>
                                </div>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background:#4B0B1E;padding:18px 30px;color:rgba(255,246,236,0.72);font-size:12px;line-height:1.6;">
                            SkillForge LMS — Learn • Practice • Grow<br>
                            Keep this email safe — it contains your Student ID.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
