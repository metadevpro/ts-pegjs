/**
 * Types that are common to any generated parser.
 */
export const COMMON_TYPES_STR = `
export interface FilePosition {
  offset: number;
  line: number;
  column: number;
}

export interface FileRange {
  start: FilePosition;
  end: FilePosition;
  source: string;
}

export interface LiteralExpectation {
  type: "literal";
  text: string;
  ignoreCase: boolean;
}

export interface ClassParts extends Array<string | ClassParts> {}

export interface ClassExpectation {
  type: "class";
  parts: ClassParts;
  inverted: boolean;
  ignoreCase: boolean;
}

export interface AnyExpectation {
  type: "any";
}

export interface EndExpectation {
  type: "end";
}

export interface OtherExpectation {
  type: "other";
  description: string;
}

export type Expectation = LiteralExpectation | ClassExpectation | AnyExpectation | EndExpectation | OtherExpectation;

declare class _PeggySyntaxError extends Error {
  public static buildMessage(expected: Expectation[], found: string | null): string;
  public message: string;
  public expected: Expectation[];
  public found: string | null;
  public location: FileRange;
  public name: string;
  constructor(message: string, expected: Expectation[], found: string | null, location: FileRange);
  format(sources: {
    grammarSource?: string;
    text: string;
  }[]): string;
}

export interface TraceEvent {
    type: string;
    rule: string;
    result?: any;
    location: FileRange;
  }

declare class _DefaultTracer {
  private indentLevel: number;
  public trace(event: TraceEvent): void;
}
\n`;
