import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildEscalationEmail, escapeHtml } from '../../src/services/emailService.js';

describe('Email HTML Escaping & Security', () => {
  it('correctly escapes dangerous HTML characters via escapeHtml', () => {
    assert.equal(escapeHtml('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    assert.equal(escapeHtml("Tom & Jerry's"), 'Tom &amp; Jerry&#39;s');
    assert.equal(escapeHtml(null), '');
    assert.equal(escapeHtml(undefined), '');
  });

  it('escapes user-provided values in buildEscalationEmail to prevent XSS injection', () => {
    const maliciousPayload = {
      patientName: '<img src=x onerror=alert(1)>Ramesh',
      medicineName: '<script>stealCookies()</script>Metformin',
      dosage: '500mg "style=color:red"',
      scheduledSlot: 'morning<b onfocus=alert(2)>',
      scheduledTime: '08:00',
      tier: '3',
    };

    const emailHtml = buildEscalationEmail(maliciousPayload);

    assert.ok(!emailHtml.includes('<script>stealCookies()</script>'), 'Must not contain raw script tags');
    assert.ok(emailHtml.includes('&lt;script&gt;stealCookies()&lt;/script&gt;'), 'Must contain escaped script tags');
    assert.ok(!emailHtml.includes('<img src=x onerror=alert(1)>'), 'Must not contain raw img error handlers');
    assert.ok(emailHtml.includes('&lt;img src=x onerror=alert(1)&gt;'), 'Must contain escaped img tags');
    assert.ok(emailHtml.includes('&quot;style=color:red&quot;'), 'Must contain escaped quotes');
  });
});
