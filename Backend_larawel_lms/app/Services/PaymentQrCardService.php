<?php

namespace App\Services;

use Endroid\QrCode\Color\Color;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\RoundBlockSizeMode;
use Endroid\QrCode\Writer\PngWriter;
use RuntimeException;

/**
 * Builds the dark "UPI payment" QR card shared in the WhatsApp approval message.
 *
 * The card is drawn with GD so it works without any external image
 * processing service:
 *
 *   ┌──────────────────────────────┐
 *   │  (avatar)  Maha Lakshmi      │
 *   │                              │
 *   │        ████████████          │
 *   │        ██  QR   ██           │
 *   │        ██ (logo) ██          │
 *   │        ████████████          │
 *   │                              │
 *   │   Scan to pay with any UPI   │
 *   │        ₹ 15,000.00           │
 *   └──────────────────────────────┘
 */
class PaymentQrCardService
{
    private const WIDTH = 900;
    private const HEIGHT = 1180;

    private const BG = [27, 27, 27];
    private const QR_LIGHT = [237, 237, 237];
    private const TEXT = [255, 255, 255];
    private const MUTED = [190, 190, 190];
    private const AMOUNT = [255, 214, 122];

    private const QR_SIZE = 700;
    private const QR_X = 100;
    private const QR_Y = 262;

    /**
     * @param  string  $payload   Raw data encoded into the QR (URL or upi:// intent)
     * @param  string  $name      Payer / student name shown at the top
     * @param  float   $amount    Amount shown under the QR
     * @param  string  $caption   Small caption under the QR
     * @return string  PNG bytes
     */
    public function render(
        string $payload,
        string $name,
        float $amount,
        string $caption = 'Scan to pay with any UPI app'
    ): string {
        if (! function_exists('imagecreatetruecolor') || ! function_exists('imagettftext')) {
            throw new RuntimeException('The GD extension with FreeType support is required to build the payment QR card.');
        }

        $regular = $this->font('SegoeUI.ttf');
        $bold = $this->font('SegoeUIBold.ttf');

        $img = imagecreatetruecolor(self::WIDTH, self::HEIGHT);
        imagesavealpha($img, true);
        imagealphablending($img, true);

        $bg = $this->color($img, self::BG);
        imagefilledrectangle($img, 0, 0, self::WIDTH, self::HEIGHT, $bg);

        // ── Header: avatar + name ────────────────────────────────────────
        $avatarX = 92;
        $avatarY = 132;
        $avatarR = 52;

        // Soft ring around the avatar
        imagefilledellipse($img, $avatarX, $avatarY, $avatarR * 2 + 8, $avatarR * 2 + 8, $this->color($img, [58, 58, 58]));

        // Initials disc (teal → navy feel using two stacked ellipses)
        imagefilledellipse($img, $avatarX, $avatarY, $avatarR * 2, $avatarR * 2, $this->color($img, [36, 29, 94]));
        imagefilledellipse($img, $avatarX, $avatarY - 14, $avatarR * 2 - 10, $avatarR * 2 - 10, $this->color($img, [66, 58, 138]));

        $initials = $this->initials($name);
        $this->textCentered($img, $initials, $bold, 42, $avatarX, $avatarY + 15, [255, 255, 255]);

        $nameSize = $this->fitSize($name, $bold, 48, 620);
        $this->text($img, $name, $regular, $nameSize, 178, $avatarY + (int) ($nameSize / 3), self::TEXT);

        // ── QR code (light modules on the dark card) ─────────────────────
        $qrPng = (new PngWriter())->write(new QrCode(
            data: $payload,
            encoding: new Encoding('UTF-8'),
            errorCorrectionLevel: ErrorCorrectionLevel::High,
            size: self::QR_SIZE,
            margin: 0,
            roundBlockSizeMode: RoundBlockSizeMode::None,
            foregroundColor: new Color(...self::QR_LIGHT),
            backgroundColor: new Color(...self::BG),
        ))->getString();

        $qr = imagecreatefromstring($qrPng);
        if ($qr === false) {
            throw new RuntimeException('Could not render the QR image.');
        }
        imagecopy($img, $qr, self::QR_X, self::QR_Y, 0, 0, imagesx($qr), imagesy($qr));
        imagedestroy($qr);

        // ── Centre badge (UPI style logo) ────────────────────────────────
        $cx = self::QR_X + intdiv(self::QR_SIZE, 2);
        $cy = self::QR_Y + intdiv(self::QR_SIZE, 2);
        $this->drawBadge($img, $cx, $cy, 80);

        // ── Caption + amount ─────────────────────────────────────────────
        $captionSize = $this->fitSize($caption, $regular, 31, 760);
        $this->textCentered($img, $caption, $regular, $captionSize, intdiv(self::WIDTH, 2), self::QR_Y + self::QR_SIZE + 62, self::MUTED);

        $amountText = '₹ '.number_format($amount, 2);
        $this->textCentered($img, $amountText, $bold, 46, intdiv(self::WIDTH, 2), self::QR_Y + self::QR_SIZE + 132, self::AMOUNT);

        ob_start();
        imagepng($img);
        $png = (string) ob_get_clean();
        imagedestroy($img);

        return $png;
    }

    /**
     * Draw a white circle with a four-colour ring inside it (the little
     * payment-app badge that sits in the middle of the QR code).
     */
    private function drawBadge($img, int $cx, int $cy, int $r): void
    {
        // White disc
        imagefilledellipse($img, $cx, $cy, $r * 2, $r * 2, $this->color($img, [255, 255, 255]));

        $ringOuter = $r - 8;
        $ringInner = $ringOuter - 15;

        $blue = $this->color($img, [66, 133, 244]);
        $green = $this->color($img, [52, 168, 83]);
        $yellow = $this->color($img, [251, 188, 5]);
        $red = $this->color($img, [234, 67, 53]);

        // GD angles: 0° at 3 o'clock, increasing counter-clockwise.
        imagefilledarc($img, $cx, $cy, $ringOuter * 2, $ringOuter * 2, 315, 45, $blue, IMG_ARC_PIE);
        imagefilledarc($img, $cx, $cy, $ringOuter * 2, $ringOuter * 2, 45, 135, $green, IMG_ARC_PIE);
        imagefilledarc($img, $cx, $cy, $ringOuter * 2, $ringOuter * 2, 135, 225, $yellow, IMG_ARC_PIE);
        imagefilledarc($img, $cx, $cy, $ringOuter * 2, $ringOuter * 2, 225, 315, $red, IMG_ARC_PIE);

        // Punch the middle out so it becomes a ring
        imagefilledellipse($img, $cx, $cy, $ringInner * 2, $ringInner * 2, $this->color($img, [255, 255, 255]));

        // Small white notch on the right edge, like a payment mark
        imagefilledrectangle(
            $img,
            $cx + intdiv($ringInner, 2),
            $cy - 6,
            $cx + $ringOuter - 1,
            $cy + 6,
            $this->color($img, [255, 255, 255])
        );
    }

    private function font(string $file): string
    {
        $path = resource_path('fonts/'.$file);
        if (! is_file($path)) {
            throw new RuntimeException("Font not found: {$path}");
        }

        return $path;
    }

    private function color($img, array $rgb)
    {
        return imagecolorallocate($img, $rgb[0], $rgb[1], $rgb[2]);
    }

    private function text($img, string $text, string $font, int $size, int $x, int $y, array $rgb): void
    {
        imagettftext($img, $size, 0, $x, $y, $this->color($img, $rgb), $font, $text);
    }

    private function textCentered($img, string $text, string $font, int $size, int $cx, int $baseline, array $rgb): void
    {
        $box = imagettfbbox($size, 0, $font, $text);
        $width = abs($box[2] - $box[0]);
        $x = $cx - intdiv($width, 2);

        imagettftext($img, $size, 0, $x, $baseline, $this->color($img, $rgb), $font, $text);
    }

    /**
     * Shrink the font until the text fits the given pixel width.
     */
    private function fitSize(string $text, string $font, int $maxSize, int $maxWidth): int
    {
        for ($size = $maxSize; $size > 12; $size -= 2) {
            $box = imagettfbbox($size, 0, $font, $text);
            if (abs($box[2] - $box[0]) <= $maxWidth) {
                return $size;
            }
        }

        return 12;
    }

    private function initials(string $name): string
    {
        $parts = preg_split('/\s+/', trim($name)) ?: [];
        $parts = array_values(array_filter($parts));

        if ($parts === []) {
            return 'S';
        }

        $first = mb_substr($parts[0], 0, 1);
        $last = count($parts) > 1 ? mb_substr($parts[count($parts) - 1], 0, 1) : '';

        return mb_strtoupper($first.$last);
    }
}
