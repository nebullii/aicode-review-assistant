from typing import Dict, List
import re

class CodeParser:
    """
    Utility functions for parsing and analyzing code
    """
    
    @staticmethod
    def extract_code_metrics(code: str) -> Dict:
        """
        Extract basic metrics from code
        """
        lines = code.split('\n')
        
        return {
            "total_lines": len(lines),
            "non_empty_lines": len([line for line in lines if line.strip()]),
            "comment_lines": len([line for line in lines if line.strip().startswith(('//','#','/*','*'))]),
        }
    
    @staticmethod
    def detect_language(code: str, file_extension: str = None) -> str:
        """
        Detect programming language from code or file extension
        """
        if file_extension:
            extension_map = {
                '.js': 'javascript',
                '.jsx': 'javascript',
                '.ts': 'typescript',
                '.tsx': 'typescript',
                '.py': 'python',
                '.java': 'java',
                '.go': 'go',
                '.rb': 'ruby',
                '.php': 'php',
                '.cpp': 'cpp',
                '.c': 'c',
                '.cs': 'csharp',
            }
            return extension_map.get(file_extension.lower(), 'unknown')
        
        # Basic pattern matching
        if 'import ' in code or 'from ' in code and ':' in code:
            return 'python'
        elif 'function' in code or 'const' in code or 'let' in code:
            return 'javascript'
        elif 'public class' in code or 'public static void' in code:
            return 'java'
        
        return 'unknown'
    
    @staticmethod
    def find_sensitive_patterns(code: str) -> List[Dict]:
        """
        Find potentially sensitive information in code
        """
        patterns = {
            'api_key': r'["\']?api[_-]?key["\']?\s*[:=]\s*["\']([^"\']+)["\']',
            'password': r'["\']?password["\']?\s*[:=]\s*["\']([^"\']+)["\']',
            'secret': r'["\']?secret["\']?\s*[:=]\s*["\']([^"\']+)["\']',
            'token': r'["\']?token["\']?\s*[:=]\s*["\']([^"\']+)["\']',
        }
        
        findings = []
        for pattern_name, pattern in patterns.items():
            matches = re.finditer(pattern, code, re.IGNORECASE)
            for match in matches:
                findings.append({
                    'type': pattern_name,
                    'line_number': code[:match.start()].count('\n') + 1,
                    'matched_text': match.group(0)
                })
        
        return findings

code_parser = CodeParser()