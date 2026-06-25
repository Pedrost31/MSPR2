/**
 * Exporte la spécification OpenAPI du backend HealthAI Coach vers un fichier JSON.
 *
 * Utilisation :
 *   npx ts-node scripts/export-openapi.ts            # → ../docs/openapi.json
 *   npx ts-node scripts/export-openapi.ts chemin.json
 *
 * La spec est générée à partir de src/docs/swagger.ts (source de vérité unique),
 * ce qui garantit qu'elle reste synchronisée avec le code.
 */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { swaggerSpec } from '../src/docs/swagger';

const target = process.argv[2]
  ? resolve(process.cwd(), process.argv[2])
  : resolve(__dirname, '..', '..', 'docs', 'openapi.json');

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, JSON.stringify(swaggerSpec, null, 2), 'utf-8');

console.log(`OpenAPI exporté vers : ${target}`);
