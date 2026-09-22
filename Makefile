# TrackTheCash — Makefile
# Convenience targets for Docker Compose workflow
#
# NOTE: On Docker Desktop 4.92+, chaining `down -v && up --build` in a single
# shell command can trigger a transient "Error response from daemon: Not Found".
# These targets run the commands separately to avoid this issue.

.PHONY: fresh up down logs status nuke

# Full clean restart: wipe volumes, rebuild images, start detached
fresh:
	docker compose down -v --remove-orphans || true
	docker compose up --build -d
	docker compose logs -f

# Build and start (detached) without wiping data
up:
	docker compose up --build -d

# Stop all containers (keep volumes/data)
down:
	docker compose down

# Stop all containers AND wipe all data volumes
nuke:
	docker compose down -v --remove-orphans

# Follow live logs for all services
logs:
	docker compose logs -f

# Follow logs for a single service: make logs-api
logs-%:
	docker compose logs -f $*

# Show running container status
status:
	docker compose ps

# Restart a single service: make restart-api
restart-%:
	docker compose restart $*
