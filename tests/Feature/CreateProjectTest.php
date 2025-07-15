<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreateProjectTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_project()
    {
        // Tworzymy użytkownika z rolą admin
        $user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($user);

        // Wysyłamy żądanie utworzenia projektu
        $response = $this->post('/projects', [
            'name' => 'Testowy projekt',
            'brand' => 'Fiat',
            'model' => '126p',
            'start_date' => '2025-07-15',
            'end_date' => '2025-07-16',
            'status' => 'Utworzony',
            'year' => 2025,
            'vin' => 'VIN12345',
            'car_id' => 'ID12345',
        ], ['Accept' => 'application/json']);

        // Sprawdzamy, czy odpowiedź to 201 Created
        $response->assertStatus(201);

        // Sprawdzamy, czy projekt pojawił się w bazie
        $this->assertDatabaseHas('projects', [
            'name' => 'Testowy projekt'
        ]);
    }
}