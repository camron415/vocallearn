-- VocalLearn: Career Prep — Interview Fundamentals
-- Run in Supabase SQL Editor (Dashboard → SQL → New query → paste → Run)
--
-- Adds:
--   Subject: Career Prep: Interview Fundamentals
--   Lesson 1: Frontend & React Fundamentals (10 facts)
--   Lesson 2: APIs, Data & Version Control (10 facts)
--
-- Safe to re-run: deletes existing rows for these fixed UUIDs first.
-- After running: force-quit VocalLearn on your phone and reopen (or pull to refresh Subjects).
--
-- Note: this seed omits unlock_threshold (added in migrations/006_curriculum_modules.sql).
-- Both lessons are unlocked in the app via the Career Prep subject bypass — no rebuild needed.

-- ============================================
-- Cleanup (idempotent re-run)
-- ============================================
DELETE FROM facts WHERE lesson_id IN (
  'b1c2d3e4-f5a6-4789-bcde-f01234567801',
  'c2d3e4f5-a6b7-4890-cdef-012345678902'
);
DELETE FROM lessons WHERE id IN (
  'b1c2d3e4-f5a6-4789-bcde-f01234567801',
  'c2d3e4f5-a6b7-4890-cdef-012345678902'
);
DELETE FROM subjects WHERE id = 'a9b8c7d6-e5f4-4321-abcd-ef9876543210';

-- ============================================
-- Subject
-- ============================================
INSERT INTO subjects (id, name, description, icon, is_community)
VALUES (
  'a9b8c7d6-e5f4-4321-abcd-ef9876543210',
  'Career Prep: Interview Fundamentals',
  'Concrete, analogy-rich fundamentals for junior frontend interviews — React, the web stack, APIs, data, and Git — so you can explain concepts in your own words, not just prompt AI.',
  '🎯',
  false
);

-- ============================================
-- Lesson 1: Frontend & React Fundamentals
-- ============================================
INSERT INTO lessons (id, subject_id, title, description, order_index)
VALUES (
  'b1c2d3e4-f5a6-4789-bcde-f01234567801',
  'a9b8c7d6-e5f4-4321-abcd-ef9876543210',
  'Frontend & React Fundamentals',
  'HTML through the DOM — the building blocks of the web and React, explained in everyday language for interview recall.',
  1
);

INSERT INTO facts (lesson_id, content, explanation, strictness, order_index, tags) VALUES
(
  'b1c2d3e4-f5a6-4789-bcde-f01234567801',
  'HTML is the markup language that defines a web page''s structure and content, like headings, buttons, and forms.',
  'Think of HTML as the skeleton of a house — it marks where the walls, doors, and windows go, but it does not paint them or make the lights work.',
  'medium',
  1,
  ARRAY['HTML', 'markup', 'page structure']
),
(
  'b1c2d3e4-f5a6-4789-bcde-f01234567801',
  'CSS styles HTML with color, layout, spacing, and fonts, and SCSS adds variables and nesting on top of plain CSS.',
  'If HTML is the skeleton, CSS is the paint, furniture, and floor plan. SCSS is like labeled storage bins in a garage — same house, but easier to organize repeated styles.',
  'medium',
  2,
  ARRAY['CSS', 'SCSS', 'styling', 'layout']
),
(
  'b1c2d3e4-f5a6-4789-bcde-f01234567801',
  'Bootstrap is a CSS framework of ready-made responsive components like buttons, grids, and navbars so you don''t style everything from scratch.',
  'It is like buying pre-built kitchen modules instead of carving every cabinet yourself — you still assemble and customize, but the baseline layout is already done.',
  'medium',
  3,
  ARRAY['Bootstrap', 'CSS framework', 'responsive components']
),
(
  'b1c2d3e4-f5a6-4789-bcde-f01234567801',
  'JavaScript is the language that makes web pages interactive by responding to clicks, updating content, and calling servers.',
  'HTML sets the structure, CSS sets the look, and JavaScript is the electricity — lights turn on, buttons respond, and the page can call outside for fresh data.',
  'medium',
  4,
  ARRAY['JavaScript', 'interactivity', 'client-side']
),
(
  'b1c2d3e4-f5a6-4789-bcde-f01234567801',
  'React is a JavaScript library for building user interfaces out of reusable pieces called components.',
  'Instead of one giant page script, React is like LEGO for UI — you build small blocks once and snap them together into screens that stay maintainable as the app grows.',
  'medium',
  5,
  ARRAY['React', 'UI library', 'components']
),
(
  'b1c2d3e4-f5a6-4789-bcde-f01234567801',
  'A component is a self-contained, reusable piece of UI, like a button or form, that you combine to build a page.',
  'Think of a component like a prefab room module — a navbar room, a login room — each has a clear job and you wire them together on the page.',
  'medium',
  6,
  ARRAY['component', 'reusable UI', 'composition']
),
(
  'b1c2d3e4-f5a6-4789-bcde-f01234567801',
  'Props are the inputs passed into a component to configure it, like arguments to a function, and they are read-only from the child.',
  'Props are like order tickets passed to a kitchen station — the parent says make this size, this label, this color, and the child renders it without rewriting the ticket.',
  'medium',
  7,
  ARRAY['props', 'component inputs', 'read-only']
),
(
  'b1c2d3e4-f5a6-4789-bcde-f01234567801',
  'State is data a component owns and can change over time, and when state changes React re-renders that part of the screen.',
  'State is like the score on a sports bar TV — when the number changes, only the board updates, not the entire building.',
  'medium',
  8,
  ARRAY['state', 're-render', 'local data']
),
(
  'b1c2d3e4-f5a6-4789-bcde-f01234567801',
  'JSX is the HTML-like syntax used inside React to describe what the UI should look like.',
  'JSX looks like HTML, but it is JavaScript''s way of writing a blueprint sentence: render a header, then a button, then pass this label. It keeps UI structure next to the logic that owns it.',
  'medium',
  9,
  ARRAY['JSX', 'React syntax', 'UI description']
),
(
  'b1c2d3e4-f5a6-4789-bcde-f01234567801',
  'The DOM is the browser''s live tree-shaped model of the page that JavaScript reads and updates to change what the user sees.',
  'Picture a family tree of every tag on the page — the browser keeps that tree in memory, and JavaScript can add branches or change labels without reloading the whole site.',
  'medium',
  10,
  ARRAY['DOM', 'document object model', 'browser tree']
);

-- ============================================
-- Lesson 2: APIs, Data & Version Control
-- ============================================
INSERT INTO lessons (id, subject_id, title, description, order_index)
VALUES (
  'c2d3e4f5-a6b7-4890-cdef-012345678902',
  'a9b8c7d6-e5f4-4321-abcd-ef9876543210',
  'APIs, Data & Version Control',
  'REST, HTTP, JSON, MySQL, PHP/Laravel, and Git — the backend and collaboration vocabulary for the role you''re targeting.',
  2
);

INSERT INTO facts (lesson_id, content, explanation, strictness, order_index, tags) VALUES
(
  'c2d3e4f5-a6b7-4890-cdef-012345678902',
  'An API is a defined way for two programs to talk to each other, with a contract for requesting and exchanging data.',
  'An API is like a restaurant menu with rules — you know what you can order, what you will get back, and what happens if the kitchen cannot make it.',
  'medium',
  1,
  ARRAY['API', 'contract', 'program communication']
),
(
  'c2d3e4f5-a6b7-4890-cdef-012345678902',
  'A REST API is a common web style where you act on resources like users or jobs over HTTP using standard actions.',
  'REST treats data like labeled folders in a filing cabinet — users, jobs, applications — and you use the same handful of verbs to open, add, update, or remove what is inside.',
  'medium',
  2,
  ARRAY['REST API', 'resources', 'HTTP']
),
(
  'c2d3e4f5-a6b7-4890-cdef-012345678902',
  'HTTP methods are the verbs of web requests: GET reads, POST creates, PUT or PATCH updates, and DELETE removes.',
  'Think of a shared shopping list on the fridge — GET reads it, POST adds a new item, PATCH edits a line, and DELETE wipes one off.',
  'high',
  3,
  ARRAY['HTTP methods', 'GET POST PUT PATCH DELETE', 'REST verbs']
),
(
  'c2d3e4f5-a6b7-4890-cdef-012345678902',
  'An endpoint is a specific API URL for a resource or action, like /users/123.',
  'If the API is the restaurant, the endpoint is the exact window you walk up to — pick up user 123 here — not the whole building.',
  'medium',
  4,
  ARRAY['endpoint', 'API URL', 'resource path']
),
(
  'c2d3e4f5-a6b7-4890-cdef-012345678902',
  'JSON is the lightweight text format most APIs use to send structured data as key-value pairs.',
  'JSON looks like a labeled packing list — name Camron, role junior dev — easy for humans to skim and easy for programs to parse.',
  'medium',
  5,
  ARRAY['JSON', 'key-value', 'data format']
),
(
  'c2d3e4f5-a6b7-4890-cdef-012345678902',
  'A database like MySQL is an organized data store that keeps information in relational tables of rows and columns.',
  'MySQL is like a spreadsheet warehouse with many linked tabs — users in one table, jobs in another — with rules so related rows stay consistent.',
  'medium',
  6,
  ARRAY['MySQL', 'database', 'relational tables']
),
(
  'c2d3e4f5-a6b7-4890-cdef-012345678902',
  'PHP is a server-side language used to build web-app backends, including the PHP apps this role maintains.',
  'PHP runs in the kitchen, not at the customer''s table — the browser asks for a page, PHP prepares data on the server, then serves the finished plate.',
  'medium',
  7,
  ARRAY['PHP', 'server-side', 'backend']
),
(
  'c2d3e4f5-a6b7-4890-cdef-012345678902',
  'Laravel is a popular PHP framework that gives structure for routing, databases, authentication, and more when building web apps.',
  'Raw PHP is like cooking in an empty rental kitchen; Laravel is a stocked commercial kitchen with labeled stations for routes, models, and auth already laid out.',
  'medium',
  8,
  ARRAY['Laravel', 'PHP framework', 'routing']
),
(
  'c2d3e4f5-a6b7-4890-cdef-012345678902',
  'Git is a version-control tool that tracks changes to code over time so you can review history and collaborate safely.',
  'Git is a time machine plus lab notebook for your codebase — every save is timestamped, labeled, and reversible if an experiment goes wrong.',
  'medium',
  9,
  ARRAY['Git', 'version control', 'collaboration']
),
(
  'c2d3e4f5-a6b7-4890-cdef-012345678902',
  'In Git, a commit is a saved snapshot of changes, a branch is a separate line of work, and a pull request proposes merging a branch after review.',
  'A commit is a saved chapter, a branch is a draft notebook where you will not mess up the main story, and a pull request is asking teammates to proofread before that draft joins the official book.',
  'medium',
  10,
  ARRAY['commit', 'branch', 'pull request', 'Git workflow']
);
