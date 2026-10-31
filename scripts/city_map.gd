extends Node3D

# Lightweight procedural city block. Replace placeholder geometry with Kenney GLB assets later.
const BLOCK_SPACING := 24.0
const ROAD_WIDTH := 8.0
const GRID_COUNT := 3

var camera: Camera3D

func _ready() -> void:
	_build_ground()
	_build_roads()
	_build_city_blocks()
	_build_lighting()
	_build_camera()

func _material(color: Color, roughness: float = 0.9) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = roughness
	return material

func _box(parent: Node3D, size: Vector3, pos: Vector3, material: Material) -> MeshInstance3D:
	var mesh_instance := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = size
	mesh_instance.mesh = mesh
	mesh_instance.position = pos
	mesh_instance.material_override = material
	parent.add_child(mesh_instance)
	return mesh_instance

func _build_ground() -> void:
	var ground_mat := _material(Color(0.22, 0.34, 0.25))
	_box(self, Vector3(112, 0.3, 112), Vector3(0, -0.2, 0), ground_mat)

func _build_roads() -> void:
	var asphalt := _material(Color(0.105, 0.12, 0.14))
	var sidewalk := _material(Color(0.56, 0.57, 0.55))
	var marking := _material(Color(0.92, 0.86, 0.62))
	var road_length := 104.0
	for i in range(-GRID_COUNT, GRID_COUNT + 1):
		var p := float(i) * BLOCK_SPACING
		_box(self, Vector3(road_length, 0.12, ROAD_WIDTH), Vector3(0, 0.02, p), asphalt)
		_box(self, Vector3(ROAD_WIDTH, 0.12, road_length), Vector3(p, 0.02, 0), asphalt)
		_box(self, Vector3(road_length, 0.04, 0.16), Vector3(0, 0.1, p), marking)
		_box(self, Vector3(0.16, 0.04, road_length), Vector3(p, 0.1, 0), marking)
		_box(self, Vector3(road_length, 0.22, 1.2), Vector3(0, 0.12, p - ROAD_WIDTH * 0.5 - 0.7), sidewalk)
		_box(self, Vector3(road_length, 0.22, 1.2), Vector3(0, 0.12, p + ROAD_WIDTH * 0.5 + 0.7), sidewalk)
		_box(self, Vector3(1.2, 0.22, road_length), Vector3(p - ROAD_WIDTH * 0.5 - 0.7, 0.12, 0), sidewalk)
		_box(self, Vector3(1.2, 0.22, road_length), Vector3(p + ROAD_WIDTH * 0.5 + 0.7, 0.12, 0), sidewalk)

func _build_city_blocks() -> void:
	var palettes := [
		Color(0.72, 0.68, 0.58),
		Color(0.55, 0.64, 0.69),
		Color(0.76, 0.75, 0.69),
		Color(0.66, 0.58, 0.49),
		Color(0.48, 0.58, 0.52)
	]
	var window_mat := _material(Color(0.16, 0.24, 0.29), 0.45)
	var index := 0
	for x in range(-GRID_COUNT, GRID_COUNT):
		for z in range(-GRID_COUNT, GRID_COUNT):
			var center := Vector3((float(x) + 0.5) * BLOCK_SPACING, 0, (float(z) + 0.5) * BLOCK_SPACING)
			var base := palettes[index % palettes.size()]
			var height := 7.0 + float((index * 7) % 17)
			var building_mat := _material(base)
			var width := 10.0 + float(index % 3)
			var depth := 10.0 + float((index + 1) % 3)
			_box(self, Vector3(width, height, depth), center + Vector3(0, height * 0.5, 0), building_mat)
			# Simple dark facade panels give the block a readable city scale.
			for floor in range(1, int(height / 3.0) + 1):
				var y := float(floor) * 3.0
				_box(self, Vector3(width * 0.72, 1.0, 0.08), center + Vector3(0, y, depth * 0.5 + 0.045), window_mat)
				_box(self, Vector3(0.08, 1.0, depth * 0.72), center + Vector3(width * 0.5 + 0.045, y, 0), window_mat)
			index += 1

func _build_lighting() -> void:
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-52, -35, 0)
	sun.light_energy = 1.15
	sun.shadow_enabled = true
	add_child(sun)
	var world := WorldEnvironment.new()
	var environment := Environment.new()
	environment.background_mode = Environment.BG_SKY
	var sky := Sky.new()
	var sky_material := ProceduralSkyMaterial.new()
	sky_material.sky_top_color = Color(0.16, 0.34, 0.55)
	sky_material.sky_horizon_color = Color(0.68, 0.78, 0.86)
	sky.sky_material = sky_material
	environment.sky = sky
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color = Color(0.68, 0.73, 0.8)
	environment.ambient_light_energy = 0.65
	world.environment = environment
	add_child(world)

func _build_camera() -> void:
	camera = Camera3D.new()
	camera.position = Vector3(48, 42, 48)
	camera.fov = 55.0
	camera.current = true
	add_child(camera)
	camera.look_at(Vector3.ZERO, Vector3.UP)
