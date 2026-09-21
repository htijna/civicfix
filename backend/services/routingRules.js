const CATEGORY_DEPARTMENT_MAP = [
  { patterns: [/road/i, /pothole/i, /drain/i], department: 'Engineering/Public Works' },
  { patterns: [/street\s*light/i, /streetlight/i, /traffic\s*signal/i, /electric/i], department: 'Electrical' },
  { patterns: [/water/i, /leak/i, /pipe/i], department: 'Water Supply' },
  { patterns: [/garbage/i, /waste/i, /sanitation/i, /dump/i], department: 'Sanitation' },
  { patterns: [/park/i, /tree/i], department: 'Parks and Recreation' }
];

const DEPARTMENT_ALIASES = {
  'Engineering/Public Works': ['Engineering/Public Works', 'Engineering', 'Public Works', 'Roads and Public Works'],
  Electrical: ['Electrical', 'Electrical and Streetlights'],
  'Water Supply': ['Water Supply', 'Water Authority'],
  Sanitation: ['Sanitation', 'Waste Management'],
  'Parks and Recreation': ['Parks and Recreation']
};

export function departmentForCategory(category = '') {
  const match = CATEGORY_DEPARTMENT_MAP.find(rule => rule.patterns.some(pattern => pattern.test(category)));
  return match?.department || null;
}

export function departmentNameCandidates(departmentName, category) {
  const mappedName = departmentName || departmentForCategory(category);
  if (!mappedName) return [];
  return [...new Set([mappedName, ...(DEPARTMENT_ALIASES[mappedName] || [])])];
}

export { CATEGORY_DEPARTMENT_MAP };
