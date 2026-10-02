<?php

use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BudgetController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\ReceiptController;
use App\Http\Controllers\Api\ReimbursementController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WishlistItemController;
use Illuminate\Support\Facades\Route;

// Five attempts per minute per IP slows down password guessing.
Route::post('login', [AuthController::class, 'login'])->middleware('throttle:5,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('me', [AuthController::class, 'me']);
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('members', [AuthController::class, 'members']);

    Route::get('dashboard', DashboardController::class);
    Route::get('reports', ReportController::class);

    // Registered before the resource so "export" is not read as an {expense} id.
    Route::get('expenses/export', [ExpenseController::class, 'export']);
    Route::apiResource('expenses', ExpenseController::class);
    Route::apiResource('reimbursements', ReimbursementController::class);

    Route::post('wishlist/{wishlistItem}/purchase', [WishlistItemController::class, 'purchase']);
    Route::apiResource('wishlist', WishlistItemController::class)
        ->parameters(['wishlist' => 'wishlistItem']);

    Route::get('budgets', [BudgetController::class, 'index']);
    Route::put('budgets/{category}', [BudgetController::class, 'update']);

    foreach (['expenses', 'reimbursements'] as $type) {
        Route::controller(ReceiptController::class)
            ->prefix("{$type}/{id}/receipt")
            ->whereNumber('id')
            ->group(function () use ($type) {
                Route::get('/', 'show')->defaults('type', $type);
                Route::post('/', 'store')->defaults('type', $type);
                Route::delete('/', 'destroy')->defaults('type', $type);
            });
    }

    // Categories & Payments page. {list} picks which list CatalogController works on.
    Route::controller(CatalogController::class)->group(function () {
        Route::get('catalog', 'index');
        foreach (['categories' => 'category', 'payment-methods' => 'method'] as $path => $list) {
            Route::post($path, 'store')->defaults('list', $list);
            Route::put("{$path}/order", 'reorder')->defaults('list', $list);
            Route::patch("{$path}/{id}", 'update')->whereNumber('id')->defaults('list', $list);
            Route::delete("{$path}/{id}", 'destroy')->whereNumber('id')->defaults('list', $list);
        }
        Route::post('payment-methods/{paymentMethod}/accounts', 'store')->defaults('list', 'account');
        Route::put('payment-methods/{paymentMethod}/accounts/order', 'reorder')->defaults('list', 'account');
        Route::patch('payment-accounts/{id}', 'update')->whereNumber('id')->defaults('list', 'account');
        Route::delete('payment-accounts/{id}', 'destroy')->whereNumber('id')->defaults('list', 'account');
    });

    Route::apiResource('users', UserController::class)->except('show');
    Route::get('activity', ActivityController::class);
});
