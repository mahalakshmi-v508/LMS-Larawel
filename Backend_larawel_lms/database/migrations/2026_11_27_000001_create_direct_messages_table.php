<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('direct_messages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sender_user_id');
            $table->unsignedBigInteger('recipient_user_id');
            $table->text('message');
            $table->timestamp('sent_at')->useCurrent();

            $table->index(['sender_user_id', 'recipient_user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('direct_messages');
    }
};
