import subprocess
import json
from typing import Dict, List
import tempfile
import os

class StyleAnalyzer:
    """
    Sprint 3: Style Analysis Rule Engine
    Analyzes Python code for style violations, naming conventions, and complexity
    """
    
    def analyze_style(self, code: str, file_path: str = "temp.py") -> Dict:
        """
        Analyze Python code for style issues
        Returns: Dictionary with style violations
        """
        issues = []
        
        # Create temporary file for analysis
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as tmp_file:
            tmp_file.write(code)
            tmp_path = tmp_file.name
        
        try:
            # Run pycodestyle for PEP 8 violations
            pep8_issues = self._check_pep8(tmp_path)
            issues.extend(pep8_issues)
            
            # Run pylint for code quality
            pylint_issues = self._check_pylint(tmp_path)
            issues.extend(pylint_issues)
            
            # Check naming conventions
            naming_issues = self._check_naming_conventions(code)
            issues.extend(naming_issues)
            
            # Check complexity
            complexity_issues = self._check_complexity(code)
            issues.extend(complexity_issues)
            
        finally:
            # Clean up temp file
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
        
        return {
            "total_issues": len(issues),
            "issues": issues,
            "categories": self._categorize_issues(issues)
        }
    
    def _check_pep8(self, file_path: str) -> List[Dict]:
        """Check PEP 8 style compliance - only important issues"""
        issues = []

        # Minor formatting issues to ignore (whitespace, blank lines, etc.)
        IGNORED_CODES = {
            'E302', 'E303', 'E305',  # Blank line issues
            'W293', 'W291',          # Whitespace on blank/trailing lines
            'E231', 'E225', 'E222', 'E223', 'E224', 'E226', 'E227', 'E228',  # Whitespace around operators
            'E251',                  # Unexpected spaces around keyword/parameter equals
            'E203',                  # Whitespace before punctuation
            'E501',                  # Line too long (handled by complexity check)
        }

        try:
            result = subprocess.run(
                ['pycodestyle', '--max-line-length=120', file_path],
                capture_output=True,
                text=True,
                timeout=10
            )

            for line in result.stdout.strip().split('\n'):
                if line:
                    # Parse: filename:line:column: error_code error_message
                    parts = line.split(':', 3)
                    if len(parts) >= 4:
                        error_code = parts[3].split()[0]

                        # Skip minor formatting issues
                        if error_code in IGNORED_CODES:
                            continue

                        issues.append({
                            "type": "style_violation",
                            "category": "pep8",
                            "severity": "low",
                            "line": int(parts[1]),
                            "column": int(parts[2]),
                            "code": error_code,
                            "message": parts[3],
                            "recommendation": "Follow PEP 8 style guidelines"
                        })
        except Exception as e:
            print(f"PEP 8 check failed: {e}")

        return issues
    
    def _check_pylint(self, file_path: str) -> List[Dict]:
        """Check code quality with pylint"""
        issues = []
        
        try:
            result = subprocess.run(
                ['pylint', '--output-format=json', '--disable=C0114,C0115,C0116', file_path],
                capture_output=True,
                text=True,
                timeout=15
            )
            
            if result.stdout:
                pylint_results = json.loads(result.stdout)
                
                for issue in pylint_results:
                    severity_map = {
                        'convention': 'low',
                        'refactor': 'medium',
                        'warning': 'high',
                        'error': 'high',
                        'fatal': 'critical'
                    }
                    
                    issues.append({
                        "type": "code_quality",
                        "category": "pylint",
                        "severity": severity_map.get(issue['type'], 'medium'),
                        "line": issue['line'],
                        "column": issue.get('column', 0),
                        "code": issue['message-id'],
                        "message": issue['message'],
                        "recommendation": issue.get('symbol', 'Fix code quality issue')
                    })
        except Exception as e:
            print(f"Pylint check failed: {e}")
        
        return issues
    
    def _check_naming_conventions(self, code: str) -> List[Dict]:
        """Check Python naming conventions"""
        issues = []
        lines = code.split('\n')
        
        import re
        
        for i, line in enumerate(lines, 1):
            # Check class names (should be CamelCase)
            class_match = re.search(r'class\s+([a-z][a-z0-9_]*)\s*[:\(]', line)
            if class_match:
                issues.append({
                    "type": "naming_convention",
                    "category": "class_name",
                    "severity": "low",
                    "line": i,
                    "column": 0,
                    "code": "NC001",
                    "message": f"Class name '{class_match.group(1)}' should use CamelCase",
                    "recommendation": "Use CamelCase for class names (e.g., MyClass)"
                })
            
            # Check function names (should be snake_case)
            func_match = re.search(r'def\s+([A-Z][a-zA-Z0-9]*)\s*\(', line)
            if func_match:
                issues.append({
                    "type": "naming_convention",
                    "category": "function_name",
                    "severity": "low",
                    "line": i,
                    "column": 0,
                    "code": "NC002",
                    "message": f"Function name '{func_match.group(1)}' should use snake_case",
                    "recommendation": "Use snake_case for function names (e.g., my_function)"
                })
            
            # Check constant names (should be UPPER_CASE)
            const_match = re.search(r'^([a-z][a-z0-9_]*)\s*=\s*["\']', line)
            if const_match and const_match.group(1).isupper() is False:
                # Check if it looks like a constant (all uppercase in typical usage)
                if len(const_match.group(1)) > 2:
                    issues.append({
                        "type": "naming_convention",
                        "category": "constant_name",
                        "severity": "info",
                        "line": i,
                        "column": 0,
                        "code": "NC003",
                        "message": f"Consider using UPPER_CASE for constants",
                        "recommendation": "Use UPPER_CASE for module-level constants"
                    })
        
        return issues
    
    def _check_complexity(self, code: str) -> List[Dict]:
        """Check code complexity"""
        issues = []
        lines = code.split('\n')
        
        # Simple complexity checks
        for i, line in enumerate(lines, 1):
            # Check for deeply nested code (more than 4 levels)
            indent_level = len(line) - len(line.lstrip())
            if indent_level > 16:  # 4 levels * 4 spaces
                issues.append({
                    "type": "complexity",
                    "category": "nesting",
                    "severity": "medium",
                    "line": i,
                    "column": 0,
                    "code": "CC001",
                    "message": "Code is deeply nested (>4 levels)",
                    "recommendation": "Refactor to reduce nesting depth"
                })
            
            # Check for long lines
            if len(line) > 120:
                issues.append({
                    "type": "complexity",
                    "category": "line_length",
                    "severity": "low",
                    "line": i,
                    "column": 120,
                    "code": "CC002",
                    "message": f"Line too long ({len(line)} > 120 characters)",
                    "recommendation": "Break long lines into multiple lines"
                })
        
        return issues
    
    def _categorize_issues(self, issues: List[Dict]) -> Dict[str, int]:
        """Count issues by category"""
        categories = {
            "pep8": 0,
            "pylint": 0,
            "naming": 0,
            "complexity": 0
        }
        
        for issue in issues:
            category = issue.get("category", "other")
            if category in ["pep8"]:
                categories["pep8"] += 1
            elif category in ["pylint", "code_quality"]:
                categories["pylint"] += 1
            elif category in ["class_name", "function_name", "constant_name"]:
                categories["naming"] += 1
            elif category in ["nesting", "line_length"]:
                categories["complexity"] += 1
        
        return categories

style_analyzer = StyleAnalyzer()