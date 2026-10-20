# Final Review Traceability

This repository did not contain UML or tracking-sheet source files when the final review was received. This document records the implementation-aligned structure and avoids claiming changes to absent external files.

| Review item | Implemented system location | Status |
|---|---|---|
| PDF drag/drop | `/chatbot`; PDF-only, 10 MB limit, filename/size shown | Implemented |
| Question flow | Student explicitly enters a question; selecting a PDF never creates one | Implemented |
| Forgot/reset password | `/forget-password` → `/verify` → `/reset-password` → `/login` | Implemented |
| Notifications | Independent `/notifications` page, linked from dashboard navigation | Implemented |
| My Progress | Independent `/my-progress` page, linked from dashboard navigation | Implemented |
| Search | Kept as a dashboard search control; `/search` retained only as a compatibility route | Restructured |
| Student details | Name, email, student ID, phone, program, academic year, department | Implemented in data model/admin editing |
| Student Management | Admin can list and update student details | Implemented |
| Admin Update Profile | No such feature is exposed | Confirmed absent |
| Generate Report | Live total, verified/unverified counts, and students by program | Implemented |
| UML consistency | Use case, activity, and sequence definitions below use the same names/routes | Implemented in `docs/uml` |

The current chatbot UI validates and stages a PDF plus a manually entered question. No PDF extraction or AI provider existed in the repository, so document parsing or an AI answer was not invented without a specified provider/API.
