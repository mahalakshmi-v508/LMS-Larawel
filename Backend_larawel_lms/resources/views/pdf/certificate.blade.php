<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <style>
        @page {
            margin: 22pt;
        }

        body {
            font-family: Helvetica, Arial, sans-serif;
            color: #111827;
            margin: 0;
        }

        .frame {
            border: 3pt solid #4338ca;
            padding: 10pt;
        }

        .inner {
            border: 1pt solid #a5b4fc;
            padding: 26pt 30pt 22pt;
            text-align: center;
        }

        .title {
            color: #4338ca;
            font-size: 18pt;
            font-weight: bold;
            letter-spacing: 2pt;
            margin: 0 0 22pt;
        }

        .lead {
            color: #475569;
            font-size: 13pt;
            margin: 0 0 14pt;
        }

        .student {
            color: #111827;
            font-size: 28pt;
            font-weight: bold;
            margin: 0 0 10pt;
        }

        .rule {
            border-top: 1pt solid #cbd5e1;
            margin: 10pt 90pt 16pt;
        }

        .small {
            color: #475569;
            font-size: 12pt;
            margin: 0 0 12pt;
        }

        .course {
            color: #312e81;
            font-size: 21pt;
            font-weight: bold;
            margin: 0 0 14pt;
        }

        .batch {
            color: #475569;
            font-size: 11pt;
            margin: 0 0 26pt;
        }

        .meta {
            width: 100%;
            border-collapse: collapse;
            margin-top: 18pt;
        }

        .meta td {
            color: #334155;
            font-size: 9.5pt;
            text-align: left;
            vertical-align: bottom;
        }

        .meta td.right {
            text-align: right;
        }
    </style>
</head>
<body>
    <div class="frame">
        <div class="inner">
            <p class="title">CERTIFICATE OF COMPLETION</p>

            <p class="lead">This certificate is proudly presented to</p>

            <p class="student">{{ $student_name }}</p>

            <div class="rule"></div>

            <p class="small">for successfully completing</p>

            <p class="course">{{ $course_name }}</p>

            <p class="batch">Batch: {{ $batch_code }}</p>

            <table class="meta">
                <tr>
                    <td>Issued: {{ \Carbon\Carbon::parse($issued_at)->format('d/m/Y') }}</td>
                    <td class="right">Certificate No: {{ $certificate_number }}</td>
                </tr>
            </table>
        </div>
    </div>
</body>
</html>
