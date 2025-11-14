# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ya-syn is a TypeScript synchronization library providing promise-based concurrency control primitives including locks, semaphores, caching, and task execution. The library supports both Node.js (with reentrant synchronization) and browser environments.

## Development Commands

### Build
```bash
npm run build
```
Uses tsup to build the library, generating both CJS (`dist/index.js`) and ESM (`dist/index.mjs`) outputs with TypeScript declarations.

### Test
```bash
npm test              # Run all tests
jest path/to/test     # Run specific test file
```
Uses Jest with ts-jest preset. Test files are located in the `test/` directory.

### Clean
```bash
npm run clean
```
Removes the `dist/` directory.

## Architecture

### Core Synchronization Primitives

The library is built on a layered architecture:

1. **CoreSemaphore** (`src/CoreSemaphore.ts`) - The foundational synchronization primitive
   - Simple semaphore with configurable concurrency
   - Manages task queue and execution
   - Provides `waitComplete()` and `waitCompleteAll()` for coordination
   - No callbacks or reentrant checking (performance-optimized)

2. **Semaphore** (`src/Semaphore.ts`) - Enhanced semaphore built on CoreSemaphore
   - Adds reentrant execution detection using `ReentrantDetector`
   - Supports throttling via the `throttle` parameter
   - Implements event callbacks for state transitions (Acquire, Acquired, Release, Timeout)
   - Used by higher-level synchronization components

3. **Synchronizer** (`src/Synchronizer.ts`) - High-level synchronization interface
   - Wraps Semaphore with rich context and stats tracking
   - Provides timeout support via `timeout()` method
   - Provides throttle support via `throttle()` method
   - Each synchronized execution gets a unique executionId (UUID)
   - Emits events through the `onEvent` callback with context and stats

### Provider Pattern

**SynchronizerProvider** (`src/SynchronizerProvider.ts`) is the recommended entry point:
- `forKey(key: string)` - Returns synchronizer for a string key (uses WeakRef)
- `forObject(obj: object)` - Returns synchronizer for an object instance (uses WeakCacheProvider)
- `createSynchronizer()` - Creates a new standalone synchronizer
- `createCachedProvider()` - Creates a cache with built-in synchronization
- `executeTasks()` - Executes async tasks with concurrency control

### Lazy Initialization

- **CoreLazyInitializer** (`src/CoreLazyInitializer.ts`) - Base implementation for async singleton pattern
- **LazyInitializer** (`src/LazyInitializer.ts`) - Adds reentrant checking to detect circular dependencies
- Supports eager initialization via constructor parameter

### Caching

**CachedProvider** (`src/CachedProvider.ts`) implements TTL-based async cache:
- Double-check locking pattern (check without lock, then with lock)
- Optional custom `cacheTimestamp` function for backdating cache entries
- Uses synchronizer internally to prevent thundering herd

### Task Execution

**TaskExecutor** (`src/TaskExecutor.ts`) processes async generators with concurrency control:
- `maxTasksInFlight` - Total concurrent tasks allowed
- `maxTasksInExecution` - Maximum tasks in execution state (optional)
- Supports `mergeGenerators` utility for combining multiple async generators
- Proper error handling via `onTaskError` callback

### Utilities

- **WeakIndexMap** (`src/WeakIndexMap.ts`) - Maps parameters to weakly-held objects via string keys
  - Automatic garbage collection support with configurable `gcInterval`
  - Used for instance-based synchronizer management

- **ProcessMonitor** (`src/ProcessMonitor.ts`) - Node.js process lifecycle management
  - Listens to SIGINT/SIGTERM signals
  - Provides `wait()` method that respects abort signals
  - `isTerminating` and `isRunning` properties for graceful shutdown

- **mergeGenerators** (`src/utils/mergeGenerators.ts`) - Merges multiple async generators into one

## Key Concepts

### Reentrant Synchronization
On Node.js, the library supports reentrant synchronization using `ReentrantDetector` which tracks execution context via `AsyncLocalStorage`. When a thread tries to re-enter a lock it already holds, by default it's allowed. Set `raiseOnReentrant: true` to throw `SynchronizerReentrantExecutionError`.

### Context and IDs
Every synchronized operation carries context:
- `providerId` - Identifies the SynchronizerProvider (defaults to UUID)
- `synchronizerId` - Identifies the specific Synchronizer (defaults to UUID or descriptive string)
- `executionId` - Unique ID for each synchronized execution (UUID)

### Event System
Events flow through `onEvent` callbacks: `Acquire`, `Acquired`, `Release`, `Timeout`, `Throttle`. Events include context and current stats (numberOfTasks, numberOfRunningTasks, maxConcurrentExecution).

## Testing

- Unit tests are in `test/*.test.ts`
- Sample use cases demonstrating patterns are in `test/samples/*.test.ts`
- `test/utils.ts` provides `delay()` helper for async testing
- `test/StateTransitionChecker.ts` validates synchronizer state transitions

When writing tests, reference the samples directory for idiomatic usage patterns.

## Type System

The `src/types.ts` file contains all public interfaces and type definitions. Key types:
- `SynchronizerContext` - Identifies a specific synchronized execution
- `SynchronizerStats` - Runtime statistics for a synchronizer
- `SynchronizerEvent` - Event data passed to callbacks
- `ISemaphore` - Interface for semaphore-like objects

## Building for Distribution

The library uses tsup for bundling with the following exports:
- CommonJS: `dist/index.js`
- ESM: `dist/index.mjs`
- Types: `dist/index.d.ts`

Target is ES2018 with WeakRef support (es2021.weakref lib).
