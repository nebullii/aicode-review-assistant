import os
import json
from typing import Dict

# Try to import Google Cloud, but make it optional
try:
    from google.cloud import aiplatform
    from google.oauth2 import service_account
    GOOGLE_CLOUD_AVAILABLE = True
except ImportError:
    GOOGLE_CLOUD_AVAILABLE = False
    print("⚠️  Google Cloud libraries not available. Using mock responses.")

class VertexAIService:
    """SCRUM-87: Google Vertex AI Integration for Code Analysis"""
    
    def __init__(self):
        self.use_mock = not GOOGLE_CLOUD_AVAILABLE

        if not self.use_mock:
            self.project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
            self.location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
            self.model_name = "gemini-2.5-flash"  # Updated to 2025 model (1.5 retired April 2025)

            # Check if project ID is set
            if not self.project_id:
                print("⚠️  GOOGLE_CLOUD_PROJECT not set. Using mock responses.")
                self.use_mock = True
                return

            # Load credentials from file
            # Try multiple paths: env var, Render secret files, local dev
            key_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
            possible_paths = [
                key_path,
                "/etc/secrets/gcp-credentials.json",  # Render Secret Files
                "/app/credentials/gcp-service-account.json",  # Local/Docker
            ]

            credentials_loaded = False
            for path in possible_paths:
                if path and os.path.exists(path):
                    try:
                        credentials = service_account.Credentials.from_service_account_file(path)
                        aiplatform.init(project=self.project_id, location=self.location, credentials=credentials)
                        print(f"✅ GCP credentials loaded from {path}")
                        credentials_loaded = True
                        break
                    except Exception as e:
                        print(f"⚠️  Failed to load GCP credentials from {path}: {e}")
                        continue

            if not credentials_loaded:
                print(f"⚠️  Credentials file not found in any location. Checked: {[p for p in possible_paths if p]}")
                print("⚠️  Using mock responses.")
                self.use_mock = True
    
    async def analyze_code_for_vulnerabilities(self, code: str, language: str = "javascript") -> Dict:
        """
        Analyze code using Vertex AI to detect security vulnerabilities
        SCRUM-87: Security Vulnerability Detection
        """

        # Use mock data if Google Cloud not available
        if self.use_mock:
            return self._mock_analysis(code, language)

        # Limit code size to prevent memory issues (max 10,000 characters)
        # For larger files, analyze only the first 10k characters
        MAX_CODE_LENGTH = 10000
        if len(code) > MAX_CODE_LENGTH:
            print(f"⚠️  Code too long ({len(code)} chars), analyzing first {MAX_CODE_LENGTH} characters")
            code = code[:MAX_CODE_LENGTH]
        
        prompt = f"""You are a security expert code reviewer. Analyze the following {language} code for security vulnerabilities.

Focus on detecting:
1. SQL Injection
2. Cross-Site Scripting (XSS)
3. Authentication/Authorization issues
4. Insecure deserialization
5. Sensitive data exposure
6. XML External Entities (XXE)
7. Broken access control
8. Security misconfiguration
9. Injection flaws
10. Insecure dependencies
11. Command Injection
12. Path Traversal
13. Insecure Cryptography
14. Race Conditions
15. Memory Safety Issues

Code to analyze:
```{language}
{code}
```

Return ONLY a JSON array of vulnerabilities found. Each vulnerability MUST have ALL these fields:
- type: REQUIRED - Must be one of: "SQL Injection", "Cross-Site Scripting (XSS)", "Command Injection", "Authentication Bypass", "Authorization Bypass", "Insecure Deserialization", "Sensitive Data Exposure", "XML External Entity (XXE)", "Broken Access Control", "Security Misconfiguration", "Path Traversal", "Insecure Cryptography", "Race Condition", "Memory Safety", "Injection Flaw", "Insecure Dependency", or "Security Issue" (use this as fallback only if no specific type applies)
- severity: REQUIRED - Must be exactly one of: "critical", "high", "medium", "low"
- line_number: REQUIRED - Integer line number where issue occurs
- code_snippet: REQUIRED - The actual problematic code (max 200 chars)
- description: REQUIRED - Clear explanation of the security issue
- recommendation: REQUIRED - Specific actionable fix
- confidence: REQUIRED - Float between 0.0 and 1.0

CRITICAL: The "type" field must NEVER be null, empty, or generic. Always provide a specific vulnerability type from the list above.

If no vulnerabilities found, return an empty array: []

Example of correct format:
[
  {{
    "type": "SQL Injection",
    "severity": "critical",
    "line_number": 15,
    "code_snippet": "query = f\\"SELECT * FROM users WHERE id = {{user_id}}\\"",
    "description": "SQL injection vulnerability due to string formatting in database query",
    "recommendation": "Use parameterized queries: cursor.execute(\\"SELECT * FROM users WHERE id = %s\\", (user_id,))",
    "confidence": 0.95
  }}
]
"""
        
        try:
            import vertexai
            from vertexai.generative_models import GenerativeModel, GenerationConfig

            # Initialize Vertex AI for this request
            vertexai.init(project=self.project_id, location=self.location)

            model = GenerativeModel(self.model_name)

            # Configure for JSON output
            generation_config = GenerationConfig(
                response_mime_type="application/json",
                temperature=0.2,  # Lower temperature for more consistent JSON
            )

            response = model.generate_content(
                prompt,
                generation_config=generation_config
            )
            
            result_text = response.text.strip()

            if result_text.startswith("```"):
                result_text = result_text.split("```")[1]
                if result_text.startswith("json"):
                    result_text = result_text[4:].strip()

            vulnerabilities = json.loads(result_text)

            # Validate and fix missing or invalid 'type' fields
            if isinstance(vulnerabilities, list):
                for vuln in vulnerabilities:
                    if not vuln.get("type") or vuln.get("type").strip() == "":
                        # Infer type from description if possible
                        description_lower = vuln.get("description", "").lower()
                        if "sql" in description_lower and "inject" in description_lower:
                            vuln["type"] = "SQL Injection"
                        elif "xss" in description_lower or "cross-site" in description_lower or "script" in description_lower:
                            vuln["type"] = "Cross-Site Scripting (XSS)"
                        elif "command" in description_lower and "inject" in description_lower:
                            vuln["type"] = "Command Injection"
                        elif "auth" in description_lower:
                            vuln["type"] = "Authentication Bypass"
                        elif "password" in description_lower or "credential" in description_lower or "secret" in description_lower:
                            vuln["type"] = "Sensitive Data Exposure"
                        elif "path" in description_lower and "travers" in description_lower:
                            vuln["type"] = "Path Traversal"
                        elif "crypt" in description_lower:
                            vuln["type"] = "Insecure Cryptography"
                        else:
                            # Fallback to generic type
                            vuln["type"] = "Security Issue"
                        print(f"⚠️  Fixed missing type field: {vuln['type']} (inferred from description)")

            result = {
                "vulnerabilities": vulnerabilities if isinstance(vulnerabilities, list) else [],
                "raw_response": response.text
            }

            # Force garbage collection to free memory
            import gc
            gc.collect()

            return result

        except Exception as e:
            print(f"❌ Vertex AI Error: {str(e)}")
            import gc
            gc.collect()
            return self._mock_analysis(code, language)
    
    def _mock_analysis(self, code: str, language: str) -> Dict:
        """
        Mock analysis for testing without Google Cloud
        SCRUM-87: Returns sample vulnerabilities for testing
        """
        vulnerabilities = []
        
        # Detect SQL injection patterns
        if "SELECT" in code and ("+" in code or "concat" in code.lower()):
            vulnerabilities.append({
                "type": "sql_injection",
                "severity": "critical",
                "line_number": 1,
                "code_snippet": code[:100],
                "description": "Potential SQL injection vulnerability detected due to string concatenation in SQL query",
                "recommendation": "Use parameterized queries or prepared statements instead of string concatenation",
                "confidence": 0.85
            })
        
        # Detect XSS patterns
        if "innerHTML" in code or "document.write" in code:
            vulnerabilities.append({
                "type": "cross_site_scripting",
                "severity": "high",
                "line_number": 1,
                "code_snippet": code[:100],
                "description": "Potential XSS vulnerability - unsafe DOM manipulation",
                "recommendation": "Use textContent or sanitize user input before inserting into DOM",
                "confidence": 0.75
            })
        
        # Detect hardcoded credentials
        if "password" in code.lower() and ("=" in code or ":" in code):
            vulnerabilities.append({
                "type": "sensitive_data_exposure",
                "severity": "critical",
                "line_number": 1,
                "code_snippet": "***REDACTED***",
                "description": "Hardcoded credentials detected in source code",
                "recommendation": "Use environment variables or secure credential management system",
                "confidence": 0.90
            })
        
        return {
            "vulnerabilities": vulnerabilities,
            "mock": True,
            "message": "Using mock analysis - Google Cloud AI not configured"
        }

vertex_ai_service = VertexAIService()