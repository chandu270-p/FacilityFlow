export async function listIssues() {
  return { issues: [] };
}

export async function createIssue(payload: Record<string, unknown>) {
  return { payload };
}
