<?php

namespace App\Services;

use Endroid\QrCode\Color\Color;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\RoundBlockSizeMode;
use Endroid\QrCode\Writer\PngWriter;

/**
 * Small wrapper around endroid/qr-code so the rest of the app only needs
 * a single call to get PNG bytes for a payload.
 */
class QrCodeService
{
    /**
     * Render a PNG QR code (raw bytes) for the given payload.
     */
    public function png(string $data, int $size = 320, int $margin = 8): string
    {
        $qrCode = new QrCode(
            data: $data,
            encoding: new Encoding('UTF-8'),
            errorCorrectionLevel: ErrorCorrectionLevel::Medium,
            size: $size,
            margin: $margin,
            roundBlockSizeMode: RoundBlockSizeMode::Margin,
            foregroundColor: new Color(36, 29, 94), // navy, matches the brand
            backgroundColor: new Color(255, 255, 255),
        );

        return (new PngWriter())->write($qrCode)->getString();
    }

    /**
     * Render a QR code as a base64 data URI (handy for inline previews).
     */
    public function dataUri(string $data, int $size = 320, int $margin = 8): string
    {
        return 'data:image/png;base64,'.base64_encode($this->png($data, $size, $margin));
    }
}
