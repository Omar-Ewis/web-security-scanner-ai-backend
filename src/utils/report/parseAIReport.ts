const cleanMarkdown = (value: string) => {
  return value
    .replace(/```/g, "")
    .replace(/\r/g, "")
    .replace(/\btxt\b/g, "")
    .replace(/\n\s*\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "")
    .join("\n")
    .trim();
};

const escapeHtml = (value: string) => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const parseAIReport = (text: string) => {
  const safeText = text || "";

  const title =
    safeText
      .match(
        /\*\*Title:\*\*\s*([\s\S]*?)(?=\n\n|\n\*\*)/
      )?.[1]
      ?.trim()

      ||

    safeText
      .match(/\*\*(.*?)\*\*/)
      ?.[1]
      ?.trim()

      ||

    "AI Security Finding";

  const summary =
    safeText
      .match(
        /\*\*Summary:\*\*\s*([\s\S]*?)(?=\n\*\*Affected Endpoint:\*\*)/
      )?.[1]
      ?.trim()

      ||

    "No summary provided.";

  const affectedEndpoint =
    safeText
      .match(
        /\*\*Affected Endpoint:\*\*\s*([\s\S]*?)(?=\n\*\*Vulnerable Parameter:\*\*)/
      )?.[1]
      ?.trim()

      ||

    "N/A";

  const vulnerableParameter =
    safeText
      .match(
        /\*\*Vulnerable Parameter:\*\*\s*([\s\S]*?)(?=\n## Steps to Reproduce)/
      )?.[1]
      ?.trim()

      ||

    "N/A";

  const steps =
    safeText
      .match(
        /## Steps to Reproduce\s*([\s\S]*?)(?=\n\*\*Impact:\*\*)/
      )?.[1]
      ?.trim()

      ||

    "No steps provided.";

  const impact =
    safeText
      .match(
        /\*\*Impact:\*\*\s*([\s\S]*?)(?=\n\*\*Severity:\*\*)/
      )?.[1]
      ?.trim()

      ||

    "No impact provided.";

  const severity =
    safeText
      .match(
        /\*\*Severity:\*\*\s*(.*)/
      )?.[1]
      ?.trim()

      ||

    "Unknown";

  return {
    title: escapeHtml(cleanMarkdown(title)),

    summary: escapeHtml(
      cleanMarkdown(summary)
    ),

    affectedEndpoint: escapeHtml(
      cleanMarkdown(affectedEndpoint)
    ),

    vulnerableParameter: escapeHtml(
      cleanMarkdown(vulnerableParameter)
    ),

    steps: escapeHtml(
      cleanMarkdown(steps)
    ),

    impact: escapeHtml(
      cleanMarkdown(impact)
    ),

    severity: escapeHtml(
      cleanMarkdown(severity)
    ),
  };
};