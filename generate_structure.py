import os
import json

def create_directories_and_files():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Structure definition
    structure = {
        ".github": {
            "workflows": {}
        },
        "frontend": {
            "src": {
                "assets": {},
                "components": {
                    "common": {},
                    "layout": {}
                },
                "contexts": {},
                "hooks": {},
                "layouts": {},
                "pages": {},
                "services": {},
                "store": {},
                "styles": {},
                "utils": {}
            },
            "tests": {
                "unit": {},
                "integration": {},
                "e2e": {}
            }
        },
        "backend": {
            "src": {
                "config": {},
                "controllers": {},
                "middlewares": {},
                "models": {},
                "routes": {},
                "services": {},
                "utils": {},
                "validation": {}
            },
            "tests": {
                "unit": {},
                "integration": {},
                "e2e": {}
            }
        },
        "docs": {},
        "scripts": {}
    }
    
    def create_structure(current_path, current_struct):
        for name, content in current_struct.items():
            path = os.path.join(current_path, name)
            if not os.path.exists(path):
                os.makedirs(path)
            
            if isinstance(content, dict) and content:
                create_structure(path, content)
            elif isinstance(content, dict) and not content:
                # Empty directory, add .gitkeep
                gitkeep = os.path.join(path, ".gitkeep")
                if not os.path.exists(gitkeep):
                    with open(gitkeep, 'w') as f:
                        pass
    
    create_structure(base_dir, structure)

    def write_file(path, content):
        full_path = os.path.join(base_dir, path)
        if not os.path.exists(full_path):
            with open(full_path, 'w', encoding='utf-8') as f:
                if isinstance(content, str):
                    f.write(content)
                else:
                    json.dump(content, f, indent=2)

    # 1. CI/CD GitHub Actions
    write_file(".github/workflows/ci.yml", '''name: CI/CD Pipeline

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20.x'
      - run: npm ci
        working-directory: ./backend
      - run: npm test
        working-directory: ./backend

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20.x'
      - run: npm ci
        working-directory: ./frontend
      - run: npm test
        working-directory: ./frontend
''')

    # 2. Docker Compose
    write_file("docker-compose.yml", '''version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: dental_clinic
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - DATABASE_URL=postgres://postgres:password@db:5432/dental_clinic
    depends_on:
      - db
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:5000/api
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev -- --host 0.0.0.0

volumes:
  pgdata:
''')

    # 3. Dockerfiles
    write_file("backend/Dockerfile", '''FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]
''')

    write_file("frontend/Dockerfile", '''FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
''')

    write_file(".dockerignore", '''node_modules
dist
.env
.git
.github
coverage
''')
    write_file("frontend/.dockerignore", '''node_modules
dist
.env
coverage
''')
    write_file("backend/.dockerignore", '''node_modules
coverage
.env
''')

    # 4. Package JSON overrides (if they don't exist)
    frontend_pkg = {
        "name": "dental-clinic-frontend",
        "private": True,
        "version": "1.0.0",
        "type": "module",
        "scripts": {
            "dev": "vite",
            "build": "vite build",
            "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
            "preview": "vite preview",
            "test": "vitest run",
            "test:watch": "vitest",
            "test:ui": "vitest --ui",
            "test:coverage": "vitest run --coverage",
            "test:e2e": "cypress run"
        }
    }
    
    backend_pkg = {
        "name": "dental-clinic-backend",
        "version": "1.0.0",
        "description": "Enterprise Dental Clinic API",
        "main": "server.js",
        "type": "module",
        "scripts": {
            "start": "node server.js",
            "dev": "nodemon server.js",
            "test": "jest",
            "test:watch": "jest --watch",
            "test:coverage": "jest --coverage",
            "test:e2e": "jest --config jest.e2e.config.js"
        }
    }
    
    if not os.path.exists(os.path.join(base_dir, "frontend", "package.json")):
        write_file("frontend/package.json", frontend_pkg)
        
    if not os.path.exists(os.path.join(base_dir, "backend", "package.json")):
        write_file("backend/package.json", backend_pkg)

    print("Project folder structure with CI/CD, Docker, and Testing configurations generated successfully.")

if __name__ == "__main__":
    create_directories_and_files()
