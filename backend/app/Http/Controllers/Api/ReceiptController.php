<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Reimbursement;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Optional receipt photo/PDF for an expense or a reimbursement claim.
 * Routes: expenses/{id}/receipt and reimbursements/{id}/receipt.
 */
class ReceiptController extends Controller
{
    private const MODELS = [
        'expenses' => Expense::class,
        'reimbursements' => Reimbursement::class,
    ];

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            // 8 MB covers phone photos. Only formats a browser can display; iPhones
            // convert HEIC to JPEG when uploading through the browser.
            'receipt' => ['required', 'file', 'max:8192', 'mimes:jpg,jpeg,png,webp,pdf'],
        ]);

        $record = $this->find($request);
        $record->attachReceipt($request->file('receipt'));

        return response()->json(['has_receipt' => true]);
    }

    public function show(Request $request): StreamedResponse
    {
        $record = $this->find($request);
        abort_unless($record->hasReceipt() && Storage::disk('local')->exists($record->receipt_path), 404, 'No receipt attached.');

        return Storage::disk('local')->response($record->receipt_path, null, [
            'Cache-Control' => 'private, max-age=300',
        ]);
    }

    public function destroy(Request $request): Response
    {
        $this->find($request)->removeReceipt();

        return response()->noContent();
    }

    /**
     * Resolve by route parameter name; "type" is a per-route default (see routes/api.php).
     *
     * @return Expense|Reimbursement
     */
    private function find(Request $request): Model
    {
        $model = self::MODELS[$request->route('type')] ?? abort(404);

        return $model::findOrFail((int) $request->route('id'));
    }
}
