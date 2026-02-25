import assert from 'node:assert/strict';
import test from 'node:test';
import { stripControlCharacters, stripHtmlTags, escapeHtml, isValidUrl } from './security.ts';

// Tests for stripControlCharacters
test('stripControlCharacters returns empty string for null/undefined/empty input', () => {
  assert.equal(stripControlCharacters(''), '');
  assert.equal(stripControlCharacters(null as any), '');
  assert.equal(stripControlCharacters(undefined as any), '');
});

test('stripControlCharacters trims leading and trailing whitespace', () => {
  assert.equal(stripControlCharacters('  hello  '), 'hello');
  assert.equal(stripControlCharacters('\n  hello\t  '), 'hello');
});

test('stripControlCharacters preserves normal characters', () => {
  const input = 'Hello World 123! @#$%^&*()';
  assert.equal(stripControlCharacters(input), input);
});

test('stripControlCharacters removes control characters', () => {
  // \x00 - NULL
  // \x07 - BEL
  // \x1F - Unit Separator
  // \x7F - DEL
  const input = 'hello\x00world\x07!\x1F\x7F';
  assert.equal(stripControlCharacters(input), 'helloworld!');
});

test('stripControlCharacters preserves allowed whitespace characters', () => {
  // \x09 - Tab
  // \x0A - LF
  // \x0D - CR
  const input = 'line1\nline2\r\ntab\tspace';
  assert.equal(stripControlCharacters(input), input);
});

test('stripControlCharacters handles complex mixed input', () => {
  const input = ' \x01  Clean \n This \t Up \x1B  ';
  // \x01 (SOH) and \x1B (ESC) should be removed.
  // Trimming should remove outer spaces.
  assert.equal(stripControlCharacters(input), 'Clean \n This \t Up');
});

// Tests for stripHtmlTags
test('stripHtmlTags returns undefined for empty input', () => {
  assert.equal(stripHtmlTags(null), undefined);
  assert.equal(stripHtmlTags(undefined), undefined);
  assert.equal(stripHtmlTags(''), undefined);
});

test('stripHtmlTags removes basic HTML tags', () => {
  assert.equal(stripHtmlTags('<p>Hello</p>'), 'Hello');
  assert.equal(stripHtmlTags('<div><span>World</span></div>'), 'World');
  assert.equal(stripHtmlTags('<br/>'), '');
});

test('stripHtmlTags handles attributes', () => {
  assert.equal(stripHtmlTags('<a href="https://example.com">Link</a>'), 'Link');
  assert.equal(stripHtmlTags('<img src="x" alt="image" />'), '');
});

test('stripHtmlTags is not a robust XSS sanitizer', () => {
  // Documenting known limitation: nested/malformed tags might leak
  // But for simple "strip" use cases, it should work reasonably well
  // <script>alert(1)</script> -> alert(1)
  assert.equal(stripHtmlTags('<script>alert(1)</script>'), 'alert(1)');
});

// Tests for escapeHtml
test('escapeHtml escapes special characters', () => {
  assert.equal(escapeHtml('<script>'), '&lt;script&gt;');
  assert.equal(escapeHtml('User "Name"'), 'User &quot;Name&quot;');
  assert.equal(escapeHtml("User 'Name'"), 'User &#039;Name&#039;');
  assert.equal(escapeHtml('A & B'), 'A &amp; B');
});

test('escapeHtml handles mixed content', () => {
  const input = '<div class="test">Content & More</div>';
  const expected = '&lt;div class=&quot;test&quot;&gt;Content &amp; More&lt;/div&gt;';
  assert.equal(escapeHtml(input), expected);
});

test('escapeHtml returns empty string for empty input', () => {
  assert.equal(escapeHtml(''), '');
});

// Tests for isValidUrl
test('isValidUrl returns true for valid http/https URLs', () => {
  assert.equal(isValidUrl('https://example.com'), true);
  assert.equal(isValidUrl('http://example.com'), true);
  assert.equal(isValidUrl('https://sub.domain.co.uk/path?query=1'), true);
});

test('isValidUrl returns false for javascript: URLs', () => {
  // eslint-disable-next-line no-script-url
  assert.equal(isValidUrl('javascript:alert(1)'), false);
  // eslint-disable-next-line no-script-url
  assert.equal(isValidUrl('javascript:void(0)'), false);
});

test('isValidUrl returns false for data: URLs', () => {
  assert.equal(isValidUrl('data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='), false);
});

test('isValidUrl returns false for file: URLs', () => {
  assert.equal(isValidUrl('file:///etc/passwd'), false);
});

test('isValidUrl returns false for invalid URLs', () => {
  assert.equal(isValidUrl('not-a-url'), false);
  assert.equal(isValidUrl(''), false);
  assert.equal(isValidUrl(null as any), false);
  assert.equal(isValidUrl(undefined as any), false);
});
