<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class IsPurchaser
{
    
    public function handle(Request $request, Closure $next)
    {
        if ($request->user() && $request->user()->role === 'purchaser') {
            return $next($request);
        }
        return response('Forbidden', 403);
    }
}