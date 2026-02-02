export type Issue = {
  message?: string;
  issues?: Record<string | number, Issue>;
};

export class SchemaError extends Error {
  constructor(public readonly issue: Issue) {
    super(issue.message);
    this.name = 'SchemaError';
  }

  flatten(): string[] {
    const results: string[] = [];
    const traverse = (current: Issue, path: string[]) => {
      if (current.message) {
        results.push(`${path.join('.')}: ${current.message}`);
      }
      if (current.issues) {
        for (const [key, subIssue] of Object.entries(current.issues)) {
          traverse(subIssue, [...path, key]);
        }
      }
    };

    traverse(this.issue, []);
    return results;
  }
}
