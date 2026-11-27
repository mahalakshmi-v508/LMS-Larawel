<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (! Schema::hasColumn('users', 'email')) {
                    $table->string('email')->nullable();
                }
                if (! Schema::hasColumn('users', 'account_id')) {
                    $table->string('account_id', 32)->nullable()->unique();
                }
            });
        }

        if (! Schema::hasTable('enquiries')) {
            Schema::create('enquiries', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('email')->nullable();
                $table->string('mobile_number', 20);
                $table->string('course_interest');
                $table->text('message')->nullable();
                $table->timestamp('created_at')->useCurrent();
                $table->string('status', 20)->default('pending');
                $table->string('account_id', 32)->nullable();
            });
        } else {
            Schema::table('enquiries', function (Blueprint $table) {
                if (! Schema::hasColumn('enquiries', 'status')) {
                    $table->string('status', 20)->default('pending');
                }
                if (! Schema::hasColumn('enquiries', 'account_id')) {
                    $table->string('account_id', 32)->nullable();
                }
            });
            DB::table('enquiries')
                ->whereNull('status')
                ->orWhere('status', '')
                ->update(['status' => 'pending']);
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('enquiries')) {
            Schema::table('enquiries', function (Blueprint $table) {
                if (Schema::hasColumn('enquiries', 'account_id')) {
                    $table->dropColumn('account_id');
                }
                if (Schema::hasColumn('enquiries', 'status')) {
                    $table->dropColumn('status');
                }
            });
        }

        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (Schema::hasColumn('users', 'account_id')) {
                    $table->dropColumn('account_id');
                }
            });
        }
    }
};
