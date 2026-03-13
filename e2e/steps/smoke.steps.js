import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { test } from './fixtures.js';

const { Then } = createBdd(test);

Then('aucune erreur console n\'est présente', async ({ consoleErrors }) => {
  expect(consoleErrors).toEqual([]);
});
