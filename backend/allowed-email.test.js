import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedEmail } from './allowed-email.js';

test('accepts addresses on the allowed domain', () => {
  assert.equal(isAllowedEmail('someone@gmail.com', 'gmail.com'), true);
});

test('is case-insensitive', () => {
  assert.equal(isAllowedEmail('Someone@GMail.COM', 'gmail.com'), true);
});

test('rejects other domains', () => {
  assert.equal(isAllowedEmail('someone@company.com', 'gmail.com'), false);
  assert.equal(isAllowedEmail('someone@notgmail.com', 'gmail.com'), false);
  assert.equal(isAllowedEmail('someone@gmail.com.evil.com', 'gmail.com'), false);
});

test('rejects malformed input', () => {
  assert.equal(isAllowedEmail('gmail.com', 'gmail.com'), false);
  assert.equal(isAllowedEmail('@gmail.com', 'gmail.com'), false);
  assert.equal(isAllowedEmail(undefined, 'gmail.com'), false);
});
