export const parseAIReport = (text: string) => {
  const title =
    text.match(/\*\*(.*?)\*\*/)?.[1]?.trim() ||
    "AI Security Finding";

  const summary =
    text
      .match(
        /\*\*Summary:\*\*\s*([\s\S]*?)(?=\n\*\*Affected Endpoint:\*\*)/
      )?.[1]
      ?.trim() || "No summary provided.";

  const affectedEndpoint =
    text
      .match(
        /\*\*Affected Endpoint:\*\*\s*([\s\S]*?)(?=\n\*\*Vulnerable Parameter:\*\*)/
      )?.[1]
      ?.trim()
      .replace(/`/g, "") || "N/A";

  const vulnerableParameter =
    text
      .match(
        /\*\*Vulnerable Parameter:\*\*\s*([\s\S]*?)(?=\n\*\*Proof of Concept)/
      )?.[1]
      ?.trim()
      .replace(/`/g, "") || "N/A";

  const stepsText = 
    text
      .match(
        /Steps to Reproduce:\s*([\s\S]*?)(?=\n\*\*Impact:\*\*)/
      )?.[1]
      ?.trim() || "";

  const steps_to_reproduce = stepsText
    .split("\n")
    .map((step) => step.trim())
    .filter(Boolean)
    .map((step) => step.replace(/^\d+\.\s*/, ""));

  const impact =
    text
      .match(
        /\*\*Impact:\*\*\s*([\s\S]*?)(?=\n\*\*Severity:\*\*)/
      )?.[1]
      ?.trim()
      .replace(/\n- /g, "<br/>• ") ||
    "No impact provided.";

  const severity =
    text.match(/\*\*Severity:\*\*\s*([\s\S]*)/)?.[1]?.trim() ||
    "N/A";

  return {
    title,
    summary,
    affectedEndpoint,
    vulnerableParameter,
    steps_to_reproduce,
    impact,
    severity,
  };
};