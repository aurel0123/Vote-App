import { cpSync } from 'fs';
cpSync('src/generated', 'dist/generated', { recursive: true });
