import test from 'node:test';
import assert from 'node:assert/strict';
import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import { departmentForCategory, departmentNameCandidates } from '../services/routingRules.js';

test('user requires a valid minimum-length password', () => {
  const user = new User({ name: 'Test Citizen', email: 'citizen@example.com', password: 'short' });
  const error = user.validateSync();
  assert.ok(error.errors.password);
});

test('complaint accepts all workflow statuses', () => {
  const allowed = Complaint.schema.path('status').enumValues;
  assert.deepEqual(allowed, ['Submitted', 'Under Review', 'Assigned', 'Accepted', 'In Progress', 'Resolution Submitted', 'Resolved', 'Rejected', 'Exception']);
});

test('complaint categories map to responsible departments', () => {
  assert.equal(departmentForCategory('Road Damage'), 'Engineering/Public Works');
  assert.equal(departmentForCategory('Broken Streetlight'), 'Electrical');
  assert.equal(departmentForCategory('Water Leakage'), 'Water Supply');
  assert.equal(departmentForCategory('Garbage Overflow'), 'Sanitation');
});

test('mapped departments include existing seeded department aliases', () => {
  assert.ok(departmentNameCandidates(null, 'Road Damage').includes('Roads and Public Works'));
  assert.ok(departmentNameCandidates(null, 'Broken Streetlight').includes('Electrical and Streetlights'));
  assert.ok(departmentNameCandidates(null, 'Water Leakage').includes('Water Authority'));
  assert.ok(departmentNameCandidates(null, 'Garbage Overflow').includes('Waste Management'));
});
