#!/bin/sh
set -e

echo "→ Generando cliente de Prisma..."
npx prisma generate

echo "→ Aplicando schema a la base de datos..."
npx prisma db push --skip-generate

echo "→ Iniciando aplicación..."
exec npm run dev
