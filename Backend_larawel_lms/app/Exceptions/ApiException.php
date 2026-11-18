<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * An expected API failure that should be rendered as:
 *   { "success": false, "message": "..." }
 */
class ApiException extends RuntimeException
{
    public function __construct(string $message, public readonly int $status = 400)
    {
        parent::__construct($message);
    }
}
