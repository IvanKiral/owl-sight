import { error, success, type WithError } from "shared";
import type { TimeRange } from "visual-insights";

export const parseTimeRange = (input: string): WithError<TimeRange, string> => {
  const trimmed = input.trim();

  if (!trimmed.includes(":")) {
    return error("Invalid time range format. Expected 'START:END', ':END', or 'START:'");
  }

  const parts = trimmed.split(":");

  if (parts.length !== 2) {
    return error("Invalid time range format. Expected 'START:END', ':END', or 'START:'");
  }

  const startStr = parts[0] as string;
  const endStr = parts[1] as string;

  const parseNumber = (str: string): number | undefined => {
    if (str === "") {
      return undefined;
    }
    const num = Number(str);
    if (Number.isNaN(num) || num < 0) {
      return undefined;
    }
    return num;
  };

  const start = startStr === "" ? undefined : parseNumber(startStr);
  const end = endStr === "" ? undefined : parseNumber(endStr);

  if (startStr !== "" && start === undefined) {
    return error(`Invalid start time: "${startStr}". Must be a non-negative number.`);
  }

  if (endStr !== "" && end === undefined) {
    return error(`Invalid end time: "${endStr}". Must be a non-negative number.`);
  }

  if (start !== undefined && end !== undefined && start >= end) {
    return error(`Start time (${start}) must be less than end time (${end}).`);
  }

  return success({ start, end });
};
