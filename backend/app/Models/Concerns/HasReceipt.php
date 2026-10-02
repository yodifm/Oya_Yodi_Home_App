<?php

namespace App\Models\Concerns;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * An optional receipt photo/PDF stored on the private local disk
 * (storage/app/private/receipts). Only served through the authenticated API.
 *
 * @property string|null $receipt_path
 */
trait HasReceipt
{
    protected static function bootHasReceipt(): void
    {
        static::deleting(fn (self $model) => $model->deleteReceiptFile());
    }

    public function attachReceipt(UploadedFile $file): void
    {
        $this->deleteReceiptFile();
        $this->receipt_path = $file->store('receipts/'.$this->getTable(), 'local');
        $this->save();
    }

    public function removeReceipt(): void
    {
        $this->deleteReceiptFile();
        $this->receipt_path = null;
        $this->save();
    }

    public function hasReceipt(): bool
    {
        return $this->receipt_path !== null;
    }

    private function deleteReceiptFile(): void
    {
        if ($this->receipt_path) {
            Storage::disk('local')->delete($this->receipt_path);
        }
    }
}
