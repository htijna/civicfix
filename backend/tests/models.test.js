import test from 'node:test';
import assert from 'node:assert/strict';
import User from '../models/User.js';
import Complaint from '../models/Complaint.js';

test('user requires a valid minimum-length password', () => {
  const user = new User({ name: 'Test Citizen', email: 'citizen@example.com', password: 'short' });
  const error = user.validateSync();
  assert.ok(error.errors.password);
});

test('complaint accepts all workflow statuses', () => {
  const allowed = Complaint.schema.path('status').enumValues;
  assert.deepEqual(allowed, ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected']);
});
