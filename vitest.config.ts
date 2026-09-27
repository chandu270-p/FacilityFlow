import 'dotenv/config';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        exclude: ['node_modules', 'dist', 'frontend/tests/ux-acceptance.test.ts']
    }
});
