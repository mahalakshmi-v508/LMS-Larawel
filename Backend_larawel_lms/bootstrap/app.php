<?php

use App\Exceptions\ApiException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Keep the JSON error contract the frontend already understands:
        // { success: false, message } for expected validation errors and
        // { success: false, error } for unexpected failures.
        $exceptions->render(function (ApiException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->status);
        });

        $exceptions->render(function (Throwable $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            // Let Laravel render 404/405/etc. with their normal status codes.
            if ($e instanceof HttpExceptionInterface) {
                return null;
            }

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        });
    })->create();
