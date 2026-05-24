import { parseAIReport } from "./parseAIReport";

type BuildReportHtmlOptions = {
  aiReports: any[];
  scanId: string;
  typeOfRisk: string;
  totalVulnerabilities: number;
};

const getSeverityClass = (severity: string) => {
  const value = severity.toLowerCase();

  if (value.includes("high")) return "high";
  if (value.includes("medium")) return "medium";
  if (value.includes("low")) return "low";

  return "info";
};

export const buildReportHtml = ({
  aiReports,
  scanId,
  typeOfRisk,
  totalVulnerabilities,
}: BuildReportHtmlOptions) => {
  const vulnerabilitiesHtml = aiReports
    .map((report: any, index: number) => {
      const vulnerability = parseAIReport(report.ai_report);

      const severityClass = getSeverityClass(vulnerability.severity);

      return `
        <section class="vulnerability-page">
          <div class="top-bar ${severityClass}"></div>

          <div class="vulnerability-card">

            <div class="vuln-header">
              <p class="vuln-label">
                Vulnerability #${index + 1}
              </p>

              <h2>
                ${vulnerability.title}
              </h2>

              <span class="severity-badge ${severityClass}">
                ${vulnerability.severity}
              </span>
            </div>

            <div class="section">
              <h3>Summary</h3>

              <p>
                ${vulnerability.summary}
              </p>
            </div>

            <div class="section">
              <h3>Affected Endpoint</h3>

              <pre class="code-box">${vulnerability.affectedEndpoint}</pre>
            </div>

            <div class="section">
              <h3>Vulnerable Parameter</h3>

              <pre class="code-box">${vulnerability.vulnerableParameter}</pre>
            </div>

            <div class="section">
              <h3>Steps To Reproduce</h3>

              <pre class="steps-box">${vulnerability.steps}</pre>
            </div>

            <div class="section impact-box">
              <h3>Impact</h3>

              <p>
                ${vulnerability.impact}
              </p>
            </div>

            <div class="risk-info-grid">

              <div class="risk-info-item">
                <span>Severity</span>

                <strong>
                  ${vulnerability.severity}
                </strong>
              </div>

              <div class="risk-info-item">
                <span>Attack Vector</span>

                <strong>
                  Remote
                </strong>
              </div>

              <div class="risk-info-item">
                <span>Confidence</span>

                <strong>
                  High
                </strong>
              </div>

              <div class="risk-info-item">
                <span>Status</span>

                <strong>
                  Confirmed
                </strong>
              </div>

            </div>

            <div class="section mapping-box">

              <h3>Security Classification</h3>

              <p>
                <strong>Detected By:</strong>
                Common Vulnerability Scoring System (CVSS) + Black Cat Custom Framework Integrated with AI
              </p>

              <p>
                <strong>Review Type:</strong>
                Automated Security Analysis
              </p>

            </div>

          </div>

          <div class="footer">
            Black Cat AI Security Report · Scan ID: ${scanId}
          </div>
        </section>
      `;
    })
    .join("");

  return `
    <html>
      <head>
        <style>

          * {
            box-sizing: border-box;
          }

          @page {
            size: A4;
            margin: 0;
          }

          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background: #f8fafc;
            color: #0f172a;
          }

          .cover-page,
          .vulnerability-page {
            width: 210mm;
            height: 297mm;
            padding: 18mm;
            background: #f8fafc;
            page-break-after: always;
            break-after: page;
            overflow: hidden;
          }

          .vulnerability-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }

          .cover-page {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .cover-card {
            width: 100%;
            background: #ffffff;
            border-radius: 24px;
            padding: 42px;
            border: 1px solid #e5e7eb;
            box-shadow: 0 12px 35px rgba(15, 23, 42, 0.08);
          }

          .brand {
            color: #dc2626;
            font-size: 13px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 16px;
          }

          h1 {
            margin: 0;
            font-size: 38px;
            line-height: 1.2;
            color: #020617;
          }

          .subtitle {
            margin-top: 18px;
            color: #475569;
            line-height: 1.7;
            font-size: 15px;
          }

          .meta-grid {
            margin-top: 32px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
          }

          .meta-item {
            background: #f1f5f9;
            border-radius: 16px;
            padding: 16px;
            border: 1px solid #e2e8f0;
          }

          .meta-item span {
            display: block;
            margin-bottom: 7px;
            font-size: 11px;
            color: #64748b;
            font-weight: 700;
            text-transform: uppercase;
          }

          .meta-item strong {
            font-size: 14px;
            color: #0f172a;
            word-break: break-all;
          }

          .top-bar {
            height: 7px;
            border-radius: 999px;
            margin-bottom: 14px;
          }

          .top-bar.high {
            background: linear-gradient(
              90deg,
              #7f1d1d,
              #dc2626,
              #f87171
            );
          }

          .top-bar.medium {
            background: linear-gradient(
              90deg,
              #92400e,
              #f59e0b,
              #fbbf24
            );
          }

          .top-bar.low {
            background: linear-gradient(
              90deg,
              #14532d,
              #16a34a,
              #86efac
            );
          }

          .top-bar.info {
            background: linear-gradient(
              90deg,
              #1e3a8a,
              #2563eb,
              #93c5fd
            );
          }

          .vulnerability-card {
            background: #ffffff;
            border-radius: 22px;
            border: 1px solid #e5e7eb;
            padding: 22px;
            height: 242mm;
            box-shadow: 0 10px 30px rgba(15, 23, 42, 0.07);
            overflow: hidden;
          }

          .vuln-header {
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 13px;
            margin-bottom: 16px;
          }

          .vuln-label {
            margin: 0 0 8px;
            color: #dc2626;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 1.7px;
            text-transform: uppercase;
          }

          h2 {
            margin: 0;
            font-size: 21px;
            line-height: 1.25;
            color: #020617;
            word-break: break-word;
          }

          .severity-badge {
            display: inline-block;
            margin-top: 10px;
            padding: 6px 13px;
            border-radius: 999px;
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
          }

          .severity-badge.high {
            background: #fee2e2;
            color: #991b1b;
          }

          .severity-badge.medium {
            background: #fef3c7;
            color: #92400e;
          }

          .severity-badge.low {
            background: #dcfce7;
            color: #166534;
          }

          .severity-badge.info {
            background: #dbeafe;
            color: #1d4ed8;
          }

          .section {
            margin-bottom: 12px;
          }

          .section h3 {
            margin: 0 0 7px;
            color: #dc2626;
            font-size: 13px;
          }

          p {
            margin: 0;
            line-height: 1.55;
            font-size: 10.8px;
            color: #111827;
          }

          .code-box,
          .steps-box {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-left: 4px solid #dc2626;
            border-radius: 11px;
            padding: 9px 11px;
            font-family: Consolas, "Courier New", monospace;
            font-size: 9.8px;
            line-height: 1.45;
            color: #111827;
            white-space: pre-wrap;
            word-break: break-word;
            margin: 0;
          }

          .steps-box {
            max-height: 54mm;
            overflow: hidden;
          }

          .impact-box {
            background: #fff1f2;
            border: 1px solid #fecdd3;
            border-left: 4px solid #dc2626;
            border-radius: 14px;
            padding: 12px;
            margin-bottom: 12px;
          }

          .risk-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 9px;
            margin-bottom: 12px;
          }

          .risk-info-item {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 10px;
          }

          .risk-info-item span {
            display: block;
            font-size: 9px;
            color: #64748b;
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 5px;
          }

          .risk-info-item strong {
            font-size: 11px;
            color: #0f172a;
          }

          .mapping-box {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-left: 4px solid #2563eb;
            border-radius: 14px;
            padding: 12px;
          }

          .mapping-box h3 {
            color: #2563eb;
          }

          .mapping-box p {
            margin-bottom: 7px;
          }

          .footer {
            margin-top: 8px;
            text-align: center;
            color: #64748b;
            font-size: 9px;
          }

        </style>
      </head>

      <body>

        <section class="cover-page">

          <div class="cover-card">

            <div class="brand">
              Black Cat Security
            </div>

            <h1>
              AI Security Report
            </h1>

            <p class="subtitle">
              Automated vulnerability analysis report generated
              from scan results using AI-powered security analysis.
            </p>

            <div class="meta-grid">

              <div class="meta-item">
                <span>Scan ID</span>

                <strong>
                  ${scanId}
                </strong>
              </div>

              <div class="meta-item">
                <span>Risk Type</span>

                <strong>
                  ${typeOfRisk}
                </strong>
              </div>

              <div class="meta-item">
                <span>Total Vulnerabilities</span>

                <strong>
                  ${totalVulnerabilities}
                </strong>
              </div>

              <div class="meta-item">
                <span>Generated By</span>

                <strong>
                  Black Cat AI Engine
                </strong>
              </div>

            </div>

          </div>

        </section>

        ${vulnerabilitiesHtml}

      </body>
    </html>
  `;
};