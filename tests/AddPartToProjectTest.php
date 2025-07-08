<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Project;
use App\Models\User;

class AddPartToProjectTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_add_part_to_project()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        $partData = [
            'partCode' => 'KOD-123',
            'name' => 'Nowa część',
            'category' => 'Silnik',
            'notes' => 'Testowa część',
            'status' => 'pending'
        ];

        $response = $this->actingAs($user)->postJson("/api/projects/{$project->id}/parts", $partData);
        $response->assertStatus(201);

        // Sprawdź, czy część jest w bazie
        $this->assertDatabaseHas('parts', [
            'project_id' => $project->id,
            'name' => 'silniczek',
            'partCode' => 'TTOYOTA-001'
        ]);
    }
}