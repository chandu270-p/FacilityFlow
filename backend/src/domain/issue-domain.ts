export const ISSUE_CATEGORIES = [
  'Electrical',
  'HVAC',
  'Plumbing',
  'IT / Network',
  'Furniture',
  'Cleaning',
  'Security',
  'General Facilities'
] as const;

export const ISSUE_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const;
export const ISSUE_STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'] as const;

export const VALID_LIFECYCLE = ['Open', 'In Progress', 'Resolved', 'Closed'] as const;

export function isValidCategory(value: string): boolean {
  return ISSUE_CATEGORIES.includes(value as any);
}

export function isValidPriority(value: string): boolean {
  return ISSUE_PRIORITIES.includes(value as any);
}

export function isValidStatus(value: string): boolean {
  return ISSUE_STATUSES.includes(value as any);
}

export function isValidLifecycleTransition(from: string, to: string): boolean {
  const fromIndex = VALID_LIFECYCLE.indexOf(from as any);
  const toIndex = VALID_LIFECYCLE.indexOf(to as any);

  if (fromIndex === -1 || toIndex === -1) return false;
  if (from === to) return true;

  return toIndex === fromIndex + 1 || (from === 'Open' && to === 'In Progress');
}

export function isResolutionRequiredForState(status: string): boolean {
  return status === 'Resolved' || status === 'Closed';
}
