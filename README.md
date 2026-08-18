# Email Scheduler Platform

A production-oriented **Email Scheduling & Delivery Platform** built with **React, Vite, Node.js, Express, BullMQ, Redis, Prisma, SQLite, and Nodemailer**.

The platform provides reliable email scheduling, asynchronous queue processing, rate limiting, concurrency control, automatic retries, restart recovery, queue reconciliation, and an operational dashboard.

---

## Overview

The Email Scheduler Platform allows users to schedule emails for future delivery through a modern web interface.

Instead of keeping an HTTP request open until the scheduled time, the system:

1. Stores the email in SQLite using Prisma.
2. Creates a delayed BullMQ job.
3. Stores the queue state in Redis.
4. Waits until the scheduled time.
5. Processes the job using a background worker.
6. Sends the email using Nodemailer and Ethereal Email.
7. Updates the email status.
8. Provides an Ethereal preview URL through the dashboard.

### Email Lifecycle

```text
SCHEDULED
    │
    ▼
PROCESSING
    │
    ├──────────────► SENT
    │
    └──────────────► FAILED

Emails can also be cancelled while they are still eligible for cancellation.


---

                         Architecture

                    ┌──────────────────────┐
                    │    React + Vite      │
                    │      Frontend        │
                    └──────────┬───────────┘
                               │
                               │ REST API
                               ▼
                    ┌──────────────────────┐
                    │   Node.js + Express  │
                    │       Backend        │
                    └──────────┬───────────┘
                               │
                  ┌────────────┴────────────┐
                  │                         │
                  ▼                         ▼
        ┌──────────────────┐      ┌──────────────────┐
        │  Prisma + SQLite │      │  BullMQ Queue    │
        │                  │      │                  │
        │  Email State     │      │  Delayed Jobs    │
        │  Status          │      │  Waiting Jobs    │
        │  Timestamps      │      │  Retries         │
        └──────────────────┘      └────────┬─────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │      Redis       │
                                  │                  │
                                  │ Queue Storage    │
                                  │ Delayed Jobs     │
                                  │ Rate Limiting    │
                                  └────────┬─────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │   Email Worker   │
                                  │                  │
                                  │ Concurrency: 5   │
                                  │ Rate: 5/sec      │
                                  │ Retry + Backoff  │
                                  └────────┬─────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │    Nodemailer    │
                                  │                  │
                                  │ Ethereal Email   │
                                  └────────┬─────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │  Preview URL     │
                                  │  Email Preview   │
                                  └──────────────────┘


---

Technology Stack

Layer	Technology

Frontend	React
Build Tool	Vite
Backend	Node.js
API Framework	Express
Database	SQLite
ORM	Prisma
Job Queue	BullMQ
Queue Storage	Redis
Email Library	Nodemailer
Email Testing	Ethereal Email
API	REST
UI	Dark Glassmorphic Interface



---

Project Structure

EMAIL-SCHEDULER/
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   │
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js
│   │   │   ├── mailer.js
│   │   │   └── redis.js
│   │   │
│   │   ├── controllers/
│   │   │   └── emailController.js
│   │   │
│   │   ├── queue/
│   │   │   ├── emailQueue.js
│   │   │   ├── emailWorker.js
│   │   │   └── queueReconciler.js
│   │   │
│   │   ├── routes/
│   │   │   ├── emailRoutes.js
│   │   │   └── healthRoutes.js
│   │   │
│   │   ├── services/
│   │   │   └── emailService.js
│   │   │
│   │   └── server.js
│   │
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js
│   │   ├── assets/
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── README.md


---

How It Works

The platform separates application state from background job processing.

Application State

Managed by:

Prisma + SQLite

Stores information such as:

Recipient

Subject

Content

Scheduled time

Email status

Preview URL

Timestamps


Background Processing

Managed by:

BullMQ + Redis

Handles:

Delayed jobs

Waiting jobs

Active jobs

Retries

Rate limiting

Queue processing


Email Delivery

Handled by:

Nodemailer + Ethereal Email


---

Email Scheduling Workflow

When a user schedules an email:

1. Create Email

The frontend sends the email details to the backend.

2. Store Email

The backend creates an Email record in SQLite.

Initial status:

SCHEDULED

3. Create Delayed Job

The backend calculates:

delay = scheduledTimestamp - currentTimestamp

and creates a delayed BullMQ job.

4. Store Job in Redis

Redis stores the delayed job until its execution time.

5. Worker Receives Job

When the delay expires, BullMQ makes the job available to the worker.

The status changes:

SCHEDULED
    ↓
PROCESSING

6. Send Email

The worker uses Nodemailer to send the email through Ethereal.

7. Complete Processing

After successful delivery:

PROCESSING
    ↓
SENT

The Ethereal preview URL is stored and displayed in the dashboard.


---

Reliability and Restart Recovery

The system is designed to continue operating after backend restarts.

Redis Persistence

BullMQ stores delayed and waiting jobs in Redis.

Restarting the Node.js application does not automatically remove these jobs.

When the worker reconnects to Redis, it can continue processing available jobs.


---

Queue Reconciliation

The backend includes a startup reconciliation process.

The reconciler checks database records with states such as:

SCHEDULED
PROCESSING

and verifies whether the corresponding BullMQ job exists.

If a required job is missing, the reconciler re-enqueues it with the correct delay.

Backend Starts
      │
      ▼
Queue Reconciler
      │
      ▼
Check Database
      │
      ▼
Find SCHEDULED / PROCESSING Emails
      │
      ▼
Check Redis / BullMQ
      │
      ├───────────────┐
      │               │
      ▼               ▼
 Job Exists       Job Missing
      │               │
      ▼               ▼
 Continue          Re-enqueue
 Processing           Job
                      │
                      ▼
                 Resume Processing

This provides an additional recovery layer for situations such as:

Backend crashes

Worker interruption

Missing Redis jobs

Queue/database inconsistency



---

Concurrency Control

The worker is configured with:

Concurrency: 5

This means up to five jobs can be processed concurrently by the worker.

BullMQ Queue
     │
     ├── Email 1 ──┐
     ├── Email 2 ──┤
     ├── Email 3 ──┤
     ├── Email 4 ──┤──► Worker
     └── Email 5 ──┘

Additional jobs remain in the queue until worker capacity becomes available.


---

Rate Limiting

The worker uses BullMQ rate limiting.

Current configuration:

Maximum: 5 jobs
Duration: 1 second

Configured throughput:

5 jobs / second

This prevents uncontrolled bursts and demonstrates controlled processing under load.


---

Retry and Backoff

Transient delivery failures are automatically retried.

The retry strategy uses exponential backoff.

Attempt 1
    │
    └── Failure
          │
          ▼
        Wait 2s
          │
          ▼
Attempt 2
    │
    └── Failure
          │
          ▼
        Wait 4s
          │
          ▼
Attempt 3
    │
    └── Failure
          │
          ▼
        Wait 8s

This helps handle temporary:

Network failures

SMTP failures

Connection failures

Service interruptions



---

Features

Backend

Reliable email scheduling

BullMQ delayed jobs

Redis-backed queue

Prisma ORM

SQLite database

Startup queue reconciliation

Worker concurrency control

Queue rate limiting

Automatic retries

Exponential backoff

Ethereal Email auto-provisioning

RESTful APIs

Email cancellation

Batch email generation

Dashboard metrics

Health check

Email status tracking


Frontend

Modern dark glassmorphic UI

Email scheduling interface

Quick scheduling presets

Live dashboard

Scheduled emails tab

Processing emails tab

Sent emails tab

Cancelled emails tab

Failed emails tab

Ethereal preview links

Automatic dashboard polling

Load Test (10x)



---

Dashboard

The dashboard provides visibility into the email processing pipeline.

Supported statuses:

SCHEDULED
PROCESSING
SENT
CANCELLED
FAILED

The dashboard allows users to observe the complete email lifecycle.

SCHEDULED
    ↓
BullMQ Queue
    ↓
PROCESSING
    ↓
SENT

The frontend periodically polls the backend to keep the dashboard updated.


---

Batch Load Testing

The application includes a:

Load Test (10x)

button.

This instantly creates ten emails for processing.

The feature demonstrates:

Queue creation

Worker concurrency

Rate limiting

Processing throughput

Status transitions

Dashboard monitoring


Example:

10 Emails
    │
    ▼
BullMQ Queue
    │
    ▼
Worker
Concurrency = 5
    │
    ▼
Rate Limiter
5 jobs / second
    │
    ▼
Processed Emails


---

Prerequisites

Install the following:

Node.js 18+

npm

Redis

Git


Check Node.js:

node --version

Check npm:

npm --version

Redis should be available at:

localhost:6379


---

Installation

Clone the repository:

git clone <YOUR_REPOSITORY_URL>

Enter the project:

cd EMAIL-SCHEDULER


---

Backend Setup

Navigate to the backend:

cd backend

Install dependencies:

npm install

Initialize the Prisma database:

npx prisma db push


---

Environment Configuration

Create:

backend/.env

Optional Ethereal configuration:

ETHEREAL_USER=your_user@ethereal.email
ETHEREAL_PASS=your_password

If these credentials are left blank, the backend can automatically create a temporary Ethereal test account during startup.


---

Redis Setup

Local Redis

Start Redis:

redis-server

Test Redis:

redis-cli ping

Expected output:

PONG

Docker Redis

Alternatively:

docker run -d --name email-scheduler-redis -p 6379:6379 redis:latest

Test:

docker exec -it email-scheduler-redis redis-cli ping

Expected:

PONG


---

Start Backend

From the backend directory:

npm run dev

Backend URL:

http://localhost:3000


---

Frontend Setup

Open a new terminal:

cd frontend

Install dependencies:

npm install

Start the frontend:

npm run dev

Frontend URL:

http://localhost:5173


---

Running the Complete Application

Use three terminals.

Terminal 1 — Redis

redis-server

Terminal 2 — Backend

cd backend
npm install
npx prisma db push
npm run dev

Terminal 3 — Frontend

cd frontend
npm install
npm run dev

Open the application:

http://localhost:5173


---

Demo Scenarios

1. Schedule an Email

1. Open the frontend.


2. Click Schedule Email.


3. Enter the recipient.


4. Enter the subject.


5. Enter the email content.


6. Select a scheduling preset.


7. Submit the email.


8. Observe the SCHEDULED status.


9. Wait until the scheduled time.


10. Observe PROCESSING.


11. Confirm SENT.


12. Click View Ethereal.



Expected:

SCHEDULED → PROCESSING → SENT


---

2. Test Restart Resilience

Schedule an email approximately two minutes into the future.

Stop the backend:

Ctrl + C

Keep Redis running.

Restart the backend:

npm run dev

The queue reconciler checks scheduled and processing emails against Redis.

If a required queue job is missing, it is re-enqueued.

Expected flow:

Database
    │
    ▼
SCHEDULED Email
    │
    ▼
Queue Reconciler
    │
    ▼
BullMQ Job
    │
    ▼
Worker
    │
    ▼
SENT


---

3. Rate Limiting and Concurrency Test

1. Open the dashboard.


2. Click Load Test (10x).


3. Ten emails are generated.


4. Observe the BullMQ queue.


5. Watch the worker process the jobs.


6. Observe the controlled processing rate.


7. Monitor status transitions.



Configuration:

Worker Concurrency = 5
Rate Limit = 5 jobs / second


---

API Capabilities

The backend provides REST APIs for:

Schedule Email
Cancel Email
Generate Batch Emails
Fetch Email Records
Fetch Dashboard Metrics
Health Check

The backend follows a layered architecture:

HTTP Request
     │
     ▼
Routes
     │
     ▼
Controllers
     │
     ▼
Services
     │
     ├──────────────┐
     ▼              ▼
Database          Queue
Prisma            BullMQ
                    │
                    ▼
                  Redis


---

Database and Queue Responsibilities

SQLite + Prisma

Responsible for persistent application state.

Stores information such as:

Email
Recipient
Subject
Content
Scheduled Timestamp
Status
Preview URL
Timestamps

Redis + BullMQ

Responsible for asynchronous job processing.

Handles:

Delayed Jobs
Waiting Jobs
Active Jobs
Retries
Queue Processing
Rate Limiting

This separation allows SQLite to maintain application state while Redis manages background execution.


---

Failure Handling

Backend Crash

Backend Crash
     │
     ▼
Redis Retains Queue State
     │
     ▼
Backend Restart
     │
     ▼
Worker Reconnects
     │
     ▼
Processing Continues

Missing Queue Job

Database
    │
    ▼
SCHEDULED
    │
    ▼
Queue Job Missing
    │
    ▼
Reconciler
    │
    ▼
Job Recreated

Temporary Email Failure

Send Email
     │
     ▼
Failure
     │
     ▼
Retry
     │
     ▼
Backoff
     │
     ▼
Retry Again
     │
     ▼
Success / Final Failure


---

Design Decisions and Trade-offs

SQLite

SQLite was selected for frictionless local setup.

Advantages

No external database server required

Minimal configuration

Easy evaluation

Fast local development

Prisma abstraction


For a production deployment, PostgreSQL would be a better choice for larger concurrent workloads.


---

Ethereal Email

Ethereal Email is used instead of a production SMTP provider.

Advantages

No real emails are accidentally delivered.

No Gmail App Password is required.

No production SMTP credentials are required.

Evaluators can inspect email previews.

Preview URLs can be opened directly from the dashboard.



---

Polling

The frontend uses periodic polling for dashboard updates.

This keeps the architecture simple and avoids additional real-time infrastructure.

For production, polling could be replaced with:

WebSockets

or:

Server-Sent Events


---

Authentication

Authentication is intentionally outside the current implementation scope.

A future implementation could associate each email with:

userId

and introduce:

JWT authentication

OAuth

Role-Based Access Control

Multi-tenant isolation



---

Production Roadmap

Infrastructure

PostgreSQL

Redis Cluster

Docker

Kubernetes

Horizontal worker scaling

Load balancing

Cloud deployment


Security

JWT/OAuth authentication

Role-Based Access Control

API rate limiting

Input validation

Secrets management

Audit logging

Encryption


Email Infrastructure

Production integrations could include:

Amazon SES

SendGrid

Mailgun

Dedicated SMTP infrastructure


Observability

Potential additions:

Structured logging

Metrics

Distributed tracing

Error tracking

Queue monitoring

Alerting

Health monitoring



---

Future Improvements

User authentication

Multi-tenant support

PostgreSQL migration

Redis high availability

Multiple worker instances

Recurring email schedules

Timezone-aware scheduling

Email templates

File attachments

Email delivery analytics

Dead-letter queues

Advanced retry policies

WebSocket-based dashboard

Audit logs

Role-based administration

Production SMTP integration



---

Performance Configuration

Current configuration:

Worker Concurrency : 5
Rate Limit         : 5 jobs / second
Retry Attempts     : 3
Backoff             : Exponential
Queue               : BullMQ
Queue Storage       : Redis
Database            : SQLite
ORM                 : Prisma

These values can be adjusted based on infrastructure capacity and SMTP provider limits.


---

Complete System Flow

USER
                           │
                           ▼
                  ┌─────────────────┐
                  │ React Frontend  │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  Express REST   │
                  │       API       │
                  └────────┬────────┘
                           │
               ┌───────────┴───────────┐
               │                       │
               ▼                       ▼
        ┌──────────────┐        ┌──────────────┐
        │ Prisma/SQLite│        │    BullMQ    │
        │              │        │    Queue     │
        │ Email State  │        └──────┬───────┘
        └──────────────┘               │
                                       ▼
                                ┌──────────────┐
                                │    Redis     │
                                └──────┬───────┘
                                       │
                                       ▼
                                ┌──────────────┐
                                │ Email Worker │
                                │              │
                                │ Concurrency 5│
                                │ Rate 5/sec   │
                                └──────┬───────┘
                                       │
                                       ▼
                                ┌──────────────┐
                                │  Nodemailer  │
                                └──────┬───────┘
                                       │
                                       ▼
                                ┌──────────────┐
                                │   Ethereal   │
                                │    Email     │
                                └──────┬───────┘
                                       │
                                       ▼
                                ┌──────────────┐
                                │ Preview URL  │
                                └──────────────┘


---

Project Highlights

Asynchronous Processing

Email delivery is handled by background workers instead of blocking HTTP requests.

Delayed Scheduling

BullMQ delayed jobs allow emails to be scheduled for future execution.

Queue-Based Architecture

Redis and BullMQ provide a dedicated asynchronous processing layer.

Concurrency Control

Workers can process multiple jobs concurrently within a configured limit.

Rate Limiting

Queue throughput is controlled to prevent uncontrolled bursts.

Retry Mechanism

Failed jobs can automatically retry using exponential backoff.

Failure Recovery

The reconciliation mechanism detects missing queue jobs and restores them.

Operational Dashboard

The React frontend provides visibility into email processing states.

Load Testing

The built-in 10x load test demonstrates queue behavior, concurrency, and rate limiting.


---

Quick Start

# Clone repository
git clone <YOUR_REPOSITORY_URL>

# Enter project
cd EMAIL-SCHEDULER

# Start Redis
redis-server

In a second terminal:

cd backend
npm install
npx prisma db push
npm run dev

In a third
