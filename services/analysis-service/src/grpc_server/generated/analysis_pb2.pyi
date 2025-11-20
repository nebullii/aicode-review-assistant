from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Iterable as _Iterable, Mapping as _Mapping, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class AnalyzeRequest(_message.Message):
    __slots__ = ("code", "language", "file_path", "pr_number", "repository", "include_style_analysis")
    CODE_FIELD_NUMBER: _ClassVar[int]
    LANGUAGE_FIELD_NUMBER: _ClassVar[int]
    FILE_PATH_FIELD_NUMBER: _ClassVar[int]
    PR_NUMBER_FIELD_NUMBER: _ClassVar[int]
    REPOSITORY_FIELD_NUMBER: _ClassVar[int]
    INCLUDE_STYLE_ANALYSIS_FIELD_NUMBER: _ClassVar[int]
    code: str
    language: str
    file_path: str
    pr_number: int
    repository: str
    include_style_analysis: bool
    def __init__(self, code: _Optional[str] = ..., language: _Optional[str] = ..., file_path: _Optional[str] = ..., pr_number: _Optional[int] = ..., repository: _Optional[str] = ..., include_style_analysis: bool = ...) -> None: ...

class AnalysisResponse(_message.Message):
    __slots__ = ("analysis_id", "timestamp", "total_vulnerabilities", "critical_count", "high_count", "medium_count", "low_count", "vulnerabilities", "style_issues", "total_style_issues", "style_categories", "status", "language")
    class StyleCategoriesEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: int
        def __init__(self, key: _Optional[str] = ..., value: _Optional[int] = ...) -> None: ...
    ANALYSIS_ID_FIELD_NUMBER: _ClassVar[int]
    TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    TOTAL_VULNERABILITIES_FIELD_NUMBER: _ClassVar[int]
    CRITICAL_COUNT_FIELD_NUMBER: _ClassVar[int]
    HIGH_COUNT_FIELD_NUMBER: _ClassVar[int]
    MEDIUM_COUNT_FIELD_NUMBER: _ClassVar[int]
    LOW_COUNT_FIELD_NUMBER: _ClassVar[int]
    VULNERABILITIES_FIELD_NUMBER: _ClassVar[int]
    STYLE_ISSUES_FIELD_NUMBER: _ClassVar[int]
    TOTAL_STYLE_ISSUES_FIELD_NUMBER: _ClassVar[int]
    STYLE_CATEGORIES_FIELD_NUMBER: _ClassVar[int]
    STATUS_FIELD_NUMBER: _ClassVar[int]
    LANGUAGE_FIELD_NUMBER: _ClassVar[int]
    analysis_id: str
    timestamp: int
    total_vulnerabilities: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    vulnerabilities: _containers.RepeatedCompositeFieldContainer[Vulnerability]
    style_issues: _containers.RepeatedCompositeFieldContainer[StyleIssue]
    total_style_issues: int
    style_categories: _containers.ScalarMap[str, int]
    status: str
    language: str
    def __init__(self, analysis_id: _Optional[str] = ..., timestamp: _Optional[int] = ..., total_vulnerabilities: _Optional[int] = ..., critical_count: _Optional[int] = ..., high_count: _Optional[int] = ..., medium_count: _Optional[int] = ..., low_count: _Optional[int] = ..., vulnerabilities: _Optional[_Iterable[_Union[Vulnerability, _Mapping]]] = ..., style_issues: _Optional[_Iterable[_Union[StyleIssue, _Mapping]]] = ..., total_style_issues: _Optional[int] = ..., style_categories: _Optional[_Mapping[str, int]] = ..., status: _Optional[str] = ..., language: _Optional[str] = ...) -> None: ...

class Vulnerability(_message.Message):
    __slots__ = ("type", "severity", "line_number", "code_snippet", "description", "recommendation", "confidence")
    TYPE_FIELD_NUMBER: _ClassVar[int]
    SEVERITY_FIELD_NUMBER: _ClassVar[int]
    LINE_NUMBER_FIELD_NUMBER: _ClassVar[int]
    CODE_SNIPPET_FIELD_NUMBER: _ClassVar[int]
    DESCRIPTION_FIELD_NUMBER: _ClassVar[int]
    RECOMMENDATION_FIELD_NUMBER: _ClassVar[int]
    CONFIDENCE_FIELD_NUMBER: _ClassVar[int]
    type: str
    severity: str
    line_number: int
    code_snippet: str
    description: str
    recommendation: str
    confidence: float
    def __init__(self, type: _Optional[str] = ..., severity: _Optional[str] = ..., line_number: _Optional[int] = ..., code_snippet: _Optional[str] = ..., description: _Optional[str] = ..., recommendation: _Optional[str] = ..., confidence: _Optional[float] = ...) -> None: ...

class StyleIssue(_message.Message):
    __slots__ = ("type", "category", "severity", "line", "column", "code", "message", "recommendation")
    TYPE_FIELD_NUMBER: _ClassVar[int]
    CATEGORY_FIELD_NUMBER: _ClassVar[int]
    SEVERITY_FIELD_NUMBER: _ClassVar[int]
    LINE_FIELD_NUMBER: _ClassVar[int]
    COLUMN_FIELD_NUMBER: _ClassVar[int]
    CODE_FIELD_NUMBER: _ClassVar[int]
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    RECOMMENDATION_FIELD_NUMBER: _ClassVar[int]
    type: str
    category: str
    severity: str
    line: int
    column: int
    code: str
    message: str
    recommendation: str
    def __init__(self, type: _Optional[str] = ..., category: _Optional[str] = ..., severity: _Optional[str] = ..., line: _Optional[int] = ..., column: _Optional[int] = ..., code: _Optional[str] = ..., message: _Optional[str] = ..., recommendation: _Optional[str] = ...) -> None: ...

class GetPRAnalysisRequest(_message.Message):
    __slots__ = ("pr_number", "repository")
    PR_NUMBER_FIELD_NUMBER: _ClassVar[int]
    REPOSITORY_FIELD_NUMBER: _ClassVar[int]
    pr_number: int
    repository: str
    def __init__(self, pr_number: _Optional[int] = ..., repository: _Optional[str] = ...) -> None: ...

class PRAnalysisResponse(_message.Message):
    __slots__ = ("analyses", "total")
    ANALYSES_FIELD_NUMBER: _ClassVar[int]
    TOTAL_FIELD_NUMBER: _ClassVar[int]
    analyses: _containers.RepeatedCompositeFieldContainer[AnalysisResponse]
    total: int
    def __init__(self, analyses: _Optional[_Iterable[_Union[AnalysisResponse, _Mapping]]] = ..., total: _Optional[int] = ...) -> None: ...

class GetHistoryRequest(_message.Message):
    __slots__ = ("limit",)
    LIMIT_FIELD_NUMBER: _ClassVar[int]
    limit: int
    def __init__(self, limit: _Optional[int] = ...) -> None: ...

class HistoryResponse(_message.Message):
    __slots__ = ("analyses", "total")
    ANALYSES_FIELD_NUMBER: _ClassVar[int]
    TOTAL_FIELD_NUMBER: _ClassVar[int]
    analyses: _containers.RepeatedCompositeFieldContainer[AnalysisResponse]
    total: int
    def __init__(self, analyses: _Optional[_Iterable[_Union[AnalysisResponse, _Mapping]]] = ..., total: _Optional[int] = ...) -> None: ...

class HealthRequest(_message.Message):
    __slots__ = ()
    def __init__(self) -> None: ...

class HealthResponse(_message.Message):
    __slots__ = ("status", "version", "timestamp")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    status: str
    version: str
    timestamp: int
    def __init__(self, status: _Optional[str] = ..., version: _Optional[str] = ..., timestamp: _Optional[int] = ...) -> None: ...
