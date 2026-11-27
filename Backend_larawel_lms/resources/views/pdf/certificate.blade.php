<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <style>
        @page {
            margin: 0;
            size: 297mm 210mm;
        }

        * {
            box-sizing: border-box;
        }

        body {
            font-family: Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #241D5E;
        }

        .page {
            position: relative;
            width: 297mm;
            height: 210mm;
            background: #241D5E;
            overflow: hidden;
        }

        /* ---------- Left colour column ---------- */
        .col {
            position: absolute;
            left: 0;
            top: 0;
            width: 35mm;
            height: 210mm;
        }

        .col-pink {
            position: absolute;
            left: 0;
            top: 0;
            width: 35mm;
            height: 32mm;
            background: #E5206B;
        }

        .col-pink-ring {
            position: absolute;
            left: 9mm;
            top: 7.5mm;
            width: 17mm;
            height: 17mm;
            border: 2mm solid #FFFFFF;
            border-radius: 50%;
        }

        .col-teal {
            position: absolute;
            left: 0;
            top: 32mm;
            width: 35mm;
            height: 46mm;
            background: #7FCCDE;
        }

        .col-teal-ring {
            position: absolute;
            left: 5mm;
            top: 43mm;
            width: 24mm;
            height: 24mm;
            border: 3.5mm solid #241D5E;
            border-radius: 50%;
        }

        .col-teal-bar {
            position: absolute;
            left: 15mm;
            top: 43mm;
            width: 6mm;
            height: 24mm;
            background: #241D5E;
        }

        .col-strip {
            position: absolute;
            left: 0;
            top: 78mm;
            width: 35mm;
            height: 19mm;
            background: #241D5E;
        }

        .col-strip-pink {
            position: absolute;
            left: 0;
            top: 85mm;
            width: 35mm;
            height: 7mm;
            background: #E5206B;
        }

        .col-rest {
            position: absolute;
            left: 0;
            top: 97mm;
            width: 35mm;
            height: 113mm;
            background: #241D5E;
        }

        .arc {
            position: absolute;
            border: 0.25mm solid #3B3475;
            border-radius: 50%;
        }

        .arc-1 { left: -40mm; top: 150mm; width: 110mm; height: 110mm; }
        .arc-2 { left: -32mm; top: 158mm; width: 110mm; height: 110mm; }
        .arc-3 { left: -24mm; top: 166mm; width: 110mm; height: 110mm; }
        .arc-4 { left: -16mm; top: 174mm; width: 110mm; height: 110mm; }

        /* ---------- Top-left shapes ---------- */
        .top-teal-1 {
            position: absolute;
            left: 3mm;
            top: -9mm;
            width: 21mm;
            height: 21mm;
            background: #7FCCDE;
            border-radius: 50%;
        }

        .top-pink {
            position: absolute;
            left: 17mm;
            top: -2mm;
            width: 25mm;
            height: 25mm;
            background: #E5206B;
            border-radius: 50%;
        }

        .stripe {
            position: absolute;
            top: 0;
            width: 2mm;
            height: 17mm;
            background: #E5206B;
        }

        .stripe-1 { left: 41mm; }
        .stripe-2 { left: 44.5mm; }
        .stripe-3 { left: 48mm; }
        .stripe-4 { left: 51.5mm; }

        .top-teal-2 {
            position: absolute;
            left: 57mm;
            top: -11mm;
            width: 21mm;
            height: 21mm;
            background: #7FCCDE;
            border-radius: 50%;
        }

        /* ---------- Ivory content panel ---------- */
        .panel {
            position: absolute;
            left: 35mm;
            top: 28mm;
            width: 258mm;
            height: 181mm;
            background: #F7F7F4;
            border-top-left-radius: 27mm;
            border-bottom-right-radius: 33mm;
        }

        .brand {
            position: absolute;
            left: 0;
            right: 0;
            top: 11mm;
            text-align: center;
        }

        .brand-mark {
            display: inline-block;
            width: 7mm;
            height: 7mm;
            background: #241D5E;
            color: #7FCCDE;
            font-size: 10pt;
            font-weight: bold;
            line-height: 7mm;
            text-align: center;
            border-radius: 1.5mm;
        }

        .brand-name {
            display: inline-block;
            margin-left: 2mm;
            font-size: 12pt;
            font-weight: bold;
            letter-spacing: 2.6pt;
            color: #241D5E;
            vertical-align: middle;
        }

        .brand-tagline {
            margin-top: 1.5mm;
            font-size: 6pt;
            font-weight: bold;
            letter-spacing: 1.8pt;
            color: #7A7A8C;
        }

        .title {
            position: absolute;
            left: 0;
            right: 0;
            top: 30mm;
            margin: 0;
            text-align: center;
            font-size: 13pt;
            font-weight: bold;
            letter-spacing: 3.4pt;
            color: #E5206B;
        }

        .lead {
            position: absolute;
            left: 0;
            right: 0;
            top: 41mm;
            margin: 0;
            text-align: center;
            font-size: 12pt;
            color: #5B5870;
        }

        .student {
            position: absolute;
            left: 20mm;
            right: 20mm;
            top: 48mm;
            margin: 0;
            text-align: center;
            font-size: 27pt;
            font-weight: bold;
            color: #241D5E;
        }

        .rule {
            position: absolute;
            left: 55mm;
            right: 55mm;
            top: 67mm;
            border-top: 0.3mm solid #C9C5D6;
        }

        .rule-dot {
            position: absolute;
            left: 127mm;
            top: 65.8mm;
            width: 2.4mm;
            height: 2.4mm;
            background: #E5206B;
            border-radius: 50%;
        }

        .small {
            position: absolute;
            left: 0;
            right: 0;
            top: 73mm;
            margin: 0;
            text-align: center;
            font-size: 12pt;
            color: #5B5870;
        }

        .course {
            position: absolute;
            left: 20mm;
            right: 20mm;
            top: 82mm;
            margin: 0;
            text-align: center;
            font-size: 20pt;
            font-weight: bold;
            color: #B0154F;
        }

        .batch {
            position: absolute;
            left: 0;
            right: 0;
            top: 96mm;
            margin: 0;
            text-align: center;
            font-size: 11pt;
            color: #5B5870;
        }

        .batch strong {
            color: #241D5E;
        }

        /* ---------- Footer ---------- */
        .footer {
            position: absolute;
            left: 20mm;
            right: 20mm;
            bottom: 12mm;
            width: 218mm;
            border-collapse: collapse;
        }

        .footer td {
            vertical-align: bottom;
            font-size: 9pt;
            color: #5B5870;
        }

        .footer .issued {
            width: 70mm;
            text-align: left;
        }

        .footer .issued strong {
            display: block;
            margin-top: 1.5mm;
            font-size: 10pt;
            color: #241D5E;
        }

        .footer .cert-no {
            margin-top: 1.5mm;
            font-size: 8pt;
            color: #8A8797;
        }

        .footer .seal-cell {
            width: 40mm;
            text-align: center;
        }

        .seal {
            display: inline-block;
            width: 22mm;
            height: 22mm;
            border: 0.9mm solid #E5206B;
            border-radius: 50%;
            color: #241D5E;
            text-align: center;
            padding-top: 5mm;
        }

        .seal strong {
            display: block;
            font-size: 6.5pt;
            letter-spacing: 0.8pt;
        }

        .seal span {
            display: block;
            margin-top: 0.8mm;
            font-size: 5.2pt;
            color: #5B5870;
            letter-spacing: 0.5pt;
        }

        .footer .sign-cell {
            width: 70mm;
            text-align: center;
        }

        .sign-name {
            font-size: 11pt;
            font-weight: bold;
            font-style: italic;
            color: #241D5E;
        }

        .sign-line {
            width: 50mm;
            margin: 1.2mm auto 1mm;
            border-top: 0.3mm solid #C9C5D6;
        }

        .sign-role {
            font-size: 8pt;
            color: #5B5870;
        }
    </style>
</head>
<body>
    <div class="page">
        <!-- Left colour column -->
        <div class="col">
            <div class="col-pink"></div>
            <div class="col-pink-ring"></div>
            <div class="col-teal"></div>
            <div class="col-teal-ring"></div>
            <div class="col-teal-bar"></div>
            <div class="col-strip"></div>
            <div class="col-strip-pink"></div>
            <div class="col-rest">
                <div class="arc arc-1"></div>
                <div class="arc arc-2"></div>
                <div class="arc arc-3"></div>
                <div class="arc arc-4"></div>
            </div>
        </div>

        <!-- Top decorative shapes -->
        <div class="top-teal-1"></div>
        <div class="top-pink"></div>
        <div class="stripe stripe-1"></div>
        <div class="stripe stripe-2"></div>
        <div class="stripe stripe-3"></div>
        <div class="stripe stripe-4"></div>
        <div class="top-teal-2"></div>

        <!-- Ivory content panel -->
        <div class="panel">
            <div class="brand">
                <span class="brand-mark">L</span>
                <span class="brand-name">CUSTOM LMS</span>
                <div class="brand-tagline">LEARN &nbsp;•&nbsp; PRACTICE &nbsp;•&nbsp; GROW</div>
            </div>

            <p class="title">CERTIFICATE OF COMPLETION</p>
            <p class="lead">This certificate is proudly presented to</p>
            <p class="student">{{ $student_name }}</p>

            <div class="rule"></div>
            <div class="rule-dot"></div>

            <p class="small">for successfully completing</p>
            <p class="course">{{ $course_name }}</p>
            <p class="batch">Batch: <strong>{{ $batch_code }}</strong></p>

            <table class="footer">
                <tr>
                    <td class="issued">
                        Issued on
                        <strong>{{ \Carbon\Carbon::parse($issued_at)->format('d/m/Y') }}</strong>
                        <div class="cert-no">Certificate No: {{ $certificate_number }}</div>
                    </td>
                    <td class="seal-cell">
                        <div class="seal">
                            <strong>CERTIFIED</strong>
                            <span>CUSTOM LMS</span>
                        </div>
                    </td>
                    <td class="sign-cell">
                        <div class="sign-name">Custom LMS</div>
                        <div class="sign-line"></div>
                        <div class="sign-role">Authorised Signatory</div>
                    </td>
                </tr>
            </table>
        </div>
    </div>
</body>
</html>
