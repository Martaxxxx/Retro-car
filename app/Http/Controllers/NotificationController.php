<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Notification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminSeesAllNotificationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_sees_all_notifications()
    {
        // 1. Utwórz użytkowników
        $admin = User::factory()->create(['role' => 'admin']);
        $user1 = User::factory()->create(['role' => 'user']);
        $user2 = User::factory()->create(['role' => 'user']);

        // 2. Utwórz powiadomienia
        $notification1 = Notification::factory()->create(['text' => 'Powiadomienie dla user1']);
        $notification2 = Notification::factory()->create(['text' => 'Powiadomienie dla user2']);
        $notification3 = Notification::factory()->create(['text' => 'Powiadomienie ogólne']);

        // 3. Przypisz powiadomienia userom przez pivot (user-notification)
        $user1->notifications()->attach($notification1->id, ['read' => false]);
        $user2->notifications()->attach($notification2->id, ['read' => false]);
        // notification3 nie jest przypisane nikomu przez pivot

        // 4. Zaloguj admina i pobierz powiadomienia z endpointu
        $this->actingAs($admin);

        $response = $this->getJson("/api/notifications/{$admin->id}");
        $response->assertStatus(200);

        $notifications = $response->json('notifications');
        $texts = collect($notifications)->pluck('text');

        // 5. Sprawdź, czy admin widzi WSZYSTKIE powiadomienia (w tym nieprzypisane przez pivot)
        $this->assertContains('Powiadomienie dla user1', $texts);
        $this->assertContains('Powiadomienie dla user2', $texts);
        $this->assertContains('Powiadomienie ogólne', $texts);

        // Dodatkowa asercja: admin widzi dokładnie 3 powiadomienia (jeśli nie ma innych w bazie)
        $this->assertCount(3, $notifications);
    }
}