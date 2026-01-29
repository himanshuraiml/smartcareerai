# Implementation Plan - Add Input Validation to Interview Service

## Goal
Prevent 500 Internal Server Errors by validating inputs (specifically UUIDs) at the controller level before they reach the service/database layer.

## Proposed Changes

### [Interview Service]

#### [MODIFY] [Interview Controller](file:///d:/Coding/SmartCareerAI/services/interview-service/src/controllers/interview.controller.ts)
- Add Zod schema for `id` parameters (UUID validation).
- Apply validation in `getSession` and other endpoints using `id` params.

## Verification Plan

### Manual Verification
- Since I cannot run the backend locally with full database connectivity easily without user setup, I will rely on code correctness and user deployment.
- User will deploy to Railway and verify if the error persists or changes to 400/404.
