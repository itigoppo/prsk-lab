POSTGRES_CONTAINER := prsk-postgres

.PHONY: \
	docker-up docker-down docker-build docker-rebuild docker-logs \
	run build start install clean secret-generate \
	prisma-generate prisma-migrate prisma-deploy prisma-reset prisma-studio open-studio \
	seed fix

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
	npm run dev

# Build the project
build:
	npm run build

# Start the project
start:
	npm run start

# Install dependencies
install:
	npm install

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
		npx prisma db push --force-reset; \
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
	npm run fix
