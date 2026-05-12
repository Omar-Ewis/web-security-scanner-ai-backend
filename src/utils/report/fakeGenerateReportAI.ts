export const fakeGenerateReportAI = async () => {
  return {
    vulnerabilities: [
      {
        id: null,
        scanId: null,
        alert: "SQL Injection",
        url: "http://demo.testfire.net/images/index.jsp?content=inside_investor.htm+AND+1%3D1+--+",
        ai_report: `
**SQL Injection in \`content\`**

**Summary:**
A SQL injection vulnerability was discovered in the \`content\` parameter of the endpoint, allowing attackers to inject malicious SQL queries.

**Affected Endpoint:**
\`http://demo.testfire.net/images/index.jsp\` (GET)

**Vulnerable Parameter:**
\`content\`

**Proof of Concept (PoC):**
Payload used:

\`\`\`
inside_investor.htm AND 1=1 --
\`\`\`

Steps to Reproduce:
1. Navigate to the vulnerable endpoint
2. Inject the SQL payload
3. Submit the request
4. Observe authentication bypass

**Impact:**
- Unauthorized access to sensitive data
- Database compromise
- Authentication bypass

**Severity:**
High
        `,
      },
      {
        id: null,
        scanId: null,
        alert: "Cross Site Scripting (Reflected)",
        url: "http://demo.testfire.net/search.jsp?query=%3Cscript%3Ealert(1)%3C/script%3E",
        ai_report: `
**Cross Site Scripting (Reflected) in \`query\`**

**Summary:**
A reflected XSS vulnerability exists in the \`query\` parameter of the search functionality.

**Affected Endpoint:**
\`http://demo.testfire.net/search.jsp\` (GET)

**Vulnerable Parameter:**
\`query\`

**Proof of Concept (PoC):**
Payload used:

\`\`\`
<script>alert(1)</script>
\`\`\`

Steps to Reproduce:
1. Open the search page
2. Inject malicious JavaScript payload
3. Submit the request
4. Observe JavaScript execution

**Impact:**
- Session hijacking
- Credential theft
- Client-side attacks

**Severity:**
High
        `,
      },
      {
        id: null,
        scanId: null,
        alert: "SQL Injection",
        url: "http://demo.testfire.net/doLogin",
        ai_report: `
**SQL Injection in \`uid\`**

**Summary:**
The login functionality is vulnerable to SQL injection via the \`uid\` parameter.

**Affected Endpoint:**
\`http://demo.testfire.net/doLogin\` (POST)

**Vulnerable Parameter:**
\`uid\`

**Proof of Concept (PoC):**
Payload used:

\`\`\`
ZAP' OR '1'='1' --
\`\`\`

Steps to Reproduce:
1. Open login endpoint
2. Inject SQL payload into uid parameter
3. Submit login request
4. Observe authentication bypass

**Impact:**
- Unauthorized access
- Arbitrary SQL execution
- Database compromise

**Severity:**
High
        `,
      },
    ],
  };
};