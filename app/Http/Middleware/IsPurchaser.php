<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class IsPurchaser
{
    /**
     * Handle an incoming request.
     * Allow only users with the 'purchaser' role.
     */
    public function handle(Request $request, Closure $next)
    {
        if ($request->user() && $request->user()->role === 'purchaser') {
            return $next($request);
        }
        return response('Forbidden', 403);
    }
}