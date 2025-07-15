<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserAccessControlTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_cannot_access_zarzadzanie_panel()
    {
        $user = User::factory()->create(['role' => 'user']);
        $this->actingAs($user);

        $response = $this->get('/zarządzanie');
        $response->assertForbidden(); // alias dla 403

        // Pomocniczo: wypisz treść odpowiedzi jeśli test padnie
        if ($response->status() !== 403) {
            dump($response->getContent());
        }
    }

    public function test_admin_can_access_zarzadzanie_panel()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        $response = $this->get('/zarządzanie');
        $response->assertOk(); // alias dla 200

        if ($response->status() !== 200) {
            dump($response->getContent());
        }
    }

    public function test_manager_can_access_zarzadzanie_panel()
    {
        $manager = User::factory()->create(['role' => 'manager']);
        $this->actingAs($manager);

        $response = $this->get('/zarządzanie');
        $response->assertOk(); // alias dla 200

        if ($response->status() !== 200) {
            dump($response->getContent());
        }
    }
}