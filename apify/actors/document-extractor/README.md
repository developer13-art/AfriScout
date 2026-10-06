# AfriScout Document Extractor Actor

Fetches a public opportunity document (PDF, DOCX, HTML) and returns
structured fields: eligibility, requirements, documents, value, and deadline.

Parsing is deterministic for HTML and DOCX. For PDFs the actor extracts raw
text and returns it; downstream AI handles semantic extraction.