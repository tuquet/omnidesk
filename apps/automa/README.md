# 🤖 Automa

**Automa** is the robotic process automation (RPA) and workflow execution engine of the OmniDesk ecosystem.

In accordance with OmniDesk's **Micro-App Isolation** philosophy, the Automa domain is heavily modularized into three distinct architectural components. This ensures a clean separation of concerns between workflow authoring, background execution, and browser interaction.

---

## 📂 Architecture Breakdown

### 1. `dashboard` (The Control Center)
The frontend user interface where users design, monitor, and manage their automation workflows. 
*   **Role**: Visual workflow builder, log viewer, and orchestrator dashboard.
*   **Domain**: Strictly view layer. It does not execute automations itself; it dispatches instructions to the Orchestrator via the OmniDesk API Gateway.

### 2. `orchestrator` (The Brain)
The background execution engine responsible for managing the automation lifecycle.
*   **Role**: Task scheduling, state machine management, workflow parsing, and job dispatching.
*   **Domain**: Pure logic and execution. It reads the workflow definitions (from the local SQLite DB) and dictates what actions should happen and when.

### 3. `extension` (The Hands & Eyes)
A browser extension (typically Chrome/Edge) that bridges the gap between the Orchestrator and the target web environment.
*   **Role**: Action recording, DOM interaction, web scraping, and script injection.
*   **Domain**: Operates strictly within the browser sandbox, executing commands dispatched by the Orchestrator and returning the results (or captured data) back to the system.

---

## 🔄 How They Interact

1. A user builds a workflow in the **`dashboard`** and clicks "Run".
2. The dashboard sends an HTTP request to the **`orchestrator`** (via the local API Gateway).
3. The orchestrator parses the workflow and sends direct commands to the **`extension`** via WebSocket or native messaging.
4. The extension interacts with the live browser, scraping data or clicking buttons, and streams the results back to the orchestrator.
5. The orchestrator logs the results to the local database, which the dashboard reads to display real-time execution progress.
