POSTGRES_CONTAINER := prsk-postgres

.PHONY: \
	docker-up docker-down docker-build docker-rebuild docker-logs \
	run build start install clean secret-generate \
	prisma-generate prisma-migrate prisma-deploy prisma-reset prisma-studio open-studio \
	seed fix open-api-generate \
	test test-all test-unit test-integration test-coverage \
	check check-coverage check-lint check-type

# Start Docker containers
docker-up:
	docker compose up -d

# Stop Docker containers
docker-down:
	docker compose down

# Build Docker containers
docker-build:
	docker compose build

# Rebuild Docker containers
docker-rebuild:
	docker compose up --build -d

# Show Docker logs
docker-logs:
	docker logs -f $(EMULATOR_CONTAINER)

# Run the development server
run:
	pnpm dev

# Build the project
build:
	PRISMA_LOCAL=true pnpm build

# Start the project
start:
	pnpm start

# Install dependencies
install:
	pnpm install

# Clean the project
clean:
	rm -rf .next node_modules prisma/node_modules

# Generate secret
secret-generate:
	openssl rand -base64 32 | tr '+/' '-_' | tr -d '='

# Generate Prisma client
prisma-generate:
	npx prisma generate

# Run Prisma migrations
prisma-migrate:
	npx prisma migrate dev $(if $(CREATE_ONLY),--create-only) --name $(NAME)

prisma-deploy:
	npx prisma migrate deploy

# Reset Prisma migrations
prisma-reset:
	@read -p "⚠️  Destroys all data in your database and runs seed. Proceed? [y/N]: " ans; \
	if [ "$$ans" = "y" ]; then \
		npx prisma migrate reset; \
		make seed; \
	else \
		echo "❌ Cancelled."; \
	fi

# Run Prisma Studio
prisma-studio:
	npx prisma studio

# Open Prisma Studio
open-studio:
	open http://localhost:5555

# Seed the database
seed:
	npx ts-node --project tsconfig.seed.json prisma/seeds/index.ts

# Fix code
fix:
	pnpm fix

# Generate OpenAPI
open-api-generate:
	pnpm generate:openapi && pnpm generate:api

# Run all tests (unit + integration)
test:
	pnpm test:all && pnpm test:check-coverage

# Run all tests (alias for test)
test-all:
	pnpm test:all

# Run unit tests only
test-unit:
	pnpm test:unit

# Run integration tests only
test-integration:
	pnpm test:integration

# Run test coverage check
test-coverage:
	pnpm test:check-coverage

# Run check
check:
	pnpm check

# Run check:coverage
check-coverage:
	pnpm test:check-coverage

# Run check:lint
check-lint:
	pnpm lint

# Run check:type
check-type:
	pnpm check:type
